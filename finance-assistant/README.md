# 💰 ArthBot — Voice-Based Personal Finance AI Assistant

A production-ready, AI-powered personal finance assistant for Indian users.  
Supports **Hindi · English · Hinglish** voice and text interaction.

---

## ✨ Features

| Feature | Details |
|---|---|
| 🎤 Voice Input | OpenAI Whisper STT — Hindi forced, Hinglish compatible |
| 🔊 Voice Output | OpenAI TTS — natural Hindi/English voice |
| 🤖 Specialist Agents | Expense · Budget · Investment · Tax |
| 📚 RAG | TF-IDF knowledge base (14 docs: tax, SIP, FD, insurance, retirement) |
| 🧠 Long-term Memory | SQLite-backed conversation memory + user goals/preferences |
| 🔒 Security | Prompt injection guard + input validators |
| 📝 Logging | Rotating file logs in `logs/` (agent, tools, latency, errors) |
| 📊 Dashboard | Spending charts, KPIs, recent transactions |
| 📋 Budget Tracker | Category-level budget vs actual with visual bars |
| 🗄️ SQLite DB | Persistent transactions, accounts, goals, conversation history |

---

## 🚀 Quick Start

### Local Development

```bash
# 1. Clone the repo
git clone <your-repo-url>
cd finance-assistant

# 2. Install dependencies
pip install -r requirements.txt

# 3. Set environment variables
cp .env.example .env
# Edit .env and add your OpenAI API key

# 4. Run the app
streamlit run app.py
```

### Environment Variables

Create a `.env` file (or set in your deployment platform):

```env
# API Keys (Groq or Gemini)
GROQ_API_KEY=gsk_...
GEMINI_API_KEY=AIza...
```

---

## 🏗️ Architecture

```
finance-assistant/
├── app.py                    # Streamlit UI (3 tabs: Dashboard, Voice, Budget)
├── charts.py                 # Plotly dashboard charts
├── agents/
│   ├── base_agent.py         # BaseAgent: run() + stream() with tool-calling loop
│   ├── router.py             # Intent classification → agent dispatch
│   ├── expense_agent.py      # Balance, transactions, spending
│   ├── budget_agent.py       # Budget vs actual, savings coaching
│   ├── investment_agent.py   # SIP, EMI, FD, PPF, markets
│   └── tax_agent.py          # Income tax, old vs new regime, 80C
├── tools/
│   ├── finance_tools.py      # 6 finance data tools
│   ├── calculator_tools.py   # EMI, SIP, FD, PPF, income tax calculators
│   └── market_tools.py       # Mock Sensex, Nifty, stocks, mutual funds
├── memory/
│   ├── memory_manager.py     # SQLite-backed memory + fact extraction
│   └── conversation_store.py # Rolling window helper
├── security/
│   ├── prompt_guard.py       # Prompt injection + jailbreak detection
│   └── validators.py         # Input length, charset validators
├── rag/
│   ├── vector_store.py       # TF-IDF vector store
│   ├── ingest.py             # 12-doc Indian finance knowledge base
│   └── retriever.py          # Top-K retriever with context formatting
├── database/
│   ├── db.py                 # SQLite DB (users, accounts, transactions, goals, memory)
│   └── models.py             # Transaction, Account, UserProfile dataclasses
├── config/
│   └── settings.py           # Centralized config + env detection
├── logs/
│   └── logger.py             # Rotating file logger
├── data/
│   ├── arthbot.db            # SQLite database (auto-created)
│   └── docs/                 # Extra knowledge docs (retirement, insurance)
├── Dockerfile
├── requirements.txt
└── .gitignore
```

---

## ☁️ Deployment

### Streamlit Cloud

1. Push to GitHub.
2. Go to [share.streamlit.io](https://share.streamlit.io) → New app.
3. Select repo, branch, set `app.py` as main file.
4. Add secrets under **Settings → Secrets**:
   ```toml
   GROQ_API_KEY = "gsk_..."
   # or
   GEMINI_API_KEY = "AIza..."
   ```

### Railway

```bash
railway login
railway new
railway up
# Set env vars in Railway dashboard
```

### Render

1. Create a new **Web Service** → connect GitHub repo.
2. Build command: `pip install -r requirements.txt`
3. Start command: `streamlit run app.py --server.port $PORT --server.address 0.0.0.0`
4. Set `GROQ_API_KEY` or `GEMINI_API_KEY` in Environment Variables.

### Docker

```bash
docker build -t arthbot .
docker run -p 8501:8501 -e GROQ_API_KEY=gsk_... arthbot
```

---

## 🔒 Security

- All user input passes through `PromptGuard` before reaching any LLM.
- Detects: prompt injection, jailbreaks, system prompt extraction, tool abuse.
- Input length enforced at 2000 characters.
- No real banking data — all financial data is simulated.

---

## 📝 Logging

Logs are written to `logs/` (rotating, max 5MB per file):

- `logs/router.log` — intent classification, latency per request
- `logs/agents.log` — tool calls, streaming latency
- `logs/security.log` — blocked requests, security violations
- `logs/memory.log` — session events, goal saves
- `logs/app.log` — general application events

---

## 🤖 Supported Queries

| Query (Hindi/Hinglish/English) | Agent |
|---|---|
| "Mera balance kitna hai?" | Expense |
| "इस महीने कितना खर्चा हुआ?" | Expense |
| "Am I over budget this month?" | Budget |
| "Budget mein kahan overspend hua?" | Budget |
| "₹5000 SIP for 10 years at 12%?" | Investment |
| "₹30L home loan, 8.5%, 20 years EMI?" | Investment |
| "Reliance share price kya hai?" | Investment |
| "Income tax on ₹9L — old vs new regime?" | Tax |
| "80C mein kya invest karun?" | Tax |

---

## 🛣️ Roadmap

- [ ] Real-time NSE/BSE market data integration
- [ ] FAISS + sentence-transformers for semantic RAG
- [ ] Voice Activity Detection (silero-vad)
- [ ] Multi-user support with authentication
- [ ] Bank statement PDF import
- [ ] WhatsApp bot integration

---

## 📄 License

MIT License. Built with OpenAI, Streamlit, and ❤️ for Indian finance.
