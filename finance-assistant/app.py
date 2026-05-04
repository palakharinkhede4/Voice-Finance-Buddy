import streamlit as st
import io
import base64
from ai_agent import run_agent, transcribe_audio, text_to_speech

# ── Page config ──────────────────────────────────────────────────────────────

st.set_page_config(
    page_title="ArthBot — Voice Finance Assistant",
    page_icon="🎙️",
    layout="centered",
)

# ── Session state ────────────────────────────────────────────────────────────

if "conversation_history" not in st.session_state:
    st.session_state.conversation_history = []
if "chat_display" not in st.session_state:
    st.session_state.chat_display = []
if "last_audio_b64" not in st.session_state:
    st.session_state.last_audio_b64 = None

# ── Header ───────────────────────────────────────────────────────────────────

st.title("🎙️ ArthBot")
st.caption("Voice-based Personal Finance AI Assistant · Hindi · English · Hinglish")

st.markdown("---")

# ── Example queries info ─────────────────────────────────────────────────────

with st.expander("💡 Example queries you can ask"):
    st.markdown("""
**Hindi / Hinglish**
- *"Mera balance kitna hai?"*
- *"Kal maine kitna kharcha kiya?"*
- *"Last week ka spending batao"*
- *"Mera balance bhi bata aur kal ka expense bhi"*
- *"Is mahine ki salary aai?"*
- *"Kahan kahan paisa gaya last month?"*

**English**
- *"What is my total balance?"*
- *"Show me my expenses for this week"*
- *"How much did I spend on food?"*
- *"Give me a category-wise breakdown"*
- *"What are my recent transactions?"*
""")

# ── Input section ────────────────────────────────────────────────────────────

st.subheader("📥 Input")
input_mode = st.radio(
    "Choose input mode:",
    ["🎤 Upload Voice Recording", "⌨️ Type a Message"],
    horizontal=True,
    label_visibility="collapsed",
)

user_text = None
submitted = False

if input_mode == "🎤 Upload Voice Recording":
    uploaded_file = st.file_uploader(
        "Upload an audio file (WAV, MP3, M4A, OGG, WEBM)",
        type=["wav", "mp3", "m4a", "ogg", "webm", "flac"],
        label_visibility="visible",
    )

    st.caption("💡 Record on your phone or use a screen recorder, then upload the file.")

    col1, col2 = st.columns([3, 1])
    with col1:
        if uploaded_file:
            st.audio(uploaded_file, format=uploaded_file.type)
    with col2:
        transcribe_btn = st.button("🔊 Transcribe & Ask", use_container_width=True, type="primary")

    if transcribe_btn and uploaded_file:
        with st.spinner("Transcribing audio..."):
            audio_bytes = uploaded_file.read()
            try:
                user_text = transcribe_audio(audio_bytes, filename=uploaded_file.name)
                st.success(f"📝 Transcribed: *{user_text}*")
                submitted = True
            except Exception as e:
                st.error(f"Transcription failed: {e}")

else:
    with st.form("text_form", clear_on_submit=True):
        text_input = st.text_input(
            "Ask about your finances:",
            placeholder="e.g. Mera balance kitna hai? / What did I spend on food?",
            label_visibility="visible",
        )
        submitted = st.form_submit_button("➤ Ask", type="primary", use_container_width=True)
        if submitted and text_input.strip():
            user_text = text_input.strip()

# ── Agent call ───────────────────────────────────────────────────────────────

if submitted and user_text:
    with st.spinner("ArthBot is thinking..."):
        try:
            reply, updated_history = run_agent(user_text, st.session_state.conversation_history)
            st.session_state.conversation_history = updated_history
            st.session_state.chat_display.append(("user", user_text))
            st.session_state.chat_display.append(("assistant", reply))

            # Generate TTS
            try:
                audio_bytes_out = text_to_speech(reply)
                b64_audio = base64.b64encode(audio_bytes_out).decode()
                st.session_state.last_audio_b64 = b64_audio
            except Exception:
                st.session_state.last_audio_b64 = None

        except Exception as e:
            st.error(f"Agent error: {e}")

# ── Latest audio response ─────────────────────────────────────────────────────

if st.session_state.last_audio_b64 and st.session_state.chat_display:
    st.markdown("---")
    st.subheader("🔊 Voice Response")
    audio_html = f"""
        <audio autoplay controls style="width:100%">
            <source src="data:audio/mp3;base64,{st.session_state.last_audio_b64}" type="audio/mp3">
        </audio>
    """
    st.markdown(audio_html, unsafe_allow_html=True)

# ── Conversation history ──────────────────────────────────────────────────────

if st.session_state.chat_display:
    st.markdown("---")
    st.subheader("💬 Conversation")

    for role, content in reversed(st.session_state.chat_display):
        if role == "user":
            with st.chat_message("user"):
                st.markdown(f"**You:** {content}")
        else:
            with st.chat_message("assistant", avatar="🤖"):
                st.markdown(content)

    col1, col2 = st.columns([4, 1])
    with col2:
        if st.button("🗑️ Clear Chat", use_container_width=True):
            st.session_state.conversation_history = []
            st.session_state.chat_display = []
            st.session_state.last_audio_b64 = None
            st.rerun()

# ── Sidebar ───────────────────────────────────────────────────────────────────

with st.sidebar:
    st.markdown("## 🏦 ArthBot")
    st.markdown("*Your AI-powered personal finance assistant*")
    st.markdown("---")

    st.markdown("### 👤 User Profile")
    st.markdown("**Name:** Rahul Sharma")
    st.markdown("**Account:** XXXX-XXXX-1234")
    st.markdown("---")

    st.markdown("### 🧠 Capabilities")
    st.markdown("""
- ✅ Voice Input (STT via Whisper)
- ✅ Voice Output (TTS)
- ✅ Hindi / English / Hinglish
- ✅ Multi-intent queries
- ✅ Function calling (AI tools)
- ✅ Conversation memory
""")
    st.markdown("---")

    st.markdown("### ⚙️ Available Tools")
    st.markdown("""
1. `get_account_balance`
2. `get_expenses`
3. `get_income_summary`
4. `get_spending_by_category`
5. `get_recent_transactions`
""")
    st.markdown("---")
    st.caption("Powered by OpenAI Whisper + GPT · Replit AI Integrations")
