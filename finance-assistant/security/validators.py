"""
Input validation: length limits, character checks, language sanity.
"""
import re
from typing import Optional


class ValidationError(Exception):
    """Raised when user input fails validation."""
    pass


_ALLOWED_PATTERN = re.compile(
    r"^[\w\s\u0900-\u097F\u0980-\u09FF₹.,!?@#\-/:()'\"]+$",
    re.UNICODE,
)

_SUSPICIOUS = [
    "ignore previous",
    "ignore all previous",
    "disregard",
    "you are now",
    "act as",
    "pretend you are",
    "forget your instructions",
    "new persona",
    "system:",
    "assistant:",
    "<|",
    "|>",
]


def validate_input(text: str, max_length: int = 1000) -> str:
    """
    Validate and clean user input.
    Returns cleaned text or raises ValidationError.
    """
    if not text or not text.strip():
        raise ValidationError("Input is empty.")

    text = text.strip()

    if len(text) > max_length:
        raise ValidationError(
            f"Input is too long ({len(text)} chars). Please keep it under {max_length} characters."
        )

    # Check for prompt injection patterns
    lower = text.lower()
    for pat in _SUSPICIOUS:
        if pat in lower:
            raise ValidationError(
                "Invalid input detected. Please ask a finance-related question."
            )

    return text
