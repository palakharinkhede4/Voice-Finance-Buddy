# Voice Finance Buddy

**Autonomous Voice-Enabled Personal Finance Assistant & Portfolio Intelligence Engine**

Built with Next.js 15, TypeScript, Tailwind CSS, and Recharts. Deployable with 1-click on **Vercel** with zero sleep issues, instantaneous edge page loads, and a modern, high-contrast fintech design.

---

## Key Features

- **Voice & Conversational Finance Hub**: Real-time microphone audio recording, Web Speech & Whisper speech-to-text, and automated speech synthesis.
- **Intelligent Multi-Agent Orchestrator**:
  - **Expense Agent**: Real-time balances, recent transaction ledgers, category expenditure breakdown.
  - **Budget Agent**: Monthly budget threshold guardrails, category overspending warnings, savings rate metrics.
  - **Investment Agent**: SIP compound returns, stock quotes (Reliance, TCS, Infosys, HDFC Bank), market indices (Nifty 50, Sensex, Gold, USD/INR).
  - **Tax Agent**: Indian Income Tax calculations for FY 2024-25 comparing Old vs New Regime, Section 87A rebate, standard deduction, and 4% cess.
  - **Planner Agent**: Comprehensive wealth review, milestone tracking, and asset allocation strategy.
- **Zero Emojis / Modern Fintech Aesthetic**: Obsidian dark theme (`#080C14`), precision SVG icons (Lucide React), subtle glassmorphic panels, and high-contrast typography.
- **Interactive Financial Visualizations**:
  - Category Spending Breakdown (Donut chart with interactive hover).
  - 14-Day Expense Trajectory (Area chart with smooth gradient fill).
  - Real-time Budget Progress Gauges.
- **Interactive Financial Calculators**: SIP Growth, Loan EMI, Fixed Deposit (FD) maturity, and Income Tax regime comparison.
- **Prompt Injection Defense**: Deterministic regex pattern guardrail to prevent jailbreaks and off-topic requests.
- **Transparent 4-Stage Telemetry**: Live profiling of Security Guard, Router, Tool Execution, and LLM reasoning latencies.

---

## 1-Click Deployment on Vercel

### Method A: Deploy via GitHub (Recommended)

1. Push this repository to your GitHub account:
   ```bash
   git add .
   git commit -m "Deploy Voice Finance Buddy with modern Next.js UI on Vercel"
   git push origin main
   ```
2. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Select your GitHub repository (`Voice-Finance-Buddy`).
4. In the **Environment Variables** section, add your API key:
   - `GROQ_API_KEY` (e.g. `gsk_...`) **OR**
   - `GEMINI_API_KEY` (e.g. `AIza...`) **OR**
   - `OPENAI_API_KEY` (e.g. `sk-...`)
5. Click **"Deploy"**. Your app will be live globally in under 60 seconds with **zero sleeping**!

---

### Method B: Deploy via Vercel CLI

1. Install the Vercel CLI:
   ```bash
   npm i -g vercel
   ```
2. Run deployment:
   ```bash
   vercel
   ```
3. Set environment variable:
   ```bash
   vercel env add GROQ_API_KEY
   ```
4. Deploy to production:
   ```bash
   vercel --prod
   ```

---

## Running Locally

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env.local` file in the root directory:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   ```
3. Start the local development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment Variables Reference

| Variable Name | Description | Default / Example |
| :--- | :--- | :--- |
| `GROQ_API_KEY` | Ultra-fast Groq API key for Llama 3.3 70B and Whisper Large v3 | `gsk_...` |
| `GEMINI_API_KEY` | Google Gemini API key for Gemini 2.0 Flash | `AIza...` |
| `OPENAI_API_KEY` | OpenAI API key for GPT-4o Mini & Whisper | `sk-...` |
| `ARTHBOT_CHAT_MODEL` | Custom LLM model name override | `llama-3.3-70b-versatile` |
| `ARTHBOT_TRANSCRIBE_MODEL` | Custom Whisper model name override | `whisper-large-v3-turbo` |

---

## Architecture & Technology Stack

- **Framework**: Next.js 15 (App Router)
- **UI Library**: React 19 + TypeScript
- **Styling**: Tailwind CSS + Custom Obsidian Glass tokens
- **Data Charts**: Recharts
- **Iconography**: Lucide React (clean SVG vectors)
- **Audio & Voice**: Web Speech API + Web MediaRecorder + Whisper API
- **Deployment Platform**: Vercel Serverless & Edge Functions (100% Uptime, Zero Cold Sleeps)

---

## Creator & Architect

- **Author**: **Palak Harinkhede**
- **LinkedIn**: [linkedin.com/in/palakharinkhede](https://www.linkedin.com/in/palakharinkhede/)
- **GitHub**: [github.com/palakharinkhede4](https://github.com/palakharinkhede4)
- **Repository**: [github.com/palakharinkhede4/Voice-Finance-Buddy](https://github.com/palakharinkhede4/Voice-Finance-Buddy)

