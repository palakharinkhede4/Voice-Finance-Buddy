"""
Agent Router — classifies intent, dispatches to specialist, handles STT/TTS,
security, memory, RAG, logging, and streaming.
"""
import io
import time
from typing import Generator, Optional
from openai import OpenAI
from config.settings import Settings, get_settings
from memory.memory_manager import MemoryManager
from security.validators import validate_input, ValidationError
from security.prompt_guard import PromptGuard
from rag.retriever import RAGRetriever
from logs.logger import get_logger, LatencyTimer
from .expense_agent    import ExpenseAgent
from .budget_agent     import BudgetAgent
from .investment_agent import InvestmentAgent
from .tax_agent        import TaxAgent

_log = get_logger("router")

# ── Intent keywords ────────────────────────────────────────────────────────────

_TAX = [
    "tax", "80c", "80d", "tds", "itr", "income tax", "deduction",
    "old regime", "new regime", "section 80", "cess", "surcharge",
    "tax bachao", "tax saving", "टैक्स", "कर",
]
_INVEST = [
    "sip", "mutual fund", "emi", "loan", "interest rate", "fd", "ppf", "nps",
    "elss", "stock", "share", "sensex", "nifty", "invest", "portfolio",
    "return", "maturity", "compound", "market", "nav", "एसआईपी", "निवेश",
]
_BUDGET = [
    "budget", "over budget", "overspent", "limit", "savings rate",
    "control kharcha", "kharcha kam", "baj gaya", "saving tips",
    "cut expenses", "reduce spending", "बजट", "बचत",
]

AGENT_LABELS = {
    "expense":    "Expense",
    "budget":     "Budget",
    "investment": "Investment",
    "tax":        "Tax",
}


def _classify(text: str) -> str:
    lower = text.lower()
    if any(k in lower for k in _TAX):
        return "tax"
    if any(k in lower for k in _INVEST):
        return "investment"
    if any(k in lower for k in _BUDGET):
        return "budget"
    return "expense"


class AgentRouter:
    """Central orchestrator: security → RAG → memory → agent → response."""

    def __init__(self):
        self.settings = get_settings()
        self.client   = self._make_client()
        self.memory   = MemoryManager(max_turns=self.settings.max_history_turns)
        self.guard    = PromptGuard()
        self.rag      = RAGRetriever(top_k=2)
        self.agents   = {
            "expense":    ExpenseAgent(self.client, self.settings),
            "budget":     BudgetAgent(self.client, self.settings),
            "investment": InvestmentAgent(self.client, self.settings),
            "tax":        TaxAgent(self.client, self.settings),
        }
        _log.info("AgentRouter initialised")

    # ── Standard route ────────────────────────────────────────────────────────

    def route(
        self,
        user_message:         str,
        conversation_history: list[dict],
    ) -> tuple[str, list[dict]]:
        """Route message to agent. Returns (reply, updated_history)."""
        t0 = time.perf_counter()

        # Security
        is_safe, reason = self.guard.check(user_message)
        if not is_safe:
            _log.warning(f"Blocked message | reason={reason[:60]}")
            return reason, conversation_history

        try:
            text = validate_input(user_message, self.settings.max_input_length)
        except ValidationError as e:
            return str(e), conversation_history

        intent     = _classify(text)
        agent_name = AGENT_LABELS[intent]
        rag_ctx    = self.rag.retrieve(text)
        mem_ctx    = self.memory.build_memory_context()

        _log.info(f"route | intent={intent} | input={text[:60]}")

        reply, _ = self.agents[intent].run(
            text, conversation_history, rag_context=rag_ctx + mem_ctx
        )

        self.memory.add_exchange(text, reply, agent=agent_name)

        updated = list(conversation_history) + [
            {"role": "user",      "content": text},
            {"role": "assistant", "content": reply},
        ]
        max_msgs = self.settings.max_history_turns * 2
        if len(updated) > max_msgs:
            updated = updated[-max_msgs:]

        ms = (time.perf_counter() - t0) * 1000
        _log.info(f"route complete | intent={intent} | latency={ms:.0f}ms")
        return reply, updated

    # ── Streaming route ───────────────────────────────────────────────────────

    def stream_route(
        self,
        user_message:         str,
        conversation_history: list[dict],
    ) -> Generator[str, None, None]:
        """
        Stream route: yields text chunks for st.write_stream().
        Also updates memory and conversation history after completion.
        Stores full reply internally; call get_last_reply() after streaming.
        """
        # Security
        is_safe, reason = self.guard.check(user_message)
        if not is_safe:
            _log.warning(f"Blocked (stream) | reason={reason[:60]}")
            self._last_reply = reason
            yield reason
            return

        try:
            text = validate_input(user_message, self.settings.max_input_length)
        except ValidationError as e:
            self._last_reply = str(e)
            yield str(e)
            return

        intent  = _classify(text)
        rag_ctx = self.rag.retrieve(text)
        mem_ctx = self.memory.build_memory_context()

        _log.info(f"stream_route | intent={intent} | input={text[:60]}")

        full_reply = ""
        for chunk in self.agents[intent].stream(
            text, conversation_history, rag_context=rag_ctx + mem_ctx
        ):
            full_reply += chunk
            yield chunk

        self._last_reply       = full_reply
        self._last_intent      = intent
        self._pending_user_msg = text

    def commit_stream(self, conversation_history: list[dict]) -> tuple[str, list[dict]]:
        """
        Call after stream_route() finishes to update memory and history.
        Returns (reply, updated_history).
        """
        reply  = getattr(self, "_last_reply", "")
        intent = getattr(self, "_last_intent", "expense")
        text   = getattr(self, "_pending_user_msg", "")

        if text and reply:
            self.memory.add_exchange(text, reply, agent=AGENT_LABELS[intent])

        updated = list(conversation_history) + [
            {"role": "user",      "content": text},
            {"role": "assistant", "content": reply},
        ]
        max_msgs = self.settings.max_history_turns * 2
        if len(updated) > max_msgs:
            updated = updated[-max_msgs:]

        return reply, updated

    # ── STT / TTS ─────────────────────────────────────────────────────────────

    def transcribe_audio(self, audio_bytes: bytes, filename: str = "recording.wav") -> str:
        """Convert audio → text using Whisper. Forces Hindi."""
        t0 = time.perf_counter()
        audio_file = io.BytesIO(audio_bytes)
        audio_file.name = filename
        response = self.client.audio.transcriptions.create(
            model=self.settings.transcribe_model,
            file=audio_file,
            response_format="json",
            language="hi",
        )
        ms = (time.perf_counter() - t0) * 1000
        _log.info(f"STT | latency={ms:.0f}ms | text={response.text[:60]}")
        return response.text

    def text_to_speech(self, text: str) -> bytes:
        """Convert text → MP3 bytes using OpenAI TTS."""
        t0 = time.perf_counter()
        response = self.client.audio.speech.create(
            model=self.settings.tts_model,
            voice=self.settings.tts_voice,
            input=text,
            response_format="mp3",
        )
        ms = (time.perf_counter() - t0) * 1000
        _log.info(f"TTS | latency={ms:.0f}ms | chars={len(text)}")
        return response.content

    def get_active_agent_name(self, user_message: str) -> str:
        return AGENT_LABELS[_classify(user_message)]

    # ── Private ───────────────────────────────────────────────────────────────

    def _make_client(self) -> OpenAI:
        if self.settings.openai_base_url:
            return OpenAI(api_key=self.settings.openai_api_key,
                          base_url=self.settings.openai_base_url)
        return OpenAI(api_key=self.settings.openai_api_key)
