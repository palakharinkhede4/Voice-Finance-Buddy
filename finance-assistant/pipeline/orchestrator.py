"""
FinancePipeline — Full 7-stage orchestrator.

Stage 4 now uses an LLM intent classifier (GPT-4o-mini, max_tokens=5,
temperature=0) instead of keyword matching — falls back to keywords on error.

New intent: "planning" → PlannerAgent for multi-domain queries.

VAD: tries SileroVAD (ONNX) first, falls back to EnergyVAD.
RAG: auto-selects FAISS (sentence-transformers) or TF-IDF.
"""
from __future__ import annotations

import time
from dataclasses import dataclass, field
from typing import Generator, Optional

from openai import OpenAI

from config.settings import Settings, get_settings
from security.prompt_guard import PromptGuard
from security.validators import validate_input, ValidationError
from rag.retriever import RAGRetriever, RAG_BACKEND
from memory.memory_manager import MemoryManager
from agents.expense_agent    import ExpenseAgent
from agents.budget_agent     import BudgetAgent
from agents.investment_agent import InvestmentAgent
from agents.tax_agent        import TaxAgent
from agents.planner_agent    import PlannerAgent
from logs.logger import get_logger

from .vad import create_vad, VADResult
from .stt import STTEngine, STTBackend
from .llm import LLMEngine, LLMBackend
from .tts import TTSEngine

_log = get_logger("pipeline")

# ── Intent keywords (keyword-fallback classifier) ─────────────────────────────

_TAX_KW    = ["tax","80c","80d","tds","itr","income tax","deduction",
               "old regime","new regime","section 80","टैक्स","कर"]
_INVEST_KW = ["sip","mutual fund","emi","loan","fd","ppf","nps","elss",
               "stock","share","sensex","nifty","invest","portfolio",
               "return","maturity","market","nav","एसआईपी","निवेश","dollar","currency"]
_BUDGET_KW = ["budget","over budget","overspent","limit","savings rate",
               "cut expenses","reduce spending","बजट","बचत"]
_PLAN_KW   = ["plan","comprehensive","overall","suggest","advice","strategy",
               "kya karu","suggest karo","financial health","complete review",
               "सलाह","योजना"]

AGENT_LABELS = {
    "expense":    "Expense",
    "budget":     "Budget",
    "investment": "Investment",
    "tax":        "Tax",
    "planning":   "Planner",
}


def _classify_keywords(text: str) -> str:
    lower = text.lower()
    if any(k in lower for k in _PLAN_KW):   return "planning"
    if any(k in lower for k in _TAX_KW):    return "tax"
    if any(k in lower for k in _INVEST_KW): return "investment"
    if any(k in lower for k in _BUDGET_KW): return "budget"
    return "expense"


_CLASSIFY_PROMPT = """\
Classify this Indian personal finance query into ONE category.

Categories:
  expense    — balance, transactions, spending history, account info
  budget     — budget limits, overspending, savings goals
  investment — SIP, stocks, mutual fund, FD, EMI, markets, returns, currency
  tax        — income tax, 80C, TDS, ITR, deductions, tax regime
  planning   — complex query spanning 2+ domains, or asks for comprehensive financial advice

Query: "{text}"

Reply with ONLY the category name (one word, lowercase):"""


# ── Result objects ────────────────────────────────────────────────────────────

@dataclass
class StageTime:
    name:       str
    backend:    str
    latency_ms: float
    skipped:    bool = False
    note:       str  = ""


@dataclass
class PipelineResult:
    transcript:   str   = ""
    response:     str   = ""
    audio_bytes:  bytes = b""
    agent_name:   str   = ""
    blocked:      bool  = False
    block_reason: str   = ""

    stages: list[StageTime] = field(default_factory=list)

    stt_backend: str = ""
    llm_backend: str = ""
    vad_backend: str = ""
    rag_backend: str = ""

    @property
    def total_ms(self) -> float:
        return sum(s.latency_ms for s in self.stages)

    def add_stage(self, name: str, backend: str,
                  t0: float, skipped: bool = False, note: str = "") -> None:
        self.stages.append(StageTime(
            name=name, backend=backend,
            latency_ms=(time.perf_counter() - t0) * 1_000,
            skipped=skipped, note=note,
        ))


# ── Pipeline ──────────────────────────────────────────────────────────────────

class FinancePipeline:
    """
    Full ArthBot pipeline. Initialise once; call process_audio() or process_text().
    """

    def __init__(self, settings: Optional[Settings] = None):
        self.settings = settings or get_settings()
        self.client   = self._make_client()

        # Stage 1: VAD — Silero (ONNX) → EnergyVAD fallback
        self.vad = create_vad()

        # Stage 2: STT — faster-whisper → OpenAI Whisper
        self.stt = STTEngine(
            openai_client=self.client,
            openai_model=self.settings.transcribe_model,
            fw_model_size=self.settings.fw_model_size,
            default_lang="hi",
        )

        # Stage 6: LLM — Ollama → OpenAI
        self.llm = LLMEngine(
            openai_client=self.client,
            openai_model=self.settings.chat_model,
            ollama_url=self.settings.ollama_url,
            preferred=self.settings.llm_backend,
            max_tokens=self.settings.max_completion_tokens,
        )

        # Stage 7: TTS
        self.tts = TTSEngine(
            client=self.client,
            model=self.settings.tts_model,
            voice=self.settings.tts_voice,
        )

        # Cross-cutting
        self.guard  = PromptGuard()
        self.rag    = RAGRetriever(top_k=3)
        self.memory = MemoryManager(max_turns=self.settings.max_history_turns)

        # Specialist agents
        self._agents: dict = {
            "expense":    ExpenseAgent(self.client, self.settings),
            "budget":     BudgetAgent(self.client, self.settings),
            "investment": InvestmentAgent(self.client, self.settings),
            "tax":        TaxAgent(self.client, self.settings),
        }
        # Planner gets refs to the other agents
        self._agents["planning"] = PlannerAgent(self.client, self.settings, self._agents)

        _log.info(
            f"FinancePipeline ready | "
            f"VAD={self.vad_backend} | STT={self.stt.backend.value} | "
            f"LLM={self.llm.backend.value} | RAG={RAG_BACKEND}"
        )

    # ── Properties ────────────────────────────────────────────────────────────

    @property
    def vad_backend(self) -> str:
        return getattr(self.vad, "_backend", "energy-based (numpy)")

    # ── Public utilities ──────────────────────────────────────────────────────

    def classify_intent(self, text: str) -> str:
        """Quick keyword-based classification (for UI hints, no LLM call)."""
        return _classify_keywords(text)

    def get_agent_name(self, text: str) -> str:
        """Return agent display name for a query (keyword-based, no LLM cost)."""
        return AGENT_LABELS[_classify_keywords(text)]

    # ── LLM Intent Classifier ─────────────────────────────────────────────────

    def _llm_classify(self, text: str) -> tuple[str, str]:
        """
        Returns (intent, backend_label).
        Tries GPT-4o-mini classification; falls back to keywords.
        Fast: max_tokens=5, temperature=0, no tools.
        """
        try:
            resp = self.client.chat.completions.create(
                model=self.settings.chat_model,
                messages=[{
                    "role":    "user",
                    "content": _CLASSIFY_PROMPT.format(text=text[:500]),
                }],
                max_tokens=5,
                temperature=0,
            )
            intent = resp.choices[0].message.content.strip().lower().split()[0]
            if intent in AGENT_LABELS:
                _log.info(f"LLM classifier → {intent}")
                return intent, self.settings.chat_model
        except Exception as exc:
            _log.debug(f"LLM classifier fallback ({exc})")

        intent = _classify_keywords(text)
        _log.info(f"Keyword classifier → {intent}")
        return intent, "keyword-fallback"

    # ── Audio pipeline ────────────────────────────────────────────────────────

    def process_audio(
        self,
        audio_bytes:  bytes,
        history:      list[dict],
        tts_enabled:  bool = True,
    ) -> PipelineResult:
        result = PipelineResult(
            stt_backend=self.stt.backend.value,
            llm_backend=self.llm.backend.value,
            vad_backend=self.vad_backend,
            rag_backend=RAG_BACKEND,
        )

        # ① VAD
        t0         = time.perf_counter()
        vad_result = self.vad.process(audio_bytes)
        result.add_stage("① VAD", self.vad_backend, t0,
                         note=f"speech={vad_result.speech_ratio:.0%} "
                              f"saved={vad_result.savings_ms}ms")
        if not vad_result.has_speech:
            result.blocked     = True
            result.block_reason = "No speech detected in audio."
            return result

        # ② STT
        t0 = time.perf_counter()
        try:
            transcript = self.stt.transcribe(vad_result.audio_bytes)
        except Exception as exc:
            result.blocked     = True
            result.block_reason = f"Transcription failed: {exc}"
            return result
        result.transcript = transcript
        result.add_stage("② STT", self.stt.backend.value, t0)

        return self._text_stages(transcript, history, result, tts_enabled)

    # ── Text pipeline ─────────────────────────────────────────────────────────

    def process_text(
        self,
        text:        str,
        history:     list[dict],
        tts_enabled: bool = True,
    ) -> PipelineResult:
        result = PipelineResult(
            transcript=text,
            stt_backend="—", llm_backend=self.llm.backend.value,
            vad_backend="—", rag_backend=RAG_BACKEND,
        )
        result.add_stage("① VAD", "—", time.perf_counter(), skipped=True)
        result.add_stage("② STT", "—", time.perf_counter(), skipped=True)
        return self._text_stages(text, history, result, tts_enabled)

    # ── Streaming ─────────────────────────────────────────────────────────────

    def stream_text(
        self,
        text:    str,
        history: list[dict],
    ) -> Generator[str, None, None]:
        result = PipelineResult(
            transcript=text, stt_backend="—",
            llm_backend=self.llm.backend.value,
            vad_backend="—", rag_backend=RAG_BACKEND,
        )

        # ③ Security
        t0 = time.perf_counter()
        is_safe, reason = self.guard.check(text)
        if not is_safe:
            result.blocked = True; result.block_reason = reason
            result.add_stage("③ Security", "PromptGuard", t0, note="BLOCKED")
            self._last_result = result
            yield reason
            return
        try:
            text = validate_input(text, self.settings.max_input_length)
        except ValidationError as exc:
            yield str(exc); return
        result.add_stage("③ Security", "PromptGuard", t0)

        # ④ Router (LLM classifier)
        t0 = time.perf_counter()
        intent, cls_backend = self._llm_classify(text)
        result.agent_name = AGENT_LABELS[intent]
        result.add_stage("④ Router", cls_backend, t0, note=f"→ {result.agent_name}")

        # ⑤ RAG
        t0 = time.perf_counter()
        rag_ctx = self.rag.retrieve(text)
        mem_ctx = self.memory.build_memory_context()
        result.add_stage("⑤ RAG", RAG_BACKEND[:20], t0)

        # ⑥ Tool+Mem+LLM (streaming)
        t0         = time.perf_counter()
        full_reply = ""
        for chunk in self._agents[intent].stream(
            text, history, rag_context=rag_ctx + mem_ctx
        ):
            full_reply += chunk
            yield chunk

        result.response = full_reply
        result.add_stage("⑥ Tool+Mem+LLM", self.llm.backend.value, t0)
        self.memory.add_exchange(text, full_reply, agent=result.agent_name)
        self._last_result = result

    def get_last_stream_result(self) -> Optional[PipelineResult]:
        return getattr(self, "_last_result", None)

    # ── Shared text stages ────────────────────────────────────────────────────

    def _text_stages(
        self, text: str, history: list[dict],
        result: PipelineResult, tts_enabled: bool,
    ) -> PipelineResult:

        # ③ Security
        t0 = time.perf_counter()
        is_safe, reason = self.guard.check(text)
        if not is_safe:
            result.blocked = True; result.block_reason = reason
            result.response = reason
            result.add_stage("③ Security", "PromptGuard", t0, note="BLOCKED")
            return result
        try:
            text = validate_input(text, self.settings.max_input_length)
        except ValidationError as exc:
            result.blocked = True; result.block_reason = str(exc)
            result.response = str(exc)
            result.add_stage("③ Security", "PromptGuard", t0, note="REJECTED")
            return result
        result.add_stage("③ Security", "PromptGuard", t0)

        # ④ Router (LLM intent classifier)
        t0 = time.perf_counter()
        intent, cls_backend = self._llm_classify(text)
        result.agent_name = AGENT_LABELS[intent]
        result.add_stage("④ Router", cls_backend, t0, note=f"→ {result.agent_name}")

        # ⑤ RAG
        t0      = time.perf_counter()
        rag_ctx = self.rag.retrieve(text)
        mem_ctx = self.memory.build_memory_context()
        result.add_stage("⑤ RAG", RAG_BACKEND[:20], t0)

        # ⑥ Tool + Memory + LLM
        t0 = time.perf_counter()
        reply, _ = self._agents[intent].run(
            text, history, rag_context=rag_ctx + mem_ctx
        )
        result.response = reply
        result.add_stage("⑥ Tool+Mem+LLM", self.llm.backend.value, t0)
        self.memory.add_exchange(text, reply, agent=result.agent_name)

        # ⑦ TTS
        if tts_enabled and reply:
            t0 = time.perf_counter()
            result.audio_bytes = self.tts.synthesize(reply)
            result.add_stage("⑦ TTS", "gTTS", t0)
        else:
            result.add_stage("⑦ TTS", "gTTS",
                             time.perf_counter(), skipped=not tts_enabled)

        _log.info(f"Pipeline done | agent={result.agent_name} | total={result.total_ms:.0f}ms")
        return result

    def _make_client(self) -> OpenAI:
        s = self.settings
        if s.openai_base_url:
            return OpenAI(api_key=s.openai_api_key, base_url=s.openai_base_url)
        if s.openai_api_key == "free-oss":
            return OpenAI(api_key="ollama", base_url=f"{s.ollama_url}/v1")
        return OpenAI(api_key=s.openai_api_key or "free-oss")

