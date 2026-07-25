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
    provider_name:   str

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


def _get_secret_or_env(key: str) -> Optional[str]:
    # 1. Check os.environ
    for k in (key, key.upper(), key.lower()):
        val = os.environ.get(k)
        if val and isinstance(val, str) and val.strip():
            return val.strip().strip("'\"")

    # 2. Check st.secrets recursively
    try:
        import streamlit as st
        # Direct check
        for k in (key, key.upper(), key.lower()):
            if k in st.secrets:
                val = st.secrets[k]
                if isinstance(val, str) and val.strip():
                    return val.strip().strip("'\"")
        
        # Check sub-dictionaries in st.secrets
        for sec_key in st.secrets:
            try:
                sub = st.secrets[sec_key]
                if isinstance(sub, (dict, type(st.secrets))):
                    for k in (key, key.upper(), key.lower()):
                        if k in sub:
                            val = sub[k]
                            if isinstance(val, str) and val.strip():
                                return val.strip().strip("'\"")
            except Exception:
                pass
    except Exception:
        pass

    return None


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

    groq_key   = _get_secret_or_env("GROQ_API_KEY")
    gemini_key = _get_secret_or_env("GEMINI_API_KEY")
    openai_key = _get_secret_or_env("OPENAI_API_KEY")

    provider_name = "None"
    if groq_key:
        api_key          = groq_key
        base_url         = "https://api.groq.com/openai/v1"
        chat_model       = _get_secret_or_env("ARTHBOT_CHAT_MODEL") or "llama-3.3-70b-versatile"
        transcribe_model = _get_secret_or_env("ARTHBOT_TRANSCRIBE_MODEL") or "whisper-large-v3-turbo"
        provider_name    = "Groq"
    elif gemini_key:
        api_key          = gemini_key
        base_url         = "https://generativelanguage.googleapis.com/v1beta/openai/"
        chat_model       = _get_secret_or_env("ARTHBOT_CHAT_MODEL") or "gemini-2.0-flash"
        transcribe_model = _get_secret_or_env("ARTHBOT_TRANSCRIBE_MODEL") or "whisper-1"
        provider_name    = "Gemini"
    elif openai_key:
        api_key          = openai_key
        base_url         = None
        chat_model       = _get_secret_or_env("ARTHBOT_CHAT_MODEL") or "gpt-4o-mini"
        transcribe_model = _get_secret_or_env("ARTHBOT_TRANSCRIBE_MODEL") or "whisper-1"
        provider_name    = "OpenAI"
    else:
        # 100% Free / OSS mode — Ollama local or offline mode (no key required)
        api_key          = "free-oss"
        base_url         = "http://localhost:11434/v1"
        chat_model       = _get_secret_or_env("ARTHBOT_CHAT_MODEL") or "llama3.2"
        transcribe_model = _get_secret_or_env("ARTHBOT_TRANSCRIBE_MODEL") or "whisper-1"
        provider_name    = "None (Missing Key)"

    return Settings(
        openai_api_key   = api_key,
        openai_base_url  = base_url,
        provider_name    = provider_name,

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
        app_title      = "Voice Finance Buddy",
        app_icon       = "💰",
        user_name      = "Palak Harinkhede",
        account_number = "XXXX-XXXX-1234",
    )

