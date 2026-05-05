import streamlit as st
import io
import base64
import hashlib
from audio_recorder_streamlit import audio_recorder
from ai_agent import run_agent, transcribe_audio, text_to_speech
from charts import (
    pie_chart_by_category,
    bar_chart_by_category,
    line_chart_daily_spending,
    get_kpis,
)

# ── Page config ───────────────────────────────────────────────────────────────

st.set_page_config(
    page_title="ArthBot — Finance Assistant",
    page_icon="💰",
    layout="wide",
)

# ── Custom CSS — minimal, clean ───────────────────────────────────────────────

st.markdown("""
<style>
    /* Metric cards */
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
    /* Tab styling */
    button[data-baseweb="tab"] {
        font-size: 0.95rem;
        font-weight: 600;
    }
    /* Scrollable chat container */
    .chat-box {
        max-height: 420px;
        overflow-y: auto;
        padding-right: 4px;
    }
    /* Hide Streamlit branding */
    #MainMenu, footer { visibility: hidden; }
</style>
""", unsafe_allow_html=True)

# ── Session state ─────────────────────────────────────────────────────────────

if "conversation_history" not in st.session_state:
    st.session_state.conversation_history = []
if "chat_display" not in st.session_state:
    st.session_state.chat_display = []
if "last_audio_b64" not in st.session_state:
    st.session_state.last_audio_b64 = None
if "last_recording_hash" not in st.session_state:
    st.session_state.last_recording_hash = None

# ── Sidebar ───────────────────────────────────────────────────────────────────

with st.sidebar:
    st.markdown("## 💰 ArthBot")
    st.caption("AI-Powered Personal Finance Assistant")
    st.divider()

    st.markdown("**👤 Rahul Sharma**")
    st.caption("Account · XXXX-XXXX-1234")
    st.divider()

    st.markdown("**🧠 AI Capabilities**")
    st.markdown("""
- 🎤 Voice Input (Whisper STT)
- 🔊 Voice Output (OpenAI TTS)
- 🇮🇳 Hindi · English · Hinglish
- 🔁 Multi-intent queries
- 🔧 5 finance tools
- 💬 Conversation memory
""")
    st.divider()

    with st.expander("💡 Try asking..."):
        st.markdown("""
*"Mera balance kitna hai?"*
*"Kal ka kharcha batao"*
*"Last week spending?"*
*"Category-wise breakdown do"*
*"Is mahine ki salary?"*
""")
    st.caption("Powered by OpenAI · Replit AI Integrations")

# ── Header ────────────────────────────────────────────────────────────────────

st.markdown("# 💰 ArthBot")
st.caption("Voice-based Personal Finance AI · Hindi · English · Hinglish")
st.divider()

# ── Tabs ──────────────────────────────────────────────────────────────────────

tab_dash, tab_voice = st.tabs(["📊  Dashboard", "🎙️  Voice Assistant"])


# ═══════════════════════════════════════════════════════════════════════════════
#  TAB 1 — DASHBOARD
# ═══════════════════════════════════════════════════════════════════════════════

with tab_dash:

    kpis = get_kpis()

    # ── KPI Metrics row ───────────────────────────────────────────────────────

    st.markdown("### 📈 Overview")
    c1, c2, c3, c4, c5 = st.columns(5)

    c1.metric(
        "Total Balance",
        f"₹{kpis['total_balance']:,.0f}",
    )
    c2.metric(
        "This Month — Spent",
        f"₹{kpis['month_spend']:,.0f}",
    )
    c3.metric(
        "This Month — Income",
        f"₹{kpis['month_income']:,.0f}",
    )
    c4.metric(
        "This Week — Spent",
        f"₹{kpis['week_spend']:,.0f}",
    )
    c5.metric(
        "Savings Rate",
        f"{kpis['savings_rate']:.1f}%",
    )

    st.markdown("")  # spacer

    # ── Row 1: Pie + Bar ──────────────────────────────────────────────────────

    st.markdown("### 🗂️ Spending Breakdown — Last 30 Days")
    col_pie, col_bar = st.columns([1, 1], gap="medium")

    with col_pie:
        fig_pie = pie_chart_by_category(days=30)
        st.plotly_chart(fig_pie, use_container_width=True, config={"displayModeBar": False})

    with col_bar:
        fig_bar = bar_chart_by_category(days=30)
        st.plotly_chart(fig_bar, use_container_width=True, config={"displayModeBar": False})

    # ── Row 2: Daily trend (full width) ──────────────────────────────────────

    st.markdown("### 📅 Daily Spending Trend")
    fig_line = line_chart_daily_spending(days=30)
    st.plotly_chart(fig_line, use_container_width=True, config={"displayModeBar": False})

    # ── Row 3: Recent transactions table ─────────────────────────────────────

    st.markdown("### 🧾 Recent Transactions")

    from finance_functions import TRANSACTIONS
    import pandas as pd

    recent = sorted(TRANSACTIONS, key=lambda x: x["date"], reverse=True)[:12]
    df = pd.DataFrame(recent)[["date", "description", "category", "amount", "account"]]
    df["amount"] = df["amount"].apply(
        lambda x: f"**+₹{x:,.0f}**" if x > 0 else f"-₹{abs(x):,.0f}"
    )
    df.columns = ["Date", "Description", "Category", "Amount", "Account"]
    df["Category"] = df["Category"].str.title()
    df["Account"]  = df["Account"].str.title()

    st.dataframe(
        df,
        use_container_width=True,
        hide_index=True,
        column_config={
            "Date":        st.column_config.TextColumn("Date", width="small"),
            "Description": st.column_config.TextColumn("Description", width="large"),
            "Category":    st.column_config.TextColumn("Category", width="medium"),
            "Amount":      st.column_config.TextColumn("Amount", width="small"),
            "Account":     st.column_config.TextColumn("Account", width="medium"),
        },
    )


# ═══════════════════════════════════════════════════════════════════════════════
#  TAB 2 — VOICE ASSISTANT
# ═══════════════════════════════════════════════════════════════════════════════

with tab_voice:

    left_col, right_col = st.columns([1, 1], gap="large")

    # ── LEFT: Input panel ─────────────────────────────────────────────────────

    with left_col:
        st.markdown("### 📥 Ask ArthBot")

        input_mode = st.radio(
            "Input mode",
            ["🎤 Microphone", "⌨️ Type"],
            horizontal=True,
            label_visibility="collapsed",
        )

        user_text = None
        submitted = False

        if input_mode == "🎤 Microphone":
            st.markdown("Click the mic to **start** recording, click again to **stop**.")

            audio_bytes = audio_recorder(
                text="",
                recording_color="#6C63FF",
                neutral_color="#4A4A5A",
                icon_name="microphone",
                icon_size="2x",
                pause_threshold=3.0,
                energy_threshold=(-1.0, 1.0),
            )

            if audio_bytes:
                # Only process if this is a new recording (avoid re-running on reruns)
                recording_hash = hashlib.md5(audio_bytes).hexdigest()
                if recording_hash != st.session_state.last_recording_hash:
                    st.session_state.last_recording_hash = recording_hash
                    st.audio(audio_bytes, format="audio/wav")
                    with st.spinner("Transcribing your voice..."):
                        try:
                            user_text = transcribe_audio(audio_bytes, filename="recording.wav")
                            st.success(f"📝 **Heard:** *{user_text}*")
                            submitted = True
                        except Exception as e:
                            st.error(f"Transcription failed: {e}")
                else:
                    # Same recording shown again — just replay it
                    st.audio(audio_bytes, format="audio/wav")
                    st.caption("Recording already processed. Click the mic to record again.")
            else:
                st.caption("🔴 Press the mic button above to start speaking")

        else:
            with st.form("text_form", clear_on_submit=True):
                text_input = st.text_input(
                    "Your question:",
                    placeholder="Mera balance kitna hai? / Show my expenses",
                    label_visibility="visible",
                )
                submitted = st.form_submit_button("➤ Ask", type="primary", use_container_width=True)
                if submitted and text_input.strip():
                    user_text = text_input.strip()

        # ── Agent call ────────────────────────────────────────────────────────

        if submitted and user_text:
            with st.spinner("ArthBot is thinking..."):
                try:
                    reply, updated_history = run_agent(
                        user_text, st.session_state.conversation_history
                    )
                    st.session_state.conversation_history = updated_history
                    st.session_state.chat_display.append(("user", user_text))
                    st.session_state.chat_display.append(("assistant", reply))

                    try:
                        audio_out = text_to_speech(reply)
                        st.session_state.last_audio_b64 = base64.b64encode(audio_out).decode()
                    except Exception:
                        st.session_state.last_audio_b64 = None

                except Exception as e:
                    st.error(f"Agent error: {e}")

        # ── Voice playback ────────────────────────────────────────────────────

        if st.session_state.last_audio_b64:
            st.markdown("#### 🔊 Voice Response")
            st.markdown(
                f"""<audio autoplay controls style="width:100%;border-radius:8px;">
                    <source src="data:audio/mp3;base64,{st.session_state.last_audio_b64}"
                            type="audio/mp3">
                </audio>""",
                unsafe_allow_html=True,
            )

    # ── RIGHT: Chat history ───────────────────────────────────────────────────

    with right_col:
        st.markdown("### 💬 Conversation")

        if not st.session_state.chat_display:
            st.info("No conversation yet. Ask something on the left!")
        else:
            for role, content in st.session_state.chat_display:
                if role == "user":
                    with st.chat_message("user"):
                        st.markdown(content)
                else:
                    with st.chat_message("assistant", avatar="🤖"):
                        st.markdown(content)

            if st.button("🗑️ Clear Chat", use_container_width=True):
                st.session_state.conversation_history = []
                st.session_state.chat_display = []
                st.session_state.last_audio_b64 = None
                st.rerun()
