"""
Conversation store: manages rolling conversation history.
Keeps the last N turns to avoid token overflow.
"""
from typing import Optional


class ConversationStore:
    """
    Stores conversation turns as (role, content) pairs.
    Automatically evicts old turns beyond max_turns.
    """

    def __init__(self, max_turns: int = 20):
        self.max_turns = max_turns
        self._history: list[dict] = []

    def add_user(self, content: str) -> None:
        self._history.append({"role": "user", "content": content})
        self._trim()

    def add_assistant(self, content: str) -> None:
        self._history.append({"role": "assistant", "content": content})
        self._trim()

    def add_pair(self, user_msg: str, assistant_msg: str) -> None:
        self._history.append({"role": "user",      "content": user_msg})
        self._history.append({"role": "assistant", "content": assistant_msg})
        self._trim()

    def get_history(self) -> list[dict]:
        """Return the full history as list of role/content dicts."""
        return list(self._history)

    def get_display(self) -> list[tuple[str, str]]:
        """Return list of (role, content) tuples for UI rendering."""
        return [(m["role"], m["content"]) for m in self._history]

    def clear(self) -> None:
        self._history = []

    def _trim(self) -> None:
        max_msgs = self.max_turns * 2
        if len(self._history) > max_msgs:
            self._history = self._history[-max_msgs:]

    def __len__(self) -> int:
        return len(self._history)

    @property
    def is_empty(self) -> bool:
        return len(self._history) == 0
