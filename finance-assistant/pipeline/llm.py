"""
LLM Backend Abstraction — Stage 6 of the pipeline.

Backends (auto-detected at startup):
  1. Ollama     — local model server (http://localhost:11434)
  2. OpenAI     — cloud API via API key

Auto-detection: on init, we probe Ollama. If it responds and has at
least one model loaded, we use it; otherwise we fall back to OpenAI / cloud provider.

Users can force a backend via settings.llm_backend = "openai" | "ollama".
"""
from __future__ import annotations

import time
from enum import Enum
from typing import Iterator, Optional

from openai import OpenAI

from logs.logger import get_logger

_log = get_logger("llm")


class LLMBackend(str, Enum):
    OPENAI = "Cloud API (Groq / Gemini)"
    OLLAMA = "Ollama (local)"


def _probe_ollama(base_url: str = "http://localhost:11434") -> list[str]:
    """Return list of available Ollama model names, or [] if Ollama is not running."""
    try:
        import requests  # type: ignore
        resp = requests.get(f"{base_url}/api/tags", timeout=2)
        if resp.status_code == 200:
            models = [m["name"] for m in resp.json().get("models", [])]
            if models:
                _log.info(f"Ollama detected | models={models}")
                return models
    except Exception:
        pass
    return []


class LLMEngine:
    """
    Unified LLM engine: OpenAI-compatible API + optional Ollama local fallback.

    Exposes:
      complete(messages, tools, stream) — standard non-streaming call
      stream(messages, tools)           — yields text chunks
    """

    def __init__(
        self,
        openai_client:  OpenAI,
        openai_model:   str = "gpt-4o-mini",
        ollama_url:     str = "http://localhost:11434",
        preferred:      str = "auto",    # "auto" | "openai" | "ollama"
        max_tokens:     int = 1024,
    ):
        self._oa_client   = openai_client
        self._oa_model    = openai_model
        self._max_tokens  = max_tokens
        self._ollama_url  = ollama_url

        # Detect Ollama
        ollama_models = _probe_ollama(ollama_url) if preferred != "openai" else []
        self._ollama_model: Optional[str] = ollama_models[0] if ollama_models else None

        if preferred == "ollama" and self._ollama_model:
            self.backend = LLMBackend.OLLAMA
        elif preferred == "openai" or not self._ollama_model:
            self.backend = LLMBackend.OPENAI
        else:
            # auto: prefer Ollama if available
            self.backend = LLMBackend.OLLAMA if self._ollama_model else LLMBackend.OPENAI

        _log.info(f"LLM backend: {self.backend.value} "
                  f"({'model=' + (self._ollama_model or self._oa_model)})")

    # ── Public ────────────────────────────────────────────────────────────────

    def complete(
        self,
        messages:   list[dict],
        tools:      Optional[list] = None,
        stream:     bool           = False,
    ):
        """
        Single completion call. Returns the raw API response object.
        Routing: Ollama backend uses OpenAI-compatible client pointed at localhost.
        """
        client, model = self._resolve()
        kwargs: dict = dict(
            model=model,
            messages=messages,
            stream=stream,
            max_tokens=self._max_tokens,
        )
        if tools:
            kwargs["tools"]       = tools
            kwargs["tool_choice"] = "auto"

        t0 = time.perf_counter()
        resp = client.chat.completions.create(**kwargs)
        if not stream:
            ms = (time.perf_counter() - t0) * 1_000
            _log.info(f"LLM({self.backend.value}) | latency={ms:.0f}ms | model={model}")
        return resp

    def stream_text(
        self,
        messages: list[dict],
        tools:    Optional[list] = None,
    ) -> Iterator[str]:
        """
        Stream the final text response token-by-token.
        If tool calls are returned, returns empty iterator (use complete() for
        tool-calling loops; only call stream_text for final text-only responses).
        """
        client, model = self._resolve()
        kwargs: dict = dict(
            model=model,
            messages=messages,
            stream=True,
            max_tokens=self._max_tokens,
        )
        if tools:
            kwargs["tools"]       = tools
            kwargs["tool_choice"] = "auto"

        stream_resp = client.chat.completions.create(**kwargs)
        for chunk in stream_resp:
            delta = chunk.choices[0].delta
            if delta.content:
                yield delta.content

    # ── Internals ─────────────────────────────────────────────────────────────

    def _resolve(self) -> tuple[OpenAI, str]:
        """Return (client, model_name) for the active backend."""
        if self.backend == LLMBackend.OLLAMA and self._ollama_model:
            # Ollama exposes an OpenAI-compatible endpoint
            ollama_client = OpenAI(
                api_key="ollama",
                base_url=f"{self._ollama_url}/v1",
            )
            return ollama_client, self._ollama_model
        return self._oa_client, self._oa_model
