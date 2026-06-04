"""
Memory manager: SQLite-backed long-term memory.
Stores user goals, preferences, conversation summaries, and extracted facts.
"""
import re
import uuid
from typing import Optional
from database.db import get_db
from logs.logger import get_logger

_log = get_logger("memory")


class MemoryManager:
    """
    Manages conversation memory and user preferences backed by SQLite.
    Extracts and stores durable facts across sessions.
    """

    def __init__(self, max_turns: int = 20):
        self.max_turns  = max_turns
        self.session_id = str(uuid.uuid4())[:8]
        self._history:  list[dict] = []   # In-memory rolling window
        self._facts:    dict[str, str] = {}
        _log.info(f"MemoryManager init | session={self.session_id}")

    # ── Conversation history ──────────────────────────────────────────────────

    def add_exchange(self, user_msg: str, assistant_msg: str, agent: str = "") -> None:
        """Add a user/assistant exchange to memory."""
        # In-memory rolling window
        self._history.append({"role": "user",      "content": user_msg})
        self._history.append({"role": "assistant",  "content": assistant_msg})
        max_msgs = self.max_turns * 2
        if len(self._history) > max_msgs:
            self._history = self._history[-max_msgs:]

        # Persist to SQLite
        db = get_db()
        db.save_conversation(self.session_id, "user",      user_msg,      agent)
        db.save_conversation(self.session_id, "assistant", assistant_msg, agent)

        # Extract durable facts
        self._extract_facts(user_msg, assistant_msg)

    def get_history(self) -> list[dict]:
        return list(self._history)

    def get_display(self) -> list[tuple]:
        result = []
        for i in range(0, len(self._history) - 1, 2):
            user_msg = self._history[i]["content"]
            asst_msg = self._history[i + 1]["content"] if i + 1 < len(self._history) else ""
            result.append((user_msg, asst_msg))
        return result

    def clear(self) -> None:
        self._history = []
        self._facts   = {}
        self.session_id = str(uuid.uuid4())[:8]
        _log.info(f"Memory cleared | new session={self.session_id}")

    @property
    def is_empty(self) -> bool:
        return len(self._history) == 0

    # ── Goals & preferences ───────────────────────────────────────────────────

    def save_goal(self, category: str, description: str,
                  target_amount: float, deadline: Optional[str] = None) -> None:
        get_db().add_goal(category, description, target_amount, deadline)
        _log.info(f"Goal saved | category={category} | target=₹{target_amount:,.0f}")

    def get_goals(self) -> list[dict]:
        return get_db().get_goals()

    def save_preference(self, key: str, value: str) -> None:
        get_db().set_preference(key, value)
        _log.info(f"Preference saved | key={key} | value={value}")

    def get_preference(self, key: str, default: str = "") -> str:
        return get_db().get_preference(key, default)

    # ── Memory context injection ──────────────────────────────────────────────

    def build_memory_context(self) -> str:
        """Return a short memory snippet for injection into system prompts."""
        parts = []

        # Active facts from this session
        if self._facts:
            fact_lines = [f"- {k}: {v}" for k, v in self._facts.items()]
            parts.append("Session context:\n" + "\n".join(fact_lines))

        # Persistent goals from DB
        goals = self.get_goals()
        if goals:
            goal_lines = [f"- {g['description']} (target: ₹{g['target_amount']:,.0f})"
                          for g in goals[:3]]
            parts.append("User goals:\n" + "\n".join(goal_lines))

        if not parts:
            return ""
        return "\n\nMemory:\n" + "\n\n".join(parts) + "\n"

    # ── Fact extraction ───────────────────────────────────────────────────────

    def _extract_facts(self, user_msg: str, assistant_msg: str) -> None:
        combined = (user_msg + " " + assistant_msg).lower()

        # Savings goal
        m = re.search(r"(save|saving|goal|target)[^\d]*₹?([\d,]+)", combined)
        if m:
            amt = m.group(2).replace(",", "")
            try:
                self._facts["savings_goal"] = f"₹{int(amt):,}"
            except ValueError:
                pass

        # Budget concern
        if any(w in combined for w in ["over budget", "overspent", "baj gaya", "limit exceed"]):
            self._facts["budget_alert"] = "Over-budget alert flagged"

        # Language preference
        hindi_hits = sum(1 for w in ["kitna", "kharcha", "mera", "hai", "aapka", "batao"]
                         if w in combined)
        if hindi_hits >= 2:
            self._facts["language"] = "Hinglish/Hindi"

        # Investment interest
        if any(w in combined for w in ["sip", "mutual fund", "portfolio", "elss", "stocks"]):
            self._facts["interest"] = "Investments/Markets"

        # Tax interest
        if any(w in combined for w in ["tax", "80c", "itr", "deduction"]):
            self._facts["planning"] = "Tax planning"
