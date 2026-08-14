"use client";

import React from "react";
import {
  Wallet,
  Target,
  TrendingUp,
  Receipt,
  Sparkles,
  ShieldCheck,
  Volume2,
  Clock,
  Wrench,
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
  onSpeakText?: (text: string) => void;
  onViewTelemetry?: (meta?: OrchestrationResult) => void;
  onSelectPrompt?: (text: string) => void;
}

const AGENT_ICONS: Record<string, React.ElementType> = {
  "Expense Agent": Wallet,
  "Budget Agent": Target,
  "Investment Agent": TrendingUp,
  "Tax Agent": Receipt,
  "Planner Agent": Sparkles,
  "Security Shield": ShieldCheck,
};

export const ChatStream: React.FC<ChatStreamProps> = ({
  messages,
  loading = false,
  onSpeakText,
  onViewTelemetry,
  onSelectPrompt,
}) => {
  // If no messages yet, show a clean, categorized prompt starter grid
  if (messages.length === 0) {
    return (
      <div className="py-5 space-y-4">
        <div className="text-center">
          <div className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold mb-1.5">
            <Sparkles className="h-4 w-4" />
          </div>
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white">AI Finance Assistant</h4>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Select a financial query below or tap the microphone to speak
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
          {[
            {
              title: "Account & Balance Check",
              desc: "What is my total account balance across savings & checking?",
              icon: Wallet,
              tag: "Expense Agent",
            },
            {
              title: "Tax Regime Optimization",
              desc: "Compare Old vs New Tax Regime for 12 LPA salary",
              icon: Receipt,
              tag: "Tax Agent",
            },
            {
              title: "SIP Returns Projection",
              desc: "Calculate SIP returns for ₹10,000 per month at 12% for 10 years",
              icon: TrendingUp,
              tag: "Investment Agent",
            },
            {
              title: "Budget & Overspending Alert",
              desc: "How much did I spend on food and dining this month?",
              icon: Target,
              tag: "Budget Agent",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.title}
                onClick={() => onSelectPrompt && onSelectPrompt(item.desc)}
                className="theme-card theme-card-hover flex flex-col justify-between text-left p-3.5 rounded-xl group"
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
                  <span>{item.tag}</span>
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
        const meta = msg.metadata;
        const AgentIcon = meta ? AGENT_ICONS[meta.agentName] || Sparkles : Sparkles;

        return (
          <div
            key={msg.id}
            className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
          >
            {/* Agent attribution */}
            {!isUser && meta && (
              <div className="mb-1 flex items-center gap-2">
                <span className="flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-[11px] font-semibold text-indigo-600 dark:text-indigo-300">
                  <AgentIcon className="h-3 w-3" />
                  <span>{meta.agentName}</span>
                </span>
                <span className="text-[10px] text-slate-400 dark:text-zinc-500">{meta.agentLabel}</span>
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
              {/* Tool Execution summary badge if any */}
              {!isUser && meta?.tools && meta.tools.length > 0 && (
                <div className="mb-2.5 flex flex-wrap items-center gap-1.5">
                  {meta.tools.map((t, idx) => (
                    <span
                      key={idx}
                      className="flex items-center gap-1 rounded-md border border-slate-200 dark:border-white/[0.08] bg-slate-100 dark:bg-zinc-900 px-2 py-0.5 font-mono text-[10px] text-slate-700 dark:text-zinc-300"
                    >
                      <Wrench className="h-2.5 w-2.5 text-indigo-500" />
                      <span>{t.name}</span>
                    </span>
                  ))}
                </div>
              )}

              {/* Message Content */}
              <div className="whitespace-pre-wrap font-sans">{msg.content}</div>

              {/* Metadata Footer: Latency & Playback */}
              {!isUser && (
                <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 dark:border-white/[0.06] pt-2 text-[11px] text-slate-400 dark:text-zinc-400">
                  <div className="flex items-center gap-2">
                    {meta?.totalLatencyMs && (
                      <button
                        onClick={() => onViewTelemetry && onViewTelemetry(meta)}
                        className="flex items-center gap-1 rounded px-1.5 py-0.5 font-mono transition hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-700 dark:hover:text-zinc-200"
                        title="View latency breakdown"
                      >
                        <Clock className="h-3 w-3 text-slate-400" />
                        <span>{meta.totalLatencyMs} ms</span>
                      </button>
                    )}
                  </div>

                  {onSpeakText && (
                    <button
                      onClick={() => onSpeakText(msg.content)}
                      className="flex items-center gap-1 rounded-md px-2 py-0.5 text-slate-500 dark:text-zinc-400 transition hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-indigo-600 dark:hover:text-indigo-300"
                      title="Play speech response"
                    >
                      <Volume2 className="h-3.5 w-3.5" />
                      <span className="text-[10px]">Play Audio</span>
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
            <span>Processing Query & Tools...</span>
          </div>
          <div className="theme-card flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs text-slate-500 dark:text-zinc-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-indigo-500" />
            <span className="h-2 w-2 animate-pulse rounded-full bg-indigo-400 delay-150" />
            <span className="h-2 w-2 animate-pulse rounded-full bg-indigo-300 delay-300" />
            <span className="ml-1 text-slate-700 dark:text-zinc-300">Executing financial tools & reasoning</span>
          </div>
        </div>
      )}
    </div>
  );
};
