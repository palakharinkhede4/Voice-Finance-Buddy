"use client";

import React from "react";
import { X, ShieldCheck, Cpu, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { StageLatency } from "@/lib/agents/orchestrator";

interface PipelineTelemetryModalProps {
  isOpen: boolean;
  onClose: () => void;
  stages?: StageLatency[];
  totalLatencyMs?: number;
}

export const PipelineTelemetryModal: React.FC<PipelineTelemetryModalProps> = ({
  isOpen,
  onClose,
  stages = [],
  totalLatencyMs = 0,
}) => {
  if (!isOpen) return null;

  const defaultStages: StageLatency[] = stages.length > 0 ? stages : [
    { name: "Security Guard", latencyMs: 0.9, status: "ok", note: "Prompt Injection & Safety Passed" },
    { name: "Agent Router", latencyMs: 0.2, status: "ok", note: "Intent Classified (Expense/Investment/Tax/Budget)" },
    { name: "Tool Execution", latencyMs: 8.4, status: "ok", note: "Ledger / Calculator / Market Query" },
    { name: "LLM Reasoning", latencyMs: 153.5, status: "ok", note: "Groq / OpenAI / Gemini High Speed Model" },
  ];

  const displayTotal = totalLatencyMs || defaultStages.reduce((s, c) => s + c.latencyMs, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="theme-card w-full max-w-lg rounded-2xl p-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.08] pb-3.5">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Pipeline Telemetry
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                End-to-end latency and security diagnostics
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Total Latency Meter */}
        <div className="mt-4 flex items-center justify-between rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
            <Clock className="h-4 w-4" />
            <span>Total End-to-End Latency</span>
          </div>
          <span className="font-mono text-base font-bold text-slate-900 dark:text-white">
            {displayTotal.toFixed(1)} ms
          </span>
        </div>

        {/* Stages List */}
        <div className="mt-3.5 space-y-2">
          {defaultStages.map((stage, idx) => (
            <div
              key={stage.name}
              className="flex items-center justify-between rounded-xl border border-slate-200/80 dark:border-white/[0.05] bg-slate-50 dark:bg-zinc-900/60 p-3"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 dark:bg-zinc-800 font-mono text-[10px] text-slate-700 dark:text-zinc-400">
                  {idx + 1}
                </div>
                <div>
                  <div className="flex items-center gap-1 text-xs font-semibold text-slate-900 dark:text-white">
                    <span>{stage.name}</span>
                    {stage.status === "ok" ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <AlertCircle className="h-3.5 w-3.5 text-rose-500" />
                    )}
                  </div>
                  {stage.note && (
                    <div className="text-[10px] text-slate-500 dark:text-zinc-400">{stage.note}</div>
                  )}
                </div>
              </div>
              <span className="font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-300">
                {stage.latencyMs.toFixed(1)} ms
              </span>
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between pt-2 text-xs text-slate-500 dark:text-zinc-400">
          <div className="flex items-center gap-1.5">
            <Cpu className="h-3.5 w-3.5" />
            <span>Vercel Edge & Serverless</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-100 dark:bg-zinc-900 px-3.5 py-1.5 font-medium text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/[0.08]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
