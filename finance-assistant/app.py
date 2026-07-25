"""
Voice Finance Buddy — AI-Powered Personal Finance Assistant
Single-page unified voice & text assistant with optional financial insights.
"""
import base64
import hashlib
import warnings
warnings.filterwarnings("ignore", category=DeprecationWarning)
warnings.filterwarnings("ignore", category=FutureWarning)
warnings.filterwarnings("ignore", category=UserWarning)
warnings.filterwarnings("ignore", message=".*use_container_width.*")
warnings.filterwarnings("ignore", message=".*Sampling rate.*")

import streamlit as st
from audio_recorder_streamlit import audio_recorder

def _cw() -> dict:
    try:
        import packaging.version
        if packaging.version.parse(st.__version__) >= packaging.version.parse("1.60.0"):
            return {"width": "stretch"}
    except Exception:
        pass
    return {"use_container_width": True}

from pipeline.orchestrator import FinancePipeline, PipelineResult
from rag.retriever import RAG_BACKEND
from charts import (
    pie_chart_by_category,
    bar_chart_by_category,
    line_chart_daily_spending,
    get_kpis,
)
from database.db import get_db

# ── Page config ───────────────────────────────────────────────────────────────

st.set_page_config(
    page_title="Voice Finance Buddy",
    page_icon="🎙️",
    layout="wide",
)

# ── Custom CSS ────────────────────────────────────────────────────────────────

st.markdown("""
<style>
    div[data-testid="metric-container"] {
        background: #1A1D2E;
        border: 1px solid rgba(108,99,255,0.25);
        border-radius: 12px;
        padding: 16px 20px;
    }
    div[data-testid="metric-container"] label {
        font-size: 0.78rem !important;
        color: #aaa !important;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
    div[data-testid="metric-container"] [data-testid="stMetricValue"] {
        font-size: 1.5rem !important;
        font-weight: 700 !important;
        color: #FAFAFA !important;
    }
    .agent-badge {
        display: inline-block; padding: 2px 10px; border-radius: 99px;
        font-size: 0.75rem; font-weight: 600;
        background: rgba(108,99,255,0.2); color: #a09aff;
        border: 1px solid rgba(108,99,255,0.3); margin-bottom: 6px;
    }
    .pipeline-stage {
        display: flex; align-items: center; gap: 8px;
        padding: 5px 10px; border-radius: 8px;
        font-size: 0.78rem; margin: 2px 0;
        background: rgba(26,29,46,0.7);
        border: 1px solid rgba(255,255,255,0.06);
    }
    .stage-ok   { border-left: 3px solid #58D68D; }
    .stage-skip { border-left: 3px solid #555; color: #666; }
    .stage-ms   { margin-left: auto; color: #888; font-size: 0.72rem; }
    .budget-ok   { color: #58D68D; font-weight: 600; }
    .budget-warn { color: #F39C12; font-weight: 600; }
    .budget-over { color: #E74C3C; font-weight: 600; }
    @keyframes pulse-ring {
        0% { transform: scale(0.96); box-shadow: 0 0 0 0 rgba(108,99,255, 0.7); }
        70% { transform: scale(1.04); box-shadow: 0 0 0 16px rgba(108,99,255, 0); }
        100% { transform: scale(0.96); box-shadow: 0 0 0 0 rgba(108,99,255, 0); }
    }
    .mic-recording-card {
        background: linear-gradient(135deg, rgba(26,29,46,0.9), rgba(40,35,75,0.7));
        border: 1px solid rgba(108,99,255,0.4);
        border-radius: 16px;
        padding: 18px 22px;
        text-align: center;
        margin-bottom: 14px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    }
    iframe[title="audio_recorder_streamlit.audio_recorder"] {
        border-radius: 50px !important;
        transition: transform 0.25s ease;
        display: block !important;
        margin: 12px auto !important;
        width: 100% !important;
        max-width: 140px !important;
    }
    iframe[title="audio_recorder_streamlit.audio_recorder"]:hover {
        transform: scale(1.08);
    }
    #MainMenu, footer { visibility: hidden; }
</style>
""", unsafe_allow_html=True)

# ── Session state ─────────────────────────────────────────────────────────────

if "pipeline" not in st.session_state:
    with st.spinner("Initialising AI pipeline…"):
        st.session_state.pipeline = FinancePipeline()

if "conversation_history"  not in st.session_state:
    st.session_state.conversation_history  = []
if "chat_display"          not in st.session_state:
    st.session_state.chat_display          = []  # (role, content, agent_tag)
if "last_audio_bytes"      not in st.session_state:
    st.session_state.last_audio_bytes      = None
if "audio_key_counter"     not in st.session_state:
    st.session_state.audio_key_counter     = 0
if "last_recording_hash"   not in st.session_state:
    st.session_state.last_recording_hash   = None
if "last_pipeline_result"  not in st.session_state:
    st.session_state.last_pipeline_result  = None
if "streaming_enabled"     not in st.session_state:
    st.session_state.streaming_enabled     = True
if "tts_enabled"           not in st.session_state:
    st.session_state.tts_enabled           = True

pipeline: FinancePipeline = st.session_state.pipeline

# ── Helpers ───────────────────────────────────────────────────────────────────

def _update_history(result: PipelineResult) -> None:
    if result.transcript and result.response:
        st.session_state.conversation_history.append({"role": "user", "content": result.transcript})
        st.session_state.conversation_history.append({"role": "assistant", "content": result.response})

def _play_tts(result: PipelineResult) -> None:
    if result.audio_bytes:
        st.session_state.last_audio_bytes = result.audio_bytes
        st.session_state.audio_key_counter += 1

def render_pipeline(result: PipelineResult) -> None:
    with st.expander("⚡ Pipeline Execution Trace", expanded=False):
        for s in result.stages:
            cls  = "stage-skip" if s.skipped else "stage-ok"
            icon = "⏭️" if s.skipped else "✅"
            note = f" · <i>{s.note}</i>" if s.note else ""
            st.markdown(
                f'<div class="pipeline-stage {cls}">'
                f'{icon} <b>{s.name}</b> ({s.backend}){note}'
                f'<span class="stage-ms">{s.latency_ms:.0f} ms</span>'
                f'</div>',
                unsafe_allow_html=True,
            )
        st.caption(f"Total: **{result.total_ms:.0f} ms** | Agent: **{result.agent_name}**")

# ── Architecture Dialog ───────────────────────────────────────────────────────

@st.dialog("🏗️ Technical Architecture & Pipeline", width="large")
def show_architecture_dialog():
    st.markdown("### 🔄 7-Stage Voice-AI Pipeline Flow")
    st.markdown("""
```mermaid
graph TD
    A[🎤 Audio / Text Input] --> B[1. VAD: Silero ONNX]
    B --> C[2. STT: Whisper Speech-to-Text]
    C --> D[3. Security: PromptGuard & Sanitizer]
    D --> E[4. Router: Agent Classifier]
    E --> F[5. RAG: FAISS + Sentence-Transformers]
    F --> G[6. Specialist Agents & LLM: Groq / Gemini]
    G --> H[7. TTS: gTTS Audio Synthesizer]
    H --> I[🔊 Audio Response]
```
""")
    st.divider()
    
    st.markdown("### ⚡ Active Runtime Backends")
    col1, col2 = st.columns(2)
    with col1:
        st.markdown(f"📡 **VAD:** `{pipeline.vad_backend}`")
        st.markdown(f"🎤 **STT:** `{pipeline.stt.backend.value}`")
        st.markdown(f"🧭 **Router:** `LLM Intent Classifier`")
    with col2:
        st.markdown(f"📚 **RAG:** `{RAG_BACKEND}`")
        st.markdown(f"🤖 **LLM:** `{pipeline.llm.backend.value}`")
        st.markdown(f"🔊 **TTS:** `gTTS · {pipeline.tts.voice}`")

    st.divider()
    st.markdown("### 🤖 Autonomous Specialist Agents")
    st.markdown("""
| Agent | Domain & Focus | Capabilities |
| :--- | :--- | :--- |
| 💳 **Expense** | Account & Transactions | Balance lookup, Category analytics, Recent transactions |
| 📊 **Budget** | Budgeting & Limits | Overspend detection, Savings rate coaching |
| 📈 **Investment** | Wealth & Market Data | SIP, EMI, FD calculators, Live NSE/BSE & MF APIs |
| 🧾 **Tax** | Income Tax & Exemptions | FY24-25 Old vs New Regime, 80C/80D/24(b) calculations |
| 🗺️ **Planner** | Multi-Domain Advice | Synthesizes comprehensive advice across all agents |
""")

# ── Sidebar ───────────────────────────────────────────────────────────────────

with st.sidebar:
    db = get_db()
    st.markdown("## 🎙️ Voice Finance Buddy")
    st.caption("AI-Powered Personal Finance Assistant")
    st.divider()

    st.markdown("**👤 Palak Harinkhede**")
    st.caption(f"Account · {db.user.account_number}")
    st.divider()

    if st.button("🏗️ Technical Architecture", **_cw()):
        show_architecture_dialog()

    st.divider()

    with st.expander("⚙️ Settings", expanded=False):
        st.session_state.streaming_enabled = st.toggle(
            "Stream LLM responses", value=st.session_state.streaming_enabled,
            help="Show response token-by-token as it's generated"
        )
        st.session_state.tts_enabled = st.toggle(
            "Voice responses (TTS)", value=st.session_state.tts_enabled,
        )

    with st.expander("💡 Sample Prompts", expanded=False):
        st.markdown("""
**Balance:** *"Mera balance kitna hai?"*
**Spending:** *"What is my spending this month?"*
**Budget:** *"Am I over budget this month?"*
**SIP:** *"₹5000 SIP for 10 years at 12%?"*
**EMI:** *"₹30L home loan 8.5% 20 years?"*
**Tax:** *"Income tax on ₹9L old vs new?"*
**Market:** *"Nifty aaj kahan hai?"*
""")
    st.caption("Powered by Groq · Gemini · Streamlit")

# ── Main Header ───────────────────────────────────────────────────────────────

st.markdown("# 🎙️ Voice Finance Buddy")
st.caption("Voice & Text AI Personal Finance Assistant · English · Hindi · Hinglish")
st.divider()

# ── Single-Page Layout: Left = Assistant | Right = Conversation ───────────────

left_col, right_col = st.columns([1, 1], gap="large")

with left_col:
    st.markdown("### 📥 Ask Voice Finance Buddy")

    input_mode = st.radio(
        "Input mode", ["🎤 Microphone", "⌨️ Type"],
        horizontal=True, label_visibility="collapsed",
    )

    user_text = None
    is_audio  = False
    submitted = False

    # ── Microphone ────────────────────────────────────────────────────────────
    if input_mode == "🎤 Microphone":
        if st.session_state.get("last_audio_bytes"):
            st.info("🔊 Voice response is currently playing. Click **⏹️ Stop Audio** below to start a new voice recording.")
            if st.button("⏹️ Stop Audio & Record", **_cw()):
                st.session_state.last_audio_bytes = None
                st.rerun()
        else:
            st.markdown(
                """
                <div style="text-align: center; padding: 10px 0 2px 0;">
                    <div style="font-size: 0.9rem; color: #b0b8d0;">
                        Click the microphone below to <b>start recording</b>. Click again when done.
                    </div>
                </div>
                """,
                unsafe_allow_html=True,
            )

            audio_bytes = audio_recorder(
                text="",
                recording_color="#FF4B4B",
                neutral_color="#6C63FF",
                icon_name="microphone",
                icon_size="3x",
                pause_threshold=10.0,
                energy_threshold=(-1.0, 1.0),
            )

            if audio_bytes and len(audio_bytes) > 2000:
                recording_hash = hashlib.md5(audio_bytes).hexdigest()
                if recording_hash != st.session_state.last_recording_hash:
                    st.session_state.last_recording_hash = recording_hash
                    st.markdown("<div style='text-align:center; margin-top:8px;'><span style='background:rgba(88,214,141,0.2); color:#58D68D; border:1px solid #58D68D; padding:5px 16px; border-radius:20px; font-size:0.8rem; font-weight:600;'>✅ Audio Recorded — Processing…</span></div>", unsafe_allow_html=True)
                    st.audio(audio_bytes, format="audio/wav")
                    is_audio  = True
                    submitted = True
                else:
                    st.audio(audio_bytes, format="audio/wav")
                    st.caption("Already processed — click mic to record again.")
            else:
                st.markdown(
                    """
                    <div style="text-align: center; margin-top: 10px;">
                        <span style="background: rgba(108,99,255,0.15); color: #a09aff; border: 1px solid rgba(108,99,255,0.3); padding: 5px 16px; border-radius: 20px; font-size: 0.8rem; font-weight: 600;">
                            🔴 Ready to Record
                        </span>
                    </div>
                    """,
                    unsafe_allow_html=True,
                )

    # ── Text Input ────────────────────────────────────────────────────────────
    else:
        with st.form("text_form", clear_on_submit=True):
            text_input = st.text_input(
                "Your question:",
                placeholder="What is my balance? / SIP ₹5000 for 10 years?",
            )
            submitted = st.form_submit_button(
                "➤ Ask", type="primary", **_cw()
            )
            if submitted and text_input.strip():
                user_text = text_input.strip()

    # ── Pipeline execution ────────────────────────────────────────────────────
    if submitted:
        history = st.session_state.conversation_history

        # ── Audio path ────────────────────────────────────────────────────────
        if is_audio:
            with st.spinner("Processing audio through pipeline…"):
                result: PipelineResult = pipeline.process_audio(
                    audio_bytes, history,
                    tts_enabled=st.session_state.tts_enabled,
                )

            if result.blocked:
                if "No speech" in result.block_reason:
                    st.warning("🔇 No speech detected — please try again.")
                else:
                    st.error(f"🚫 {result.block_reason}")
            else:
                st.success(f"📝 **Heard:** *{result.transcript}*")
                st.session_state.chat_display.append(
                    ("user", result.transcript, None)
                )
                st.session_state.chat_display.append(
                    ("assistant", result.response, result.agent_name)
                )
                _update_history(result)
                _play_tts(result)
                st.session_state.last_pipeline_result = result

        # ── Text path ─────────────────────────────────────────────────────────
        elif user_text:
            if st.session_state.streaming_enabled:
                agent_name = pipeline.get_agent_name(user_text)
                st.session_state.chat_display.append(("user", user_text, None))

                with st.spinner(f"🤖 {agent_name} Agent thinking…"):
                    full_reply = ""
                    for chunk in pipeline.stream_text(user_text, history):
                        full_reply += chunk

                pr = pipeline.get_last_stream_result()
                if pr:
                    if st.session_state.tts_enabled and pr.response:
                        pr.audio_bytes = pipeline.tts.synthesize(pr.response)
                    st.session_state.chat_display.append(
                        ("assistant", pr.response, pr.agent_name)
                    )
                    _update_history(pr)
                    _play_tts(pr)
                    st.session_state.last_pipeline_result = pr
                st.rerun()

            else:
                with st.spinner("Processing…"):
                    result = pipeline.process_text(
                        user_text, history,
                        tts_enabled=st.session_state.tts_enabled,
                    )
                st.session_state.chat_display.append(("user", user_text, None))
                st.session_state.chat_display.append(
                    ("assistant", result.response, result.agent_name)
                )
                _update_history(result)
                _play_tts(result)
                st.session_state.last_pipeline_result = result

    # ── TTS playback with Autoplay & Stop Button ──────────────────────────────
    if st.session_state.get("last_audio_bytes"):
        st.markdown("#### 🔊 Voice Response")
        col_aud, col_stop = st.columns([3, 1])
        with col_aud:
            st.audio(
                st.session_state.last_audio_bytes,
                format="audio/mp3",
                autoplay=True,
            )
        with col_stop:
            if st.button("⏹️ Stop Audio", **_cw()):
                st.session_state.last_audio_bytes = None
                st.rerun()

    # ── Pipeline trace ────────────────────────────────────────────────────────
    if st.session_state.last_pipeline_result:
        st.divider()
        render_pipeline(st.session_state.last_pipeline_result)

# ── Right Column: Conversation Feed (Newest Queries at Top) ───────────────────
with right_col:
    st.markdown("### 💬 Conversation")

    if not st.session_state.chat_display:
        st.info("No conversation yet. Press the mic or type a question to begin!")
    else:
        # Group chat items into (user, assistant) exchanges
        exchanges = []
        i = 0
        while i < len(st.session_state.chat_display):
            item = st.session_state.chat_display[i]
            if item[0] == "user":
                user_item = item
                assistant_item = (
                    st.session_state.chat_display[i + 1]
                    if i + 1 < len(st.session_state.chat_display)
                    and st.session_state.chat_display[i + 1][0] == "assistant"
                    else None
                )
                exchanges.append((user_item, assistant_item))
                i += 2 if assistant_item else 1
            else:
                i += 1

        # Render in reverse order so latest exchange appears at the top
        for user_item, assistant_item in reversed(exchanges):
            with st.chat_message("user"):
                st.markdown(user_item[1])

            if assistant_item:
                with st.chat_message("assistant", avatar="🤖"):
                    agent_tag = assistant_item[2] if len(assistant_item) > 2 else None
                    if agent_tag:
                        st.markdown(
                            f'<span class="agent-badge">🤖 {agent_tag} Agent</span>',
                            unsafe_allow_html=True,
                        )
                    st.markdown(assistant_item[1])

        if st.button("🗑️ Clear Chat", **_cw()):
            st.session_state.conversation_history = []
            st.session_state.chat_display         = []
            st.session_state.last_audio_bytes     = None
            st.session_state.last_pipeline_result = None
            pipeline.memory.clear()
            st.rerun()

# ── Collapsible Financial Insights & Analytics ────────────────────────────────

st.divider()

with st.expander("📊 Financial Insights & Analytics", expanded=False):
    kpis = get_kpis()

    st.markdown("#### 📈 Account Overview")
    c1, c2, c3, c4, c5 = st.columns(5)
    c1.metric("Total Balance",       f"₹{kpis['total_balance']:,.0f}")
    c2.metric("This Month — Spent",  f"₹{kpis['month_spend']:,.0f}")
    c3.metric("This Month — Income", f"₹{kpis['month_income']:,.0f}")
    c4.metric("This Week — Spent",   f"₹{kpis['week_spend']:,.0f}")
    c5.metric("Savings Rate",        f"{kpis['savings_rate']:.1f}%")

    st.markdown("")
    st.markdown("#### 🗂️ Spending Breakdown (Last 30 Days)")
    col_pie, col_bar = st.columns(2, gap="medium")
    with col_pie:
        st.plotly_chart(pie_chart_by_category(days=30), **_cw(), config={"displayModeBar": False})
    with col_bar:
        st.plotly_chart(bar_chart_by_category(days=30), **_cw(), config={"displayModeBar": False})

    st.markdown("#### 📅 Daily Spending Trend")
    st.plotly_chart(line_chart_daily_spending(days=30), **_cw(), config={"displayModeBar": False})

    st.markdown("#### 🧾 Recent Transactions")
    import pandas as pd
    txns = get_db().get_transactions(limit=12)
    if txns:
        df = pd.DataFrame([t.to_dict() for t in txns])
        df = df[["date", "description", "category", "amount", "account"]]
        df["amount"] = df["amount"].apply(
            lambda x: f"+₹{x:,.0f}" if x > 0 else f"-₹{abs(x):,.0f}"
        )
        df.columns = ["Date", "Description", "Category", "Amount", "Account"]
        df["Category"] = df["Category"].str.title()
        df["Account"]  = df["Account"].str.title()
        st.dataframe(df, **_cw(), hide_index=True,
            column_config={
                "Date":        st.column_config.TextColumn("Date",        width="small"),
                "Description": st.column_config.TextColumn("Description", width="large"),
                "Category":    st.column_config.TextColumn("Category",    width="medium"),
                "Amount":      st.column_config.TextColumn("Amount",      width="small"),
                "Account":     st.column_config.TextColumn("Account",     width="medium"),
            })
