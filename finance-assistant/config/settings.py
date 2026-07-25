"""
Centralized configuration for ArthBot.
Auto-detects API provider (Groq, Gemini, OpenAI) vs local model.
Pipeline backend settings (faster-whisper, Ollama) read from env vars.
"""
import os
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class Settings:
    # API Key & Provider Endpoint
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
    # Load .env if present (check current dir and settings dir)
    try:
        from dotenv import load_dotenv
        load_dotenv()
        env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
        if os.path.exists(env_path):
            load_dotenv(env_path)
    except ImportError:
        pass


    groq_key   = os.environ.get("GROQ_API_KEY")
    gemini_key = os.environ.get("GEMINI_API_KEY")
    openai_key = os.environ.get("OPENAI_API_KEY")

    if groq_key:
        api_key          = groq_key
        base_url         = "https://api.groq.com/openai/v1"
        chat_model       = os.environ.get("ARTHBOT_CHAT_MODEL", "llama-3.3-70b-versatile")
        transcribe_model = os.environ.get("ARTHBOT_TRANSCRIBE_MODEL", "whisper-large-v3-turbo")
    elif gemini_key:
        api_key          = gemini_key
        base_url         = "https://generativelanguage.googleapis.com/v1beta/openai/"
        chat_model       = os.environ.get("ARTHBOT_CHAT_MODEL", "gemini-2.0-flash")
        transcribe_model = os.environ.get("ARTHBOT_TRANSCRIBE_MODEL", "whisper-1")
    elif openai_key:
        api_key          = openai_key
        base_url         = None
        chat_model       = os.environ.get("ARTHBOT_CHAT_MODEL", "gpt-4o-mini")
        transcribe_model = os.environ.get("ARTHBOT_TRANSCRIBE_MODEL", "whisper-1")
    else:
        # 100% Free / OSS mode — Ollama local or offline mode (no key required)
        api_key          = "free-oss"
        base_url         = None
        chat_model       = os.environ.get("ARTHBOT_CHAT_MODEL", "llama3.2")
        transcribe_model = os.environ.get("ARTHBOT_TRANSCRIBE_MODEL", "whisper-1")

    return Settings(
        openai_api_key   = api_key,
        openai_base_url  = base_url,

        chat_model       = chat_model,
        transcribe_model = transcribe_model,
        tts_model        = os.environ.get("ARTHBOT_TTS_MODEL",  "gtts"),
        tts_voice        = os.environ.get("ARTHBOT_TTS_VOICE",  "alloy"),

        # Pipeline: STT
        fw_model_size = os.environ.get("ARTHBOT_FW_MODEL", "tiny"),

        # Pipeline: LLM
        llm_backend = os.environ.get("ARTHBOT_LLM_BACKEND", "auto"),
        ollama_url  = os.environ.get("ARTHBOT_OLLAMA_URL",  "http://localhost:11434"),

        # Generation
        max_completion_tokens = int(os.environ.get("ARTHBOT_MAX_TOKENS",   "512")),
        max_history_turns     = int(os.environ.get("ARTHBOT_HISTORY_TURNS", "10")),
        max_input_length      = int(os.environ.get("ARTHBOT_MAX_INPUT",    "2000")),

        # Metadata
        app_title      = "ArthBot — Finance Assistant",
        app_icon       = "💰",
        user_name      = "Rahul Sharma",
        account_number = "XXXX-XXXX-1234",
    )

