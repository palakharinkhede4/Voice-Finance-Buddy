"""
ArthBot — Voice-Based Personal Finance AI Assistant
Main Streamlit UI using the full 7-stage FinancePipeline.
"""
import base64
import hashlib
import streamlit as st
from audio_recorder_streamlit import audio_recorder

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
    page_title="ArthBot — Finance Assistant",
    page_icon="💰",
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
if "last_audio_b64"        not in st.session_state:
    st.session_state.last_audio_b64        = None
if "last_recording_hash"   not in st.session_state:
    st.session_state.last_recording_hash   = None
if "last_pipeline_result"  not in st.session_state:
    st.session_state.last_pipeline_result  = None
if "streaming_enabled"     not in st.session_state:
    st.session_state.streaming_enabled     = True
if "tts_enabled"           not in st.session_state:
    st.session_state.tts_enabled           = True

pipeline: FinancePipeline = st.session_state.pipeline


# ── Helper functions (defined before any tab code uses them) ──────────────────

def _update_history(result: PipelineResult) -> None:
    history = st.session_state.conversation_history
    updated = list(history) + [
        {"role": "user",      "content": result.transcript or ""},
        {"role": "assistant", "content": result.response},
    ]
    max_msgs = pipeline.settings.max_history_turns * 2
    st.session_state.conversation_history = updated[-max_msgs:]


def _play_tts(result: PipelineResult) -> None:
    if result.audio_bytes:
        st.session_state.last_audio_b64 = base64.b64encode(result.audio_bytes).decode()
    else:
        st.session_state.last_audio_b64 = None


def render_pipeline(result: PipelineResult) -> None:
    """Show per-stage timing card."""
    st.markdown("**🔬 Pipeline trace**")
    for stage in result.stages:
        css  = "stage-skip" if stage.skipped else "stage-ok"
        note = (f"<span style='color:#888'>&nbsp;{stage.note}</span>"
                if stage.note else "")
        bk   = f"<span style='color:#6C63FF'>[{stage.backend}]</span>"
        ms_s = (f"<span class='stage-ms'>{stage.latency_ms:.0f} ms</span>"
                if not stage.skipped
                else "<span class='stage-ms'>—</span>")
        icon = "⏭" if stage.skipped else "✅"
        st.markdown(
            f"<div class='pipeline-stage {css}'>"
            f"{icon} <b>{stage.name}</b> {bk}{note}{ms_s}"
            f"</div>",
            unsafe_allow_html=True,
        )
    st.caption(
        f"Total: **{result.total_ms:.0f} ms**"
        + (f" | Agent: **{result.agent_name}**" if result.agent_name else "")
    )


# ── Sidebar ───────────────────────────────────────────────────────────────────

with st.sidebar:
    db = get_db()
    st.markdown("## 💰 ArthBot")
    st.caption("AI-Powered Personal Finance Assistant")
    st.divider()

    st.markdown(f"**👤 {db.user.name}**")
    st.caption(f"Account · {db.user.account_number}")
    st.divider()

    st.markdown("**🔧 Active Pipeline Backends**")
    st.markdown(f"- 📡 **VAD:** `{pipeline.vad_backend}`")
    st.markdown(f"- 🎤 **STT:** `{pipeline.stt.backend.value}`")
    st.markdown(f"- 🧭 **Router:** `LLM intent classifier`")
    st.markdown(f"- 📚 **RAG:** `{RAG_BACKEND[:30]}`")
    st.markdown(f"- 🤖 **LLM:** `{pipeline.llm.backend.value}`")
    st.markdown(f"- 🔊 **TTS:** `OpenAI TTS · {pipeline.tts.voice}`")
    st.divider()

    st.markdown("**🤖 Specialist Agents**")
    st.markdown("""
- 💳 **Expense** — balance, transactions, spending
- 🗺️ **Planner** — multi-domain complex queries
- 📊 **Budget** — alerts, savings coaching
- 📈 **Investment** — SIP, EMI, FD, markets
- 🧾 **Tax** — income tax, 80C, regimes
""")
    st.divider()

    st.markdown("**⚙️ Settings**")
    st.session_state.streaming_enabled = st.toggle(
        "Stream LLM responses", value=st.session_state.streaming_enabled,
        help="Show response token-by-token as it's generated"
    )
    st.session_state.tts_enabled = st.toggle(
        "Voice responses (TTS)", value=st.session_state.tts_enabled,
    )
    st.divider()

    with st.expander("💡 Try asking…"):
        st.markdown("""
**Balance:** *"Mera balance kitna hai?"*
**Spending:** *"इस महीने कितना खर्चा हुआ?"*
**Budget:** *"Am I over budget this month?"*
**SIP:** *"₹5000 SIP for 10 years at 12%?"*
**EMI:** *"₹30L home loan 8.5% 20 years?"*
**Tax:** *"Income tax on ₹9L old vs new?"*
**Market:** *"Nifty aaj kahan hai?"*
""")
    st.caption("Powered by OpenAI · Replit AI Integrations")

# ── Header ────────────────────────────────────────────────────────────────────

st.markdown("# 💰 ArthBot")
st.caption("Voice-based Personal Finance AI · Hindi · English · Hinglish")
st.divider()

# ── Tabs ──────────────────────────────────────────────────────────────────────

tab_dash, tab_voice, tab_budget = st.tabs(
    ["📊  Dashboard", "🎙️  Voice Assistant", "📋  Budget Tracker"]
)


# ═══════════════════════════════════════════════════════════════════════════════
#  TAB 1 — DASHBOARD
# ═══════════════════════════════════════════════════════════════════════════════

with tab_dash:
    kpis = get_kpis()

    st.markdown("### 📈 Overview")
    c1, c2, c3, c4, c5 = st.columns(5)
    c1.metric("Total Balance",       f"₹{kpis['total_balance']:,.0f}")
    c2.metric("This Month — Spent",  f"₹{kpis['month_spend']:,.0f}")
    c3.metric("This Month — Income", f"₹{kpis['month_income']:,.0f}")
    c4.metric("This Week — Spent",   f"₹{kpis['week_spend']:,.0f}")
    c5.metric("Savings Rate",        f"{kpis['savings_rate']:.1f}%")

    st.markdown("")
    st.markdown("### 🗂️ Spending Breakdown — Last 30 Days")
    col_pie, col_bar = st.columns(2, gap="medium")
    with col_pie:
        st.plotly_chart(pie_chart_by_category(days=30), use_container_width=True,
                        config={"displayModeBar": False})
    with col_bar:
        st.plotly_chart(bar_chart_by_category(days=30), use_container_width=True,
                        config={"displayModeBar": False})

    st.markdown("### 📅 Daily Spending Trend")
    st.plotly_chart(line_chart_daily_spending(days=30), use_container_width=True,
                    config={"displayModeBar": False})

    st.markdown("### 🧾 Recent Transactions")
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
        st.dataframe(df, use_container_width=True, hide_index=True,
            column_config={
                "Date":        st.column_config.TextColumn("Date",        width="small"),
                "Description": st.column_config.TextColumn("Description", width="large"),
                "Category":    st.column_config.TextColumn("Category",    width="medium"),
                "Amount":      st.column_config.TextColumn("Amount",      width="small"),
                "Account":     st.column_config.TextColumn("Account",     width="medium"),
            })


# ═══════════════════════════════════════════════════════════════════════════════
#  TAB 2 — VOICE ASSISTANT
# ═══════════════════════════════════════════════════════════════════════════════

with tab_voice:
    left_col, right_col = st.columns([1, 1], gap="large")

    with left_col:
        st.markdown("### 📥 Ask ArthBot")

        input_mode = st.radio(
            "Input mode", ["🎤 Microphone", "⌨️ Type"],
            horizontal=True, label_visibility="collapsed",
        )

        user_text = None
        is_audio  = False
        submitted = False

        # ── Microphone ────────────────────────────────────────────────────────
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
                recording_hash = hashlib.md5(audio_bytes).hexdigest()
                if recording_hash != st.session_state.last_recording_hash:
                    st.session_state.last_recording_hash = recording_hash
                    st.audio(audio_bytes, format="audio/wav")
                    is_audio  = True
                    submitted = True
                else:
                    st.audio(audio_bytes, format="audio/wav")
                    st.caption("Already processed — click mic to record again.")
            else:
                st.caption("🔴 Press the mic button above to start speaking")

        # ── Text ──────────────────────────────────────────────────────────────
        else:
            with st.form("text_form", clear_on_submit=True):
                text_input = st.text_input(
                    "Your question:",
                    placeholder="Mera balance kitna hai? / SIP ₹5000 for 10 years?",
                )
                submitted = st.form_submit_button(
                    "➤ Ask", type="primary", use_container_width=True
                )
                if submitted and text_input.strip():
                    user_text = text_input.strip()

        # ── Pipeline execution ────────────────────────────────────────────────
        if submitted:
            history = st.session_state.conversation_history

            # ── Audio path: VAD → STT → Security → Agent → TTS ───────────────
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

            # ── Text path: Security → Agent → TTS ────────────────────────────
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

        # ── TTS playback ──────────────────────────────────────────────────────
        if st.session_state.last_audio_b64:
            st.markdown("#### 🔊 Voice Response")
            st.markdown(
                f"""<audio autoplay controls style="width:100%;border-radius:8px;">
                    <source src="data:audio/mp3;base64,{st.session_state.last_audio_b64}"
                            type="audio/mp3">
                </audio>""",
                unsafe_allow_html=True,
            )

        # ── Pipeline trace ────────────────────────────────────────────────────
        if st.session_state.last_pipeline_result:
            st.divider()
            render_pipeline(st.session_state.last_pipeline_result)

    # ── Chat history ──────────────────────────────────────────────────────────
    with right_col:
        st.markdown("### 💬 Conversation")

        if not st.session_state.chat_display:
            st.info("No conversation yet. Ask something on the left!")
        else:
            for item in st.session_state.chat_display:
                role, content = item[0], item[1]
                agent_tag     = item[2] if len(item) > 2 else None

                if role == "user":
                    with st.chat_message("user"):
                        st.markdown(content)
                else:
                    with st.chat_message("assistant", avatar="🤖"):
                        if agent_tag:
                            st.markdown(
                                f'<span class="agent-badge">🤖 {agent_tag} Agent</span>',
                                unsafe_allow_html=True,
                            )
                        st.markdown(content)

            if st.button("🗑️ Clear Chat", use_container_width=True):
                st.session_state.conversation_history = []
                st.session_state.chat_display         = []
                st.session_state.last_audio_b64       = None
                st.session_state.last_pipeline_result = None
                pipeline.memory.clear()
                st.rerun()


# ═══════════════════════════════════════════════════════════════════════════════
#  TAB 3 — BUDGET TRACKER
# ═══════════════════════════════════════════════════════════════════════════════

with tab_budget:
    from datetime import datetime as _dt
    db_b   = get_db()
    status = db_b.get_budget_status()
    month  = _dt.now().strftime("%B %Y")

    st.markdown(f"### 📋 Budget vs Actual — {month}")

    over   = [s for s in status if s["over"]]
    warned = [s for s in status if not s["over"] and s["pct_used"] >= 80]

    if over:
        n = len(over)
        st.error(f"⚠️ **{n} {'category' if n == 1 else 'categories'} over budget!**")
    elif warned:
        n = len(warned)
        st.warning(f"🟡 **{n} {'category' if n == 1 else 'categories'} approaching limit.**")
    else:
        st.success("✅ All categories within budget this month!")

    st.markdown("")

    for item in status:
        cat, spent, limit = item["category"], item["spent"], item["budget"]
        pct, rem          = item["pct_used"], item["remaining"]

        c_name, c_bar, c_nums = st.columns([2, 4, 2])
        with c_name:
            icon = "🔴" if item["over"] else "🟡" if pct >= 80 else "🟢"
            css  = ("budget-over" if item["over"]
                    else "budget-warn" if pct >= 80 else "budget-ok")
            st.markdown(f'<span class="{css}">{icon} {cat}</span>',
                        unsafe_allow_html=True)

        with c_bar:
            colour = ("#E74C3C" if item["over"]
                      else "#F39C12" if pct >= 80 else "#58D68D")
            fill   = min(pct, 100)
            st.markdown(
                f"""<div style="background:#2A2D3E;border-radius:6px;
                              height:20px;margin-top:6px;">
                    <div style="width:{fill}%;background:{colour};
                                border-radius:6px;height:20px;"></div>
                </div>""",
                unsafe_allow_html=True,
            )

        with c_nums:
            if item["over"]:
                st.markdown(
                    f'<small style="color:#E74C3C">'
                    f'₹{spent:,.0f} / ₹{limit:,.0f} (+₹{spent-limit:,.0f})</small>',
                    unsafe_allow_html=True,
                )
            else:
                st.markdown(
                    f'<small style="color:#aaa">'
                    f'₹{spent:,.0f} / ₹{limit:,.0f} (₹{rem:,.0f} left)</small>',
                    unsafe_allow_html=True,
                )

    # Goals
    goals = db_b.get_goals()
    if goals:
        st.divider()
        st.markdown("### 🎯 Financial Goals")
        for g in goals:
            curr = g["current_amount"] or 0
            tgt  = g["target_amount"]  or 1
            prog = min(curr / tgt * 100, 100)
            st.markdown(f"**{g['description']}** — Target: ₹{tgt:,.0f}")
            st.progress(int(prog), text=f"{prog:.0f}% achieved")

    st.caption("💬 Ask the Voice Assistant for budget advice anytime!")
