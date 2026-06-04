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

_log = get_logger("agents")


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
                resp = self.client.chat.completions.create(
                    model=self.settings.chat_model,
                    messages=messages,
                    tools=self.TOOLS,
                    tool_choice="auto",
                    max_completion_tokens=self.settings.max_completion_tokens,
                )
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
            stream = self.client.chat.completions.create(
                model=self.settings.chat_model,
                messages=messages,
                tools=self.TOOLS,
                tool_choice="auto",
                stream=True,
                max_completion_tokens=self.settings.max_completion_tokens,
            )

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
