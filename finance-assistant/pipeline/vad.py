"""
Voice Activity Detection — Stage 1 of the pipeline.

Primary: Energy-based VAD (pure numpy — zero extra dependencies).
Interface is designed to be silero-vad compatible so the backend can be
swapped to silero when torch is available without changing calling code.

What it does:
  • Decode incoming audio bytes (WAV/any soundfile-readable format)
  • Compute RMS energy per 30ms frame
  • Apply a speech/silence threshold with padding
  • Return trimmed audio bytes containing only speech segments
  • Expose has_speech() for quick gate-keeping before STT
"""
from __future__ import annotations

import io
import wave
import time
from dataclasses import dataclass
from typing import Optional

import numpy as np

from logs.logger import get_logger

_log = get_logger("vad")


@dataclass
class VADResult:
    has_speech:       bool
    speech_ratio:     float          # fraction of frames classified as speech
    original_ms:      int            # original audio duration in ms
    trimmed_ms:       int            # after silence removal
    savings_ms:       int            # ms of silence removed
    audio_bytes:      bytes          # processed (trimmed) audio
    backend:          str = "energy" # "energy" | "silero" | "webrtc"


class EnergyVAD:
    """
    Energy-based Voice Activity Detector.

    Parameters
    ----------
    sample_rate:        Expected sample rate (Hz). Default 16 kHz.
    frame_duration_ms:  Frame length for energy analysis. Default 30 ms.
    energy_threshold:   RMS threshold (0-1 normalised). Tune up for noisy mic.
    min_speech_ms:      Minimum detected speech duration to accept. Default 250 ms.
    padding_ms:         Silence padding kept around speech. Default 300 ms.
    """

    def __init__(
        self,
        sample_rate:       int   = 16_000,
        frame_duration_ms: int   = 30,
        energy_threshold:  float = 0.015,
        min_speech_ms:     int   = 250,
        padding_ms:        int   = 300,
    ):
        self.sample_rate       = sample_rate
        self.frame_size        = int(sample_rate * frame_duration_ms / 1_000)
        self.energy_threshold  = energy_threshold
        self.min_speech_samples = int(sample_rate * min_speech_ms / 1_000)
        self.padding_samples    = int(sample_rate * padding_ms   / 1_000)

    # ── Public API ────────────────────────────────────────────────────────────

    def process(self, audio_bytes: bytes, filename: str = "audio.wav") -> VADResult:
        """
        Run VAD on raw audio bytes.
        Always returns a VADResult — never raises.
        If processing fails, falls back to original audio with has_speech=True.
        """
        t0 = time.perf_counter()
        try:
            samples, actual_sr = self._decode(audio_bytes)
            original_ms = int(len(samples) / actual_sr * 1_000)

            speech, ratio = self._extract_speech(samples)
            has_speech = (speech is not None and
                          len(speech) >= self.min_speech_samples)

            if has_speech and speech is not None:
                out_bytes  = self._encode_wav(speech, actual_sr)
                trimmed_ms = int(len(speech) / actual_sr * 1_000)
            else:
                out_bytes  = audio_bytes
                trimmed_ms = original_ms

            savings_ms = max(0, original_ms - trimmed_ms)
            ms = (time.perf_counter() - t0) * 1_000
            _log.info(
                f"VAD | speech={has_speech} | ratio={ratio:.2f} "
                f"| orig={original_ms}ms trimmed={trimmed_ms}ms "
                f"| saved={savings_ms}ms | latency={ms:.0f}ms"
            )
            return VADResult(
                has_speech=has_speech,
                speech_ratio=ratio,
                original_ms=original_ms,
                trimmed_ms=trimmed_ms,
                savings_ms=savings_ms,
                audio_bytes=out_bytes,
            )

        except Exception as exc:
            _log.warning(f"VAD fallback (error={exc})")
            return VADResult(
                has_speech=True,
                speech_ratio=1.0,
                original_ms=0,
                trimmed_ms=0,
                savings_ms=0,
                audio_bytes=audio_bytes,
            )

    # ── Internals ─────────────────────────────────────────────────────────────

    def _decode(self, audio_bytes: bytes) -> tuple[np.ndarray, int]:
        """Decode audio bytes → (int16 samples, sample_rate)."""
        # Try soundfile first (handles WAV, FLAC, OGG …)
        try:
            import soundfile as sf
            buf = io.BytesIO(audio_bytes)
            samples, sr = sf.read(buf, dtype="int16", always_2d=False)
            if samples.ndim > 1:
                samples = samples[:, 0]   # take left channel
            return samples, sr
        except Exception:
            pass

        # Fallback: stdlib wave module (WAV only)
        buf = io.BytesIO(audio_bytes)
        with wave.open(buf) as wf:
            sr      = wf.getframerate()
            frames  = wf.readframes(wf.getnframes())
            samples = np.frombuffer(frames, dtype=np.int16)
        return samples, sr

    def _extract_speech(
        self, samples: np.ndarray
    ) -> tuple[Optional[np.ndarray], float]:
        """
        Identify speech frames by RMS energy and return trimmed samples.
        Returns (speech_samples | None, speech_ratio).
        """
        float_s = samples.astype(np.float32) / 32_768.0
        n_frames = max(1, len(float_s) // self.frame_size)

        energies = np.array([
            np.sqrt(np.mean(float_s[i * self.frame_size: (i + 1) * self.frame_size] ** 2))
            for i in range(n_frames)
        ])

        is_speech  = energies > self.energy_threshold
        ratio      = float(is_speech.mean())
        speech_idx = np.where(is_speech)[0]

        if len(speech_idx) == 0:
            return None, 0.0

        pad_f  = max(1, self.padding_samples // self.frame_size)
        start  = max(0, int(speech_idx[0])  - pad_f) * self.frame_size
        end    = min(len(samples),
                     (int(speech_idx[-1]) + pad_f + 1) * self.frame_size)

        return samples[start:end], ratio

    def _encode_wav(self, samples: np.ndarray, sample_rate: int) -> bytes:
        buf = io.BytesIO()
        with wave.open(buf, "wb") as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)
            wf.setframerate(sample_rate)
            wf.writeframes(samples.tobytes())
        return buf.getvalue()


# ── Silero VAD ────────────────────────────────────────────────────────────────


class SileroVAD:
    """
    Silero VAD — neural speech/silence detection via ONNX runtime.
    No PyTorch required. Much more robust than energy-based VAD for:
      • Low-volume speech          • Background noise
      • Distant microphone         • Short utterances

    Requires: pip install silero-vad onnxruntime
    Falls back gracefully to EnergyVAD via create_vad() if not available.
    """

    _backend = "silero-vad (ONNX)"

    def __init__(self, sample_rate: int = 16_000, threshold: float = 0.5):
        from silero_vad import load_silero_vad, get_speech_timestamps  # type: ignore
        self._model         = load_silero_vad(onnx=True)
        self._get_timestamps = get_speech_timestamps
        self.sample_rate    = sample_rate
        self._threshold     = threshold
        _log.info("SileroVAD loaded (ONNX) ✓")

    def process(self, audio_bytes: bytes, filename: str = "audio.wav") -> VADResult:
        t0 = time.perf_counter()
        try:
            samples_f32, sr = self._decode_float32(audio_bytes)
            original_ms      = int(len(samples_f32) / sr * 1_000)

            timestamps = self._get_timestamps(
                samples_f32,
                self._model,
                sampling_rate=sr,
                threshold=self._threshold,
                min_speech_duration_ms=250,
                min_silence_duration_ms=300,
                return_seconds=True,
            )

            has_speech = bool(timestamps)

            if has_speech:
                # Extract speech frames (as float32 → scale to int16)
                segments = [
                    (samples_f32[int(ts["start"] * sr): int(ts["end"] * sr)] * 32_768.0
                     ).clip(-32_768, 32_767).astype(np.int16)
                    for ts in timestamps
                ]
                speech_i16 = np.concatenate(segments)
                out_bytes   = self._encode_wav(speech_i16, sr)
                trimmed_ms  = int(len(speech_i16) / sr * 1_000)
                total_speech_s = sum(ts["end"] - ts["start"] for ts in timestamps)
                ratio       = total_speech_s / (original_ms / 1_000)
            else:
                out_bytes  = audio_bytes
                trimmed_ms = original_ms
                ratio      = 0.0

            savings_ms = max(0, original_ms - trimmed_ms)
            ms = (time.perf_counter() - t0) * 1_000
            _log.info(f"SileroVAD | speech={has_speech} | ratio={ratio:.2f} "
                      f"| saved={savings_ms}ms | latency={ms:.0f}ms")
            return VADResult(
                has_speech=has_speech, speech_ratio=ratio,
                original_ms=original_ms, trimmed_ms=trimmed_ms,
                savings_ms=savings_ms, audio_bytes=out_bytes,
                backend="silero-vad (ONNX)",
            )

        except Exception as exc:
            _log.warning(f"SileroVAD error ({exc}) — returning original audio")
            return VADResult(
                has_speech=True, speech_ratio=1.0,
                original_ms=0, trimmed_ms=0, savings_ms=0,
                audio_bytes=audio_bytes, backend="silero-vad (ONNX)",
            )

    # ── Helpers ───────────────────────────────────────────────────────────────

    def _decode_float32(self, audio_bytes: bytes) -> tuple[np.ndarray, int]:
        """Decode audio bytes → float32 numpy array in range [-1, 1]."""
        try:
            import soundfile as sf
            buf = io.BytesIO(audio_bytes)
            samples, sr = sf.read(buf, dtype="float32", always_2d=False)
            if samples.ndim > 1:
                samples = samples[:, 0]
            # Resample to 16 kHz if needed
            if sr != self.sample_rate:
                try:
                    import scipy.signal as _sig
                    samples = _sig.resample(
                        samples, int(len(samples) * self.sample_rate / sr)
                    ).astype(np.float32)
                    sr = self.sample_rate
                except ImportError:
                    pass  # use original sample rate
            return samples, sr
        except Exception:
            # Fallback: stdlib wave
            buf = io.BytesIO(audio_bytes)
            with wave.open(buf) as wf:
                sr     = wf.getframerate()
                frames = wf.readframes(wf.getnframes())
                i16    = np.frombuffer(frames, dtype=np.int16).astype(np.float32)
                return i16 / 32_768.0, sr

    @staticmethod
    def _encode_wav(samples: np.ndarray, sample_rate: int) -> bytes:
        buf = io.BytesIO()
        with wave.open(buf, "wb") as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)
            wf.setframerate(sample_rate)
            wf.writeframes(samples.tobytes())
        return buf.getvalue()


# ── Factory ───────────────────────────────────────────────────────────────────


def create_vad(sample_rate: int = 16_000):
    """
    Returns the best available VAD:
      SileroVAD (ONNX, neural) → EnergyVAD (numpy, energy-based)

    Call once at startup; the returned object is reused for every audio chunk.
    """
    try:
        vad = SileroVAD(sample_rate=sample_rate)
        _log.info("VAD: SileroVAD selected (neural ONNX)")
        return vad
    except Exception as exc:
        _log.info(f"SileroVAD unavailable ({type(exc).__name__}: {exc}) — using EnergyVAD")
        return EnergyVAD(sample_rate=sample_rate)
