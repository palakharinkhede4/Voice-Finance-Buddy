"""
Planner Agent — Meta-agent for complex, multi-step finance queries.

Role:
  Receives a query that involves 2+ finance domains (e.g. "How much tax will I pay
  on my salary, what should I invest in, and am I over budget this month?").

Workflow:
  1. Calls GPT with a planning prompt → receives a JSON plan:
     [{"intent": "tax", "sub_query": "…"}, {"intent": "investment", "sub_query": "…"}, …]
  2. Dispatches each sub-task to the appropriate specialist agent (ExpenseAgent,
     BudgetAgent, InvestmentAgent, TaxAgent) sequentially.
  3. Synthesises all results into a single, coherent reply.

Streaming:
  The plan step is synchronous; synthesis is streamed token-by-token.
"""
from __future__ import annotations

import json
import time
from typing import Generator

from openai import OpenAI
from config.settings import Settings
from logs.logger import get_logger

_log = get_logger("planner")

_PLAN_PROMPT = """\
You are a planning module for an AI finance assistant.
Given a user's query, create a plan that breaks it into 1-4 sub-tasks.
Each sub-task targets one specialist domain.

Domains:
  expense    — account balance, transactions, spending history
  budget     — budget limits, savings analysis, overspending
  investment — SIP, stocks, mutual funds, FD, EMI, markets
  tax        — income tax, deductions, 80C, TDS, regimes

Return ONLY a JSON array (no markdown, no extra text):
[{"intent": "<domain>", "sub_query": "<specific question>"}, ...]

User query: "{query}"
"""

_SYNTHESIS_PROMPT = """\
You are ArthBot, a personal finance AI for Indian users. You speak naturally in
Hindi/Hinglish/English based on the user's language.

The user asked: "{query}"

You ran a multi-agent plan and got these results:

{results_block}

Now write ONE concise, friendly, comprehensive answer that:
- Covers all the results above clearly
- Uses ₹ for amounts
- Gives practical advice
- Stays under 400 words
- Matches the language the user used
"""


class PlannerAgent:
    """
    Meta-agent: decomposes → dispatches → synthesises.
    Agents dict must be passed in at construction (avoids circular imports).
    """

    def __init__(
        self,
        client:   OpenAI,
        settings: Settings,
        agents:   dict,      # {"expense": ExpenseAgent, …}
    ):
        self.client   = client
        self.settings = settings
        self._agents  = agents

    # ── Standard (non-streaming) ──────────────────────────────────────────────

    def run(
        self,
        user_message: str,
        history:      list[dict],
        rag_context:  str = "",
    ) -> tuple[str, list[dict]]:
        t0   = time.perf_counter()
        plan = self._plan(user_message)
        _log.info(f"Planner | plan={json.dumps(plan)[:120]}")

        results = self._dispatch_all(plan, history, rag_context)
        reply   = self._synthesise(user_message, results)

        ms = (time.perf_counter() - t0) * 1_000
        _log.info(f"Planner done | sub_tasks={len(plan)} | latency={ms:.0f}ms")
        return reply, []

    # ── Streaming ─────────────────────────────────────────────────────────────

    def stream(
        self,
        user_message: str,
        history:      list[dict],
        rag_context:  str = "",
    ) -> Generator[str, None, None]:
        plan    = self._plan(user_message)
        _log.info(f"Planner (stream) | plan={json.dumps(plan)[:120]}")
        results = self._dispatch_all(plan, history, rag_context)
        yield from self._synthesise_stream(user_message, results)

    # ── Internals ─────────────────────────────────────────────────────────────

    def _plan(self, query: str) -> list[dict]:
        """Ask GPT to decompose the query into sub-tasks. Returns list of dicts."""
        try:
            resp = self.client.chat.completions.create(
                model=self.settings.chat_model,
                messages=[{
                    "role":    "user",
                    "content": _PLAN_PROMPT.format(query=query),
                }],
                temperature=0,
                max_tokens=512,
            )
            raw  = resp.choices[0].message.content or "[]"
            plan = json.loads(raw)
            if isinstance(plan, list) and all(isinstance(p, dict) for p in plan):
                return plan[:4]   # cap at 4 sub-tasks
        except Exception as exc:
            _log.warning(f"Planning LLM error: {exc}")

        # Fallback: single expense sub-task
        return [{"intent": "expense", "sub_query": query}]

    def _dispatch_all(
        self,
        plan:        list[dict],
        history:     list[dict],
        rag_context: str,
    ) -> list[dict]:
        """Run each sub-task through the appropriate agent."""
        results = []
        for step in plan:
            intent    = step.get("intent", "expense")
            sub_query = step.get("sub_query", "")
            agent     = self._agents.get(intent, self._agents["expense"])

            _log.info(f"Planner dispatching | intent={intent} | q={sub_query[:60]}")
            try:
                reply, _ = agent.run(sub_query, history, rag_context=rag_context)
                results.append({"intent": intent, "query": sub_query, "reply": reply})
            except Exception as exc:
                _log.error(f"Sub-task error | intent={intent} | {exc}")
                results.append({"intent": intent, "query": sub_query,
                                "reply": f"Error: {exc}"})
        return results

    def _build_results_block(self, results: list[dict]) -> str:
        blocks = []
        for r in results:
            blocks.append(
                f"[{r['intent'].upper()} AGENT]\n"
                f"Query: {r['query']}\n"
                f"Answer: {r['reply']}"
            )
        return "\n\n".join(blocks)

    def _synthesise(self, query: str, results: list[dict]) -> str:
        prompt = _SYNTHESIS_PROMPT.format(
            query=query,
            results_block=self._build_results_block(results),
        )
        try:
            resp = self.client.chat.completions.create(
                model=self.settings.chat_model,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=self.settings.max_completion_tokens,
            )
            return resp.choices[0].message.content or ""
        except Exception as exc:
            _log.error(f"Synthesis error: {exc}")
            # Fall back: join raw results
            return "\n\n".join(
                f"**{r['intent'].title()}:** {r['reply']}" for r in results
            )

    def _synthesise_stream(
        self, query: str, results: list[dict]
    ) -> Generator[str, None, None]:
        prompt = _SYNTHESIS_PROMPT.format(
            query=query,
            results_block=self._build_results_block(results),
        )
        try:
            stream = self.client.chat.completions.create(
                model=self.settings.chat_model,
                messages=[{"role": "user", "content": prompt}],
                stream=True,
                max_tokens=self.settings.max_completion_tokens,
            )
            for chunk in stream:
                delta = chunk.choices[0].delta
                if delta.content:
                    yield delta.content
        except Exception as exc:
            _log.error(f"Synthesis stream error: {exc}")
            yield "\n\n".join(
                f"**{r['intent'].title()}:** {r['reply']}" for r in results
            )
