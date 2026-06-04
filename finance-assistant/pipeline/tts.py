"""
Text-to-Speech — Stage 7 (final) of the pipeline.

Backend: OpenAI TTS (tts-1 or tts-1-hd).
Voice: alloy | echo | fable | onyx | nova | shimmer

Future: support local TTS via Coqui-TTS or Piper when torch is available.
"""
from __future__ import annotations

import time
from openai import OpenAI
from logs.logger import get_logger

_log = get_logger("tts")


class TTSEngine:
    """
    Converts text → MP3 audio bytes using OpenAI TTS.

    Parameters
    ----------
    model: "tts-1" (fast/cheap) or "tts-1-hd" (higher quality).
    voice: One of alloy | echo | fable | onyx | nova | shimmer.
           'alloy' works well for Hinglish/Hindi content.
    speed: 0.25-4.0. 1.0 = normal.
    """

    VOICES = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"]

    def __init__(
        self,
        client:  OpenAI,
        model:   str   = "tts-1",
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
        # Trim text for TTS — cap at 4096 chars (OpenAI limit)
        text = text.strip()[:4_096]
        t0   = time.perf_counter()
        try:
            resp = self._client.audio.speech.create(
                model=self._model,
                voice=self._voice,
                input=text,
                response_format="mp3",
                speed=self._speed,
            )
            ms = (time.perf_counter() - t0) * 1_000
            _log.info(f"TTS | chars={len(text)} | latency={ms:.0f}ms")
            return resp.content
        except Exception as exc:
            _log.error(f"TTS error: {exc}")
            return b""

    @property
    def voice(self) -> str:
        return self._voice

    @voice.setter
    def voice(self, v: str) -> None:
        if v in self.VOICES:
            self._voice = v
            _log.info(f"TTS voice changed → {v}")
