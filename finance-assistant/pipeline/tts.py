"""
Text-to-Speech — Stage 7 (final) of the pipeline.

Backends:
  1. gTTS (Google Text-to-Speech) — 100% FREE, no API key required.
  2. OpenAI TTS (tts-1 or tts-1-hd) — fallback if OpenAI key is present.
"""
from __future__ import annotations

import io
import time
import tempfile
from openai import OpenAI
from logs.logger import get_logger

_log = get_logger("tts")


class TTSEngine:
    """
    Converts text → MP3 audio bytes using gTTS (free) or OpenAI TTS.
    """

    VOICES = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"]

    def __init__(
        self,
        client:  OpenAI,
        model:   str   = "gtts",
        voice:   str   = "alloy",
        speed:   float = 1.0,
    ):
        self._client  = client
        self._model   = model
        self._voice   = voice if voice in self.VOICES else "alloy"
        self._speed   = max(0.25, min(4.0, speed))
        _log.info(f"TTS engine: model={model} voice={self._voice} speed={self._speed}")

    def synthesize(self, text: str) -> bytes:
        """
        Convert text to MP3 bytes.
        Returns empty bytes on failure (caller should handle gracefully).
        """
        if not text or not text.strip():
            return b""
        text = text.strip()[:4_096]
        t0   = time.perf_counter()

        # Try gTTS (Free Google TTS) first if model is gtts or if OpenAI fails
        if self._model == "gtts" or self._client.api_key in ("free-oss", "dummy", ""):
            audio_bytes = self._gtts_synthesize(text)
            if audio_bytes:
                ms = (time.perf_counter() - t0) * 1_000
                _log.info(f"TTS(gtts) | chars={len(text)} | latency={ms:.0f}ms")
                return audio_bytes

        # OpenAI TTS fallback
        try:
            resp = self._client.audio.speech.create(
                model=self._model if self._model != "gtts" else "tts-1",
                voice=self._voice,
                input=text,
                response_format="mp3",
                speed=self._speed,
            )
            ms = (time.perf_counter() - t0) * 1_000
            _log.info(f"TTS(openai) | chars={len(text)} | latency={ms:.0f}ms")
            return resp.content
        except Exception as exc:
            _log.warning(f"OpenAI TTS error ({exc}) — falling back to gTTS")
            return self._gtts_synthesize(text)

    def _gtts_synthesize(self, text: str) -> bytes:
        try:
            from gtts import gTTS
            tts = gTTS(text=text, lang="en", tld="co.in")
            fp = io.BytesIO()
            tts.write_to_fp(fp)
            fp.seek(0)
            return fp.read()
        except Exception as err:
            _log.error(f"gTTS error: {err}")
            return b""

    @property
    def voice(self) -> str:
        return self._voice

    @voice.setter
    def voice(self, v: str) -> None:
        if v in self.VOICES:
            self._voice = v
            _log.info(f"TTS voice changed → {v}")

