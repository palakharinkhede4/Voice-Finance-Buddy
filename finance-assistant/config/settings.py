"""
Centralized configuration for ArthBot.
Auto-detects Replit AI Integrations vs local OpenAI key.
Pipeline backend settings (faster-whisper, Ollama) read from env vars.
"""
import os
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class Settings:
    # OpenAI / Replit AI Integrations
    openai_api_key:  str
    openai_base_url: Optional[str]

    # Models
    chat_model:       str
    transcribe_model: str
    tts_model:        str
    tts_voice:        str

    # Pipeline: STT
    fw_model_size: str  # faster-whisper model: "tiny" | "base" | "small"

    # Pipeline: LLM
    llm_backend: str    # "auto" | "openai" | "ollama"
    ollama_url:  str    # Ollama server URL

    # Generation
    max_completion_tokens: int
    max_history_turns:     int
    max_input_length:      int

    # App metadata
    app_title:      str
    app_icon:       str
    user_name:      str
    account_number: str

    # Budget limits (used as defaults; SQLite is authoritative at runtime)
    budgets: dict = field(default_factory=lambda: {
        "food":          5000,
        "grocery":       6000,
        "transport":     3000,
        "entertainment": 3000,
        "shopping":      8000,
        "utilities":     5000,
        "health":        4000,
        "housing":       20000,
        "education":     2000,
        "travel":        10000,
    })


def get_settings() -> Settings:
    # ── Replit AI Integrations (auto-injected env vars) ───────────────────────
    replit_base_url = os.environ.get("AI_INTEGRATIONS_OPENAI_BASE_URL")
    replit_api_key  = os.environ.get("AI_INTEGRATIONS_OPENAI_API_KEY")

    if replit_base_url:
        api_key          = replit_api_key or "dummy"
        base_url         = replit_base_url
        chat_model       = "gpt-4o-mini"
        transcribe_model = "gpt-4o-mini-transcribe"
    else:
        # Local development — load .env
        try:
            from dotenv import load_dotenv
            load_dotenv()
        except ImportError:
            pass
        local_key = os.environ.get("OPENAI_API_KEY")
        if not local_key:
            raise EnvironmentError(
                "OPENAI_API_KEY not found. "
                "Add it to a .env file in finance-assistant/ or set the env var."
            )
        api_key          = local_key
        base_url         = None
        chat_model       = os.environ.get("ARTHBOT_CHAT_MODEL", "gpt-4o-mini")
        transcribe_model = os.environ.get("ARTHBOT_TRANSCRIBE_MODEL", "whisper-1")

    return Settings(
        openai_api_key   = api_key,
        openai_base_url  = base_url,

        chat_model       = chat_model,
        transcribe_model = transcribe_model,
        tts_model        = os.environ.get("ARTHBOT_TTS_MODEL",  "tts-1"),
        tts_voice        = os.environ.get("ARTHBOT_TTS_VOICE",  "alloy"),

        # Pipeline: STT
        fw_model_size = os.environ.get("ARTHBOT_FW_MODEL", "tiny"),

        # Pipeline: LLM
        llm_backend = os.environ.get("ARTHBOT_LLM_BACKEND", "auto"),
        ollama_url  = os.environ.get("ARTHBOT_OLLAMA_URL",  "http://localhost:11434"),

        # Generation
        max_completion_tokens = int(os.environ.get("ARTHBOT_MAX_TOKENS",   "1024")),
        max_history_turns     = int(os.environ.get("ARTHBOT_HISTORY_TURNS", "20")),
        max_input_length      = int(os.environ.get("ARTHBOT_MAX_INPUT",    "2000")),

        # Metadata
        app_title      = "ArthBot — Finance Assistant",
        app_icon       = "💰",
        user_name      = "Rahul Sharma",
        account_number = "XXXX-XXXX-1234",
    )
