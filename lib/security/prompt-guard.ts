/**
 * Prompt Guard — Detects and blocks prompt injection, jailbreaks, and off-topic requests.
 * All user messages must pass through this security layer before reaching any LLM.
 */

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?|context)/i,
  /(reveal|show|print|display|output|repeat|tell me)\s+(your\s+)?(system\s+prompt|hidden\s+prompt|instructions?|prompt)/i,
  /(you are|act as|pretend|roleplay|play the role|simulate|imagine you are)/i,
  /(jailbreak|DAN|do anything now|developer\s+mode|god\s+mode)/i,
  /forget\s+(your|all|previous|the|these)\s*(instructions?|rules?|constraints?)?/i,
  /<\|?(system|user|assistant|im_start|im_end|endoftext)\|?>/i,
  /new\s+(persona|identity|role|character|mode)/i,
  /(override|bypass|disable|remove)\s+(safety|filter|guard|restriction|rule)/i,
  /(tool\s+abuse|execute\s+code|run\s+command|shell|subprocess|os\.system)/i,
  /(developer\s+message|system\s+message|hidden\s+message|secret\s+prompt)/i,
  /what\s+(are\s+your\s+instructions|is\s+your\s+system\s+prompt|were\s+you\s+told)/i,
];

const OFF_TOPIC_PHRASES = [
  "write code", "write a program", "write a script", "debug this",
  "hack", "exploit", "vulnerability",
  "write an essay", "write a poem", "translate this document",
  "recipe", "dating", "adult content", "weapon", "illegal",
  "generate image", "draw", "create music",
];

export interface SecurityCheckResult {
  isSafe: boolean;
  reason?: string;
  category?: "safe" | "injection" | "off_topic";
}

export function checkPromptSecurity(text: string): SecurityCheckResult {
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();

  // 1. Injection & Jailbreak check
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        isSafe: false,
        reason: "Request blocked for security reasons.",
        category: "injection",
      };
    }
  }

  // 2. Hard off-topic check
  for (const phrase of OFF_TOPIC_PHRASES) {
    if (lower.includes(phrase)) {
      return {
        isSafe: false,
        reason:
          "I am a personal finance assistant and can only assist with personal finances, expenses, budgets, investments, and taxes.",
        category: "off_topic",
      };
    }
  }

  return {
    isSafe: true,
    category: "safe",
  };
}
