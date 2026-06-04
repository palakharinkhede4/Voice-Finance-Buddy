"""
Speech-to-Text — Stage 2 of the pipeline.

Backends (tried in order):
  1. faster-whisper  — local model, no API cost, runs on CPU with int8 quantisation
  2. OpenAI Whisper  — API call via Replit AI Integrations or direct OpenAI key

The backend is selected once at startup and logged. Callers always use
STTEngine.transcribe() — the backend is transparent.
"""
from __future__ import annotations

import io
import time
from enum import Enum
from typing import Optional

from openai import OpenAI

from logs.logger import get_logger

_log = get_logger("stt")


class STTBackend(str, Enum):
    FASTER_WHISPER = "faster-whisper (local)"
    OPENAI_WHISPER = "OpenAI Whisper (API)"


def _try_load_faster_whisper(model_size: str = "tiny") -> Optional[object]:
    """
    Attempt to load a faster-whisper WhisperModel.
    Returns the model on success, None on any failure.
    'tiny' is ~75 MB — multilingual, reasonable for CPU.
    """
    try:
        from faster_whisper import WhisperModel  # type: ignore
        _log.info(f"Loading faster-whisper model='{model_size}' device=cpu compute=int8 …")
        model = WhisperModel(model_size, device="cpu", compute_type="int8")
        _log.info("faster-whisper model loaded ✓")
        return model
    except ImportError:
        _log.info("faster-whisper not installed — will use OpenAI Whisper API")
    except Exception as exc:
        _log.warning(f"faster-whisper load failed ({exc}) — falling back to OpenAI Whisper API")
    return None


class STTEngine:
    """
    Unified Speech-to-Text engine.

    Priority:
      faster-whisper local model  →  OpenAI Whisper API
    """

    def __init__(
        self,
        openai_client: OpenAI,
        openai_model:  str  = "whisper-1",
        fw_model_size: str  = "tiny",
        default_lang:  str  = "hi",
    ):
        self._client        = openai_client
        self._openai_model  = openai_model
        self._default_lang  = default_lang
        self._fw_model      = _try_load_faster_whisper(fw_model_size)
        self.backend        = (STTBackend.FASTER_WHISPER
                               if self._fw_model else STTBackend.OPENAI_WHISPER)
        _log.info(f"STT backend: {self.backend.value}")

    # ── Public ────────────────────────────────────────────────────────────────

    def transcribe(self, audio_bytes: bytes, language: str = "") -> str:
        """
        Transcribe audio bytes → text.
        language: ISO-639-1 code ('hi', 'en') or '' for auto-detect.
        Falls back to the other backend on error.
        """
        lang = language or self._default_lang
        t0   = time.perf_counter()

        if self._fw_model:
            try:
                text = self._fw_transcribe(audio_bytes, lang)
                ms   = (time.perf_counter() - t0) * 1_000
                _log.info(f"STT(faster-whisper) | lang={lang} | latency={ms:.0f}ms | text={text[:60]}")
                return text
            except Exception as exc:
                _log.warning(f"faster-whisper error ({exc}) — retrying via OpenAI Whisper")

        text = self._openai_transcribe(audio_bytes, lang)
        ms   = (time.perf_counter() - t0) * 1_000
        _log.info(f"STT(openai) | lang={lang} | latency={ms:.0f}ms | text={text[:60]}")
        return text

    # ── Internals ─────────────────────────────────────────────────────────────

    def _fw_transcribe(self, audio_bytes: bytes, language: str) -> str:
        buf = io.BytesIO(audio_bytes)
        segments, _ = self._fw_model.transcribe(
            buf,
            language=language,
            beam_size=5,
            vad_filter=False,           # We already ran our own VAD
            condition_on_previous_text=True,
        )
        return " ".join(seg.text.strip() for seg in segments).strip()

    def _openai_transcribe(self, audio_bytes: bytes, language: str) -> str:
        buf       = io.BytesIO(audio_bytes)
        buf.name  = "recording.wav"
        resp = self._client.audio.transcriptions.create(
            model=self._openai_model,
            file=buf,
            response_format="json",
            language=language or "hi",
        )
        return resp.text.strip()
