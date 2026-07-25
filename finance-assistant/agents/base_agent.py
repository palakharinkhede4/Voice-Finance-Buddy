"""
Base agent with both run() (standard) and stream() (streaming) support.
All specialist agents inherit from this.
"""
import json
import time
from typing import Generator
from openai import OpenAI
from config.settings import Settings
from logs.logger import get_logger, LatencyTimer

import os

_log = get_logger("agents")


def _get_gemini_key() -> str | None:
    val = os.environ.get("GEMINI_API_KEY") or os.environ.get("GEMINI_KEY") or os.environ.get("GEMINI")
    if val and isinstance(val, str) and val.strip() and val.strip().lower() not in ("dummy", "your_key", "none"):
        return val.strip().strip("'\"")
    try:
        import streamlit as st
        for k in ("GEMINI_API_KEY", "GEMINI_KEY", "GEMINI", "gemini_api_key", "gemini"):
            if k in st.secrets:
                v = st.secrets[k]
                if isinstance(v, str) and v.strip() and v.strip().lower() not in ("dummy", "your_key", "none"):
                    return v.strip().strip("'\"")
    except Exception:
        pass
    return None


class BaseAgent:
    """
    Base class for all ArthBot specialist agents.

    Subclasses define:
        SYSTEM_PROMPT: str
        TOOLS: list
        TOOL_MAP: dict
    """

    SYSTEM_PROMPT: str = ""
    TOOLS:         list = []
    TOOL_MAP:      dict = {}

    def __init__(self, client: OpenAI, settings: Settings):
        self.client   = client
        self.settings = settings

    # ── Standard (non-streaming) ──────────────────────────────────────────────

    def _create_completion_with_fallback(self, messages: list, tools: list = None, tool_choice: str = "auto"):
        kwargs = {
            "model": self.settings.chat_model,
            "messages": messages,
            "max_tokens": self.settings.max_completion_tokens,
        }
        if tools:
            kwargs["tools"] = tools
            kwargs["tool_choice"] = tool_choice

        try:
            return self.client.chat.completions.create(**kwargs)
        except Exception as exc:
            err_str = str(exc).lower()
            if any(w in err_str for w in ("429", "rate limit", "rate_limit", "tokens", "exceeded")):
                _log.warning(f"Primary LLM rate limited (429). Attempting automatic fallback sequence...")

                # Fallback 1: Groq llama-3.1-8b-instant (separate 500,000 TPD bucket)
                if self.settings.chat_model != "llama-3.1-8b-instant" and "groq" in str(getattr(self.client, "base_url", "")).lower():
                    try:
                        _log.info("Fallback Tier 1: Trying Groq llama-3.1-8b-instant...")
                        kwargs["model"] = "llama-3.1-8b-instant"
                        return self.client.chat.completions.create(**kwargs)
                    except Exception as fb1:
                        _log.warning(f"Groq fallback model failed: {fb1}")

                # Fallback 2: Google Gemini (gemini-2.0-flash via GEMINI_API_KEY)
                gemini_key = _get_gemini_key()
                if gemini_key:
                    try:
                        _log.info("Fallback Tier 2: Trying Google Gemini API (gemini-2.0-flash)...")
                        gem_client = OpenAI(
                            api_key=gemini_key,
                            base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
                            max_retries=2,
                            timeout=30.0,
                        )
                        kwargs["model"] = "gemini-2.0-flash"
                        return gem_client.chat.completions.create(**kwargs)
                    except Exception as fb2:
                        _log.warning(f"Gemini fallback failed: {fb2}")

            raise exc

    def run(
        self,
        user_message: str,
        history:      list[dict],
        rag_context:  str = "",
    ) -> tuple[str, list[dict]]:
        """Run agent with tool-calling loop. Returns (reply, messages)."""
        messages = self._build_messages(user_message, history, rag_context)
        name     = self.__class__.__name__

        with LatencyTimer(_log, f"{name}.run"):
            while True:
                try:
                    resp = self._create_completion_with_fallback(
                        messages=messages,
                        tools=self.TOOLS,
                        tool_choice="auto",
                    )
                except Exception as exc:
                    _log.error(f"API Call Error ({name}): {exc}")
                    err_reply = (
                        "⚠️ **API Connection / Key Error**\n\n"
                        "Unable to connect to the cloud AI service. Please verify that **GROQ_API_KEY** or **GEMINI_API_KEY** "
                        "is set in Streamlit Cloud Secrets (**Manage App → Settings → Secrets**).\n\n"
                        f"*Details: {exc}*"
                    )
                    return err_reply, messages

                msg = resp.choices[0].message
                messages.append(msg)

                if not msg.tool_calls:
                    break

                for tc in msg.tool_calls:
                    result = self._call_tool(tc.function.name,
                                             json.loads(tc.function.arguments))
                    messages.append({
                        "role":         "tool",
                        "tool_call_id": tc.id,
                        "content":      json.dumps(result, ensure_ascii=False),
                    })

        return msg.content or "", messages

    # ── Streaming ─────────────────────────────────────────────────────────────

    def stream(
        self,
        user_message: str,
        history:      list[dict],
        rag_context:  str = "",
    ) -> Generator[str, None, str]:
        """
        Streaming agent.
        - Tool calls are executed silently (non-streaming).
        - Final text response is streamed token-by-token.
        Yields string chunks. Returns the full reply.
        """
        messages = self._build_messages(user_message, history, rag_context)
        name     = self.__class__.__name__
        t0       = time.perf_counter()

        while True:
            # Stream the next LLM call
            try:
                stream = self.client.chat.completions.create(
                    model=self.settings.chat_model,
                    messages=messages,
                    tools=self.TOOLS,
                    tool_choice="auto",
                    stream=True,
                    max_tokens=self.settings.max_completion_tokens,
                )
            except Exception as exc:
                _log.error(f"API Stream Error ({name}): {exc}")
                yield (
                    "⚠️ **API Connection / Key Error**\n\n"
                    "Unable to connect to the cloud AI service. Please verify that **GROQ_API_KEY** or **GEMINI_API_KEY** "
                    "is set in Streamlit Cloud Secrets (**Manage App → Settings → Secrets**).\n\n"
                    f"*Details: {exc}*"
                )
                return

            content:     str            = ""
            tool_calls:  dict[int, dict] = {}
            finish:      str            = ""

            for chunk in stream:
                choice = chunk.choices[0]
                delta  = choice.delta

                if choice.finish_reason:
                    finish = choice.finish_reason

                # Accumulate text content and stream to caller
                if delta.content:
                    content += delta.content
                    yield delta.content

                # Accumulate tool call deltas
                if delta.tool_calls:
                    for tc_delta in delta.tool_calls:
                        i = tc_delta.index
                        if i not in tool_calls:
                            tool_calls[i] = {"id": "", "name": "", "arguments": ""}
                        if tc_delta.id:
                            tool_calls[i]["id"] = tc_delta.id
                        if tc_delta.function:
                            if tc_delta.function.name:
                                tool_calls[i]["name"] += tc_delta.function.name
                            if tc_delta.function.arguments:
                                tool_calls[i]["arguments"] += tc_delta.function.arguments

            # No tool calls → final response was streamed, done
            if not tool_calls or finish == "stop":
                ms = (time.perf_counter() - t0) * 1000
                _log.info(f"{name}.stream | finish={finish} | latency={ms:.0f}ms")
                return content

            # Build assistant message with tool calls for history
            tc_list = [
                {
                    "id":   tool_calls[i]["id"],
                    "type": "function",
                    "function": {
                        "name":      tool_calls[i]["name"],
                        "arguments": tool_calls[i]["arguments"],
                    },
                }
                for i in sorted(tool_calls.keys())
            ]
            messages.append({
                "role":       "assistant",
                "content":    content or None,
                "tool_calls": tc_list,
            })

            # Execute tools
            for tc in tc_list:
                fn   = tc["function"]["name"]
                args = json.loads(tc["function"]["arguments"])
                _log.info(f"{name} | tool_call={fn} | args={json.dumps(args)[:120]}")
                result = self._call_tool(fn, args)
                messages.append({
                    "role":         "tool",
                    "tool_call_id": tc["id"],
                    "content":      json.dumps(result, ensure_ascii=False),
                })

    # ── Helpers ───────────────────────────────────────────────────────────────

    def _build_messages(
        self,
        user_message: str,
        history:      list[dict],
        rag_context:  str = "",
    ) -> list[dict]:
        system   = self.SYSTEM_PROMPT + rag_context
        max_msgs = self.settings.max_history_turns * 2
        messages = [{"role": "system", "content": system}]
        messages.extend(history[-max_msgs:])
        messages.append({"role": "user", "content": user_message})
        return messages

    def _call_tool(self, fn_name: str, args: dict) -> dict:
        if fn_name not in self.TOOL_MAP:
            _log.warning(f"Unknown tool requested: {fn_name}")
            return {"error": f"Unknown tool: {fn_name}"}
        try:
            return self.TOOL_MAP[fn_name](**args)
        except Exception as e:
            _log.error(f"Tool error | tool={fn_name} | error={e}")
            return {"error": str(e)}
