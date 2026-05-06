import os
import json
from datetime import datetime
from openai import OpenAI
from finance_functions import TOOLS, TOOL_MAP

# ── Auto-detect environment: Replit vs local ─────────────────────────────────
#
# On Replit:  AI_INTEGRATIONS_OPENAI_BASE_URL is set → use the proxy
# Locally:    set OPENAI_API_KEY in .env → uses standard OpenAI API

_replit_base_url = os.environ.get("AI_INTEGRATIONS_OPENAI_BASE_URL")
_replit_api_key  = os.environ.get("AI_INTEGRATIONS_OPENAI_API_KEY")
_local_api_key   = os.environ.get("OPENAI_API_KEY")

if _replit_base_url:
    # Running on Replit — use the managed proxy
    client = OpenAI(api_key=_replit_api_key or "dummy", base_url=_replit_base_url)
    CHAT_MODEL       = "gpt-5.2"
    TRANSCRIBE_MODEL = "gpt-4o-mini-transcribe"
else:
    # Running locally — load .env if present, then use standard OpenAI
    try:
        from dotenv import load_dotenv
        load_dotenv()
        _local_api_key = os.environ.get("OPENAI_API_KEY")
    except ImportError:
        pass

    if not _local_api_key:
        raise EnvironmentError(
            "OPENAI_API_KEY not found. Create a .env file in the finance-assistant/ "
            "folder with: OPENAI_API_KEY=sk-your-key-here"
        )

    client = OpenAI(api_key=_local_api_key)
    CHAT_MODEL       = "gpt-4o-mini"   # cost-effective; swap to gpt-4o for best quality
    TRANSCRIBE_MODEL = "whisper-1"


TODAY = datetime.now().strftime("%Y-%m-%d")

SYSTEM_PROMPT = f"""You are ArthBot — a friendly, smart personal finance assistant for Indian users.
Today's date is {TODAY}.

You understand Hindi, English, and Hinglish (a natural mix of Hindi and English).
Always reply in the same language the user speaks — if they ask in Hindi, reply in Hindi; 
if Hinglish, reply in Hinglish; if English, reply in English.

You have access to the user's financial data via tools. 
When a user asks multiple questions in one query (multi-intent), call ALL relevant tools before responding.

Guidelines:
- Be warm, conversational, and concise — like a helpful friend, not a robot.
- Format currency as ₹X,XX,XXX (Indian format).
- When listing transactions, show date, description, and amount.
- Never fabricate financial data — always use the provided tools.
- For Hinglish responses, naturally blend Hindi and English words (e.g., "Aapka balance ₹85,420 hai").
- Keep responses brief and to the point unless detail is requested.
"""


def transcribe_audio(audio_bytes: bytes, filename: str = "audio.wav") -> str:
    """Convert audio to text using OpenAI Whisper."""
    import io
    audio_file = io.BytesIO(audio_bytes)
    audio_file.name = filename
    response = client.audio.transcriptions.create(
        model=TRANSCRIBE_MODEL,
        file=audio_file,
        response_format="json",
    )
    return response.text


def text_to_speech(text: str) -> bytes:
    """Convert text to speech using OpenAI TTS."""
    response = client.audio.speech.create(
        model="tts-1",
        voice="alloy",
        input=text,
        response_format="mp3",
    )
    return response.content


def run_agent(user_message: str, conversation_history: list) -> tuple[str, list]:
    """
    Run the finance AI agent with function calling.
    Returns (assistant_reply, updated_history).
    Handles multi-intent queries by allowing multiple tool calls.
    """
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    messages.extend(conversation_history)
    messages.append({"role": "user", "content": user_message})

    # Agent loop — keeps running until no more tool calls are requested
    while True:
        response = client.chat.completions.create(
            model=CHAT_MODEL,
            messages=messages,
            tools=TOOLS,
            tool_choice="auto",
            max_completion_tokens=1024,
        )

        message = response.choices[0].message
        messages.append(message)

        # No tool calls → final answer ready
        if not message.tool_calls:
            break

        # Execute all requested tools (handles multi-intent in one pass)
        for tool_call in message.tool_calls:
            fn_name = tool_call.function.name
            fn_args = json.loads(tool_call.function.arguments)

            if fn_name in TOOL_MAP:
                result = TOOL_MAP[fn_name](**fn_args)
            else:
                result = {"error": f"Unknown function: {fn_name}"}

            messages.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "content": json.dumps(result, ensure_ascii=False),
            })

    assistant_reply = message.content or ""

    # Maintain rolling history — keep last 20 turns to avoid token overflow
    updated_history = conversation_history + [
        {"role": "user", "content": user_message},
        {"role": "assistant", "content": assistant_reply},
    ]
    if len(updated_history) > 40:
        updated_history = updated_history[-40:]

    return assistant_reply, updated_history
