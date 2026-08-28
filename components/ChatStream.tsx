"use client";

import React from "react";
import {
  Wallet,
  Target,
  TrendingUp,
  Receipt,
  Sparkles,
  Volume2,
  Square,
  ArrowRight,
} from "lucide-react";
import { OrchestrationResult } from "@/lib/agents/orchestrator";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  metadata?: OrchestrationResult;
}

interface ChatStreamProps {
  messages: ChatMessage[];
  loading?: boolean;
  onSpeakText?: (text: string, messageId: string) => void;
  onStopSpeech?: () => void;
  isSpeaking?: boolean;
  currentlySpeakingId?: string | null;
  onViewTelemetry?: (meta?: OrchestrationResult) => void;
  onSelectPrompt?: (text: string) => void;
}

export const ChatStream: React.FC<ChatStreamProps> = ({
  messages,
  loading = false,
  onSpeakText,
  onStopSpeech,
  isSpeaking = false,
  currentlySpeakingId = null,
  onSelectPrompt,
}) => {
  // If no messages yet, show a clean, categorized prompt starter grid
  if (messages.length === 0) {
    return (
      <div className="py-6 space-y-4">
        <div className="text-center">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold mb-2">
            <Sparkles className="h-4 w-4" />
          </div>
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
            Personal Finance Assistant
          </h4>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Ask any question about your spending, savings, taxes, or investments
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
          {[
            {
              title: "Account & Balance Check",
              desc: "What is my total account balance across savings & checking?",
              icon: Wallet,
              tag: "Balances",
            },
            {
              title: "Tax Regime Optimization",
              desc: "Compare Old vs New Tax Regime for 12 LPA salary",
              icon: Receipt,
              tag: "Taxes",
            },
            {
              title: "SIP Returns Projection",
              desc: "Calculate SIP returns for ₹10,000 per month at 12% for 10 years",
              icon: TrendingUp,
              tag: "Investments",
            },
            {
              title: "Monthly Budget Check",
              desc: "How much did I spend on food and dining this month?",
              icon: Target,
              tag: "Budgets",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.title}
                onClick={() => onSelectPrompt && onSelectPrompt(item.desc)}
                className="theme-card theme-card-hover flex flex-col justify-between text-left p-3.5 rounded-xl group transition"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition">
                      {item.title}
                    </span>
                    <Icon className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-400 group-hover:text-indigo-500 transition" />
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
                <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-400 dark:text-zinc-500">
                  <span className="font-medium text-slate-500 dark:text-zinc-400">{item.tag}</span>
                  <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition text-indigo-500" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((msg) => {
        const isUser = msg.role === "user";
        const isThisMessageSpeaking = isSpeaking && currentlySpeakingId === msg.id;

        return (
          <div
            key={msg.id}
            className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
          >
            {/* Assistant label */}
            {!isUser && (
              <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold text-indigo-600 dark:text-indigo-300">
                <Sparkles className="h-3 w-3" />
                <span>Finance Assistant</span>
              </div>
            )}

            {/* Bubble */}
            <div
              className={`relative max-w-2xl rounded-2xl p-4 text-xs leading-relaxed transition ${
                isUser
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "theme-card text-slate-800 dark:text-zinc-200"
              }`}
            >
              {/* Message Content */}
              <div className="whitespace-pre-wrap font-sans">{msg.content}</div>

              {/* Message Footer: Audio Playback / Stop Button */}
              {!isUser && onSpeakText && (
                <div className="mt-2.5 flex items-center justify-end border-t border-slate-100 dark:border-white/[0.06] pt-2 text-[11px]">
                  {isThisMessageSpeaking ? (
                    <button
                      onClick={() => onStopSpeech && onStopSpeech()}
                      className="flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-rose-600 dark:text-rose-400 font-semibold transition hover:bg-rose-500/20 active:scale-98 animate-pulse shadow-sm"
                      title="Stop reading response"
                    >
                      <Square className="h-3 w-3 fill-current" />
                      <span className="text-[11px]">Stop Audio</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => onSpeakText(msg.content, msg.id)}
                      className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-slate-500 dark:text-zinc-400 transition hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-indigo-600 dark:hover:text-indigo-300 active:scale-98"
                      title="Listen to response"
                    >
                      <Volume2 className="h-3.5 w-3.5" />
                      <span className="text-[11px]">Play Audio</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            <span className="mt-1 px-1 font-mono text-[10px] text-slate-400 dark:text-zinc-500">
              {msg.timestamp}
            </span>
          </div>
        );
      })}

      {/* Loading Indicator */}
      {loading && (
        <div className="flex flex-col items-start">
          <div className="mb-1 flex items-center gap-1.5 text-[11px] text-indigo-600 dark:text-indigo-300">
            <Sparkles className="h-3 w-3 animate-spin" />
            <span>Thinking...</span>
          </div>
          <div className="theme-card flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs text-slate-500 dark:text-zinc-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-indigo-500" />
            <span className="h-2 w-2 animate-pulse rounded-full bg-indigo-400 delay-150" />
            <span className="h-2 w-2 animate-pulse rounded-full bg-indigo-300 delay-300" />
            <span className="ml-1 text-slate-700 dark:text-zinc-300">Checking your finances...</span>
          </div>
        </div>
      )}
    </div>
  );
};
