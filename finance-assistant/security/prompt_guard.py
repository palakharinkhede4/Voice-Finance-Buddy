"""
Prompt guard: detects and blocks prompt injection, jailbreaks, and off-topic abuse.
All user messages MUST pass through check() before reaching any LLM.
"""
import re
from logs.logger import get_logger

_log = get_logger("security")

# ── Injection & jailbreak patterns ────────────────────────────────────────────

_INJECTION_RE = [
    re.compile(r"ignore\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?|context)", re.I),
    re.compile(r"(reveal|show|print|display|output|repeat|tell me)\s+(your\s+)?(system\s+prompt|hidden\s+prompt|instructions?|prompt)", re.I),
    re.compile(r"(you are|act as|pretend|roleplay|play the role|simulate|imagine you are)", re.I),
    re.compile(r"(jailbreak|DAN|do anything now|developer\s+mode|god\s+mode)", re.I),
    re.compile(r"forget\s+(your|all|previous|the|these)\s*(instructions?|rules?|constraints?)?", re.I),
    re.compile(r"<\|?(system|user|assistant|im_start|im_end|endoftext)\|?>", re.I),
    re.compile(r"new\s+(persona|identity|role|character|mode)", re.I),
    re.compile(r"(override|bypass|disable|remove)\s+(safety|filter|guard|restriction|rule)", re.I),
    re.compile(r"(tool\s+abuse|execute\s+code|run\s+command|shell|subprocess|os\.system)", re.I),
    re.compile(r"(developer\s+message|system\s+message|hidden\s+message|secret\s+prompt)", re.I),
    re.compile(r"what\s+(are\s+your\s+instructions|is\s+your\s+system\s+prompt|were\s+you\s+told)", re.I),
]

# ── Hard off-topic patterns ───────────────────────────────────────────────────

_OFF_TOPIC = [
    "write code", "write a program", "write a script", "debug this",
    "hack", "password", "exploit", "vulnerability",
    "write an essay", "write a poem", "translate this document",
    "recipe", "dating", "adult content", "weapon", "illegal",
    "generate image", "draw", "create music",
]


class PromptGuard:
    """
    Guards against prompt injection and hard off-topic requests.
    Use check() before passing any user input to an LLM.
    """

    def check(self, text: str) -> tuple[bool, str]:
        """
        Returns (is_safe, reason).
        is_safe=True → input can proceed.
        is_safe=False → return reason to user, DO NOT call LLM.
        """
        lower = text.lower()

        # Injection / jailbreak detection
        for pattern in _INJECTION_RE:
            if pattern.search(text):
                _log.warning(f"SECURITY VIOLATION | pattern={pattern.pattern[:40]} | input={text[:80]}")
                return False, "Request blocked for security reasons."

        # Hard off-topic block
        for phrase in _OFF_TOPIC:
            if phrase in lower:
                _log.info(f"OFF_TOPIC blocked | phrase='{phrase}' | input={text[:80]}")
                return False, (
                    "I'm a personal finance assistant and can't help with that. "
                    "Please ask about your finances, expenses, investments, or taxes!"
                )

        return True, ""

    def is_finance_related(self, text: str) -> bool:
        """Heuristic: does the text look finance-related?"""
        keywords = [
            "balance", "expense", "spend", "income", "salary", "investment",
            "mutual fund", "sip", "emi", "loan", "tax", "budget", "saving",
            "transaction", "account", "bank", "credit", "debit", "market",
            "kitna", "kharcha", "paisa", "rupee", "paise", "bachat",
            "nifty", "sensex", "fd", "ppf", "nps", "elss",
        ]
        lower = text.lower()
        return any(kw in lower for kw in keywords)
