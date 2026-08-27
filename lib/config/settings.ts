export interface Settings {
  apiKey: string;
  baseUrl?: string;
  providerName: string;
  chatModel: string;
  transcribeModel: string;
  maxTokens: number;
  userName: string;
  accountNumber: string;
  annualIncome: number;
}

export function getSettings(): Settings {
  const groqKey = process.env.GROQ_API_KEY?.trim();
  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  const openaiKey = process.env.OPENAI_API_KEY?.trim();

  let apiKey = "";
  let baseUrl: string | undefined = undefined;
  let providerName = "Offline / Demo Engine";
  let chatModel = "llama-3.3-70b-versatile";
  let transcribeModel = "whisper-large-v3-turbo";

  if (groqKey) {
    apiKey = groqKey;
    baseUrl = "https://api.groq.com/openai/v1";
    providerName = "Groq (Llama 3.3 70B)";
    chatModel = process.env.ARTHBOT_CHAT_MODEL || "llama-3.3-70b-versatile";
    transcribeModel = process.env.ARTHBOT_TRANSCRIBE_MODEL || "whisper-large-v3-turbo";
  } else if (geminiKey) {
    apiKey = geminiKey;
    baseUrl = "https://generativelanguage.googleapis.com/v1beta/openai/";
    providerName = "Google Gemini (3.5 Flash Lite)";
    chatModel = process.env.ARTHBOT_CHAT_MODEL || process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
    transcribeModel = process.env.ARTHBOT_TRANSCRIBE_MODEL || "gemini-3.5-flash-lite";
  } else if (openaiKey) {
    apiKey = openaiKey;
    baseUrl = undefined;
    providerName = "OpenAI (GPT-4o Mini)";
    chatModel = process.env.ARTHBOT_CHAT_MODEL || "gpt-4o-mini";
    transcribeModel = process.env.ARTHBOT_TRANSCRIBE_MODEL || "whisper-1";
  }

  return {
    apiKey,
    baseUrl,
    providerName,
    chatModel,
    transcribeModel,
    maxTokens: 1024,
    userName: "Palak Harinkhede",
    accountNumber: "XXXX-XXXX-1234",
    annualIncome: 900000,
  };
}
