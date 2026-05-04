💰 Voice Finance Buddy

🎙️ AI-Powered Voice-Based Personal Finance Assistant

---

🚀 Overview

Voice Finance Buddy is a voice-first AI assistant that enables users to interact with their personal finances using natural speech (English, Hindi, or Hinglish).

The system converts spoken queries into text, understands user intent using a Large Language Model (LLM), dynamically invokes financial functions (like checking balance or expenses), and responds with natural language — both in text and speech.

This project demonstrates how to build a real-world AI agent system that bridges conversational interfaces with structured backend logic.

---

🎯 Key Features

- 🎤 Voice Input (Speech-to-Text) — Understands user queries from audio
- 🤖 LLM-Based Intent Understanding — Handles natural, conversational inputs
- 🔧 Function Calling (Agent Behavior) — Fetches real data via backend functions
- 🔁 Multi-Intent Queries — Handles multiple requests in a single sentence
- 🔊 Voice Output (Text-to-Speech) — Responds with realistic audio
- 🇮🇳 Hinglish-Friendly Responses — Designed for Indian conversational style
- 🧠 Agent Loop Architecture — LLM → Tool → LLM → Response

---

🧠 Example Interactions

User: Mera balance kitna hai?
AI: Tumhare account me ₹52,340 balance hai.

User: Kal maine kitna kharcha kiya?
AI: Kal tumne total ₹1,700 kharch kiye.

User: Balance bhi bata aur kal ka expense bhi
AI: Tumhare account me ₹52,340 balance hai aur kal tumne ₹1,700 kharch kiye.

---

🏗️ System Architecture

Voice Input
   ↓
Speech-to-Text (Whisper)
   ↓
LLM (Intent Detection + Reasoning)
   ↓
Function Calling (Finance APIs / Mock DB)
   ↓
LLM Response Generation
   ↓
Text-to-Speech
   ↓
Audio Output

---

⚙️ Tech Stack

- Python
- OpenAI API
  - Whisper (Speech-to-Text)
  - GPT (LLM for reasoning & responses)
- Streamlit — UI
- gTTS — Text-to-Speech
- Custom Python Modules — Backend logic

---

📁 Project Structure

voice-finance-buddy/
│── app.py                # Streamlit frontend
│── speech.py            # Speech-to-text logic
│── llm.py               # LLM + function calling
│── agent.py             # Tool execution layer
│── finance_db.py        # Mock financial data
│── tts.py               # Text-to-speech
│── requirements.txt
│── README.md

---

🔧 Installation & Setup

1. Clone the repository

git clone https://github.com/palakharinkhede4/Voice-Finance-Buddy
cd voice-finance-buddy

2. Create virtual environment

python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

3. Install dependencies

pip install -r requirements.txt

4. Add your OpenAI API key

export OPENAI_API_KEY="your_api_key_here"

5. Run the app

streamlit run app.py

---

🔁 Agent Workflow

1. User speaks a query
2. Audio is transcribed into text
3. LLM processes the query
4. LLM decides whether to call a function
5. Function returns structured financial data
6. LLM generates a natural response
7. Response is converted into speech

---

🧠 Core Concepts Demonstrated

🎤 Speech Recognition (ASR)

Converts audio input into text using Whisper.

🤖 LLM Reasoning

Understands user intent and generates natural responses.

🔧 Function Calling

Bridges natural language with backend logic:

- "get_balance()"
- "get_expenses_by_date(date)"

🧩 AI Agent Design

Implements a loop where the LLM:

- Interprets input
- Uses tools
- Produces final response

🔊 Voice UX

Enhances interaction by providing spoken responses.

---

💡 Why This Project Matters

This is not just a chatbot — it is a full AI system combining:

- Voice interface
- Intelligent reasoning
- Backend integration
- Agent-based workflows

Such architectures are used in:

- Fintech assistants
- Customer support bots
- Conversational AI products

---

🔮 Future Enhancements

- 🎙️ Real-time microphone input (no file upload)
- 📊 Spending analytics & insights
- 💸 Budget tracking and alerts
- 🧠 Persistent user memory
- 🌐 Multilingual support (Hindi, Marathi, etc.)
- 🔗 Integration with real financial APIs

---

🏆 Key Highlights

- Built an end-to-end voice AI agent system
- Implemented LLM function calling for structured data access
- Designed for real-world conversational usage
- Demonstrates strong understanding of modern AI system design

---

📌 Author

Palak Harinkhede
MTech (CSE - AI/ML) | Delhi Technological University

---

⭐ If you found this project useful, consider giving it a star!
