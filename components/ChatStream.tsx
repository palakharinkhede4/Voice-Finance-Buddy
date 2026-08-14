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
}) => {
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
            {/* Agent / User attribution */}
            {!isUser && meta && (
              <div className="mb-1.5 flex items-center gap-2">
                <span className="flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-300">
                  <AgentIcon className="h-3 w-3" />
                  <span>{meta.agentName}</span>
                </span>
                <span className="text-[11px] text-slate-500">{meta.agentLabel}</span>
              </div>
            )}

            {/* Message Bubble */}
            <div
              className={`relative max-w-2xl rounded-2xl p-4 text-xs leading-relaxed transition ${
                isUser
                  ? "bg-indigo-600 text-white shadow-glow"
                  : "glass-panel text-slate-200 border-white/[0.08]"
              }`}
            >
              {/* Tool Execution summary badge if any */}
              {!isUser && meta?.tools && meta.tools.length > 0 && (
                <div className="mb-3 flex flex-wrap items-center gap-1.5">
                  {meta.tools.map((t, idx) => (
                    <span
                      key={idx}
                      className="flex items-center gap-1 rounded-md border border-white/[0.06] bg-surface-card/90 px-2 py-0.5 font-mono text-[10px] text-slate-300"
                    >
                      <Wrench className="h-2.5 w-2.5 text-indigo-400" />
                      <span>{t.name}</span>
                    </span>
                  ))}
                </div>
              )}

              {/* Message Content with line breaks */}
              <div className="whitespace-pre-wrap font-sans">{msg.content}</div>

              {/* Metadata Footer: Latency & Voice Audio Playback */}
              {!isUser && (
                <div className="mt-3 flex items-center justify-between border-t border-white/[0.06] pt-2 text-[11px] text-slate-400">
                  <div className="flex items-center gap-2">
                    {meta?.totalLatencyMs && (
                      <button
                        onClick={() => onViewTelemetry && onViewTelemetry(meta)}
                        className="flex items-center gap-1 rounded px-1.5 py-0.5 font-mono transition hover:bg-white/[0.05] hover:text-slate-200"
                        title="View latency breakdown"
                      >
                        <Clock className="h-3 w-3 text-slate-500" />
                        <span>{meta.totalLatencyMs} ms</span>
                      </button>
                    )}
                  </div>

                  {onSpeakText && (
                    <button
                      onClick={() => onSpeakText(msg.content)}
                      className="flex items-center gap-1 rounded-md px-2 py-0.5 text-slate-400 transition hover:bg-white/[0.05] hover:text-indigo-300"
                      title="Listen to audio response"
                    >
                      <Volume2 className="h-3.5 w-3.5" />
                      <span className="text-[10px]">Play Speech</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            <span className="mt-1 px-1 font-mono text-[10px] text-slate-500">
              {msg.timestamp}
            </span>
          </div>
        );
      })}

      {/* Loading Indicator */}
      {loading && (
        <div className="flex flex-col items-start">
          <div className="mb-1.5 flex items-center gap-1.5 text-[11px] text-indigo-300">
            <Sparkles className="h-3 w-3 animate-spin" />
            <span>Multi-Agent Engine Reasoning...</span>
          </div>
          <div className="glass-panel flex items-center gap-2 rounded-2xl px-4 py-3 text-xs text-slate-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-indigo-500"></span>
            <span className="h-2 w-2 animate-pulse rounded-full bg-indigo-400 delay-150"></span>
            <span className="h-2 w-2 animate-pulse rounded-full bg-indigo-300 delay-300"></span>
            <span className="ml-1 text-slate-300">Executing financial tools & synthesis</span>
          </div>
        </div>
      )}
    </div>
  );
};
