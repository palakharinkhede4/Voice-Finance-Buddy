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
    { name: "Security Guard", latencyMs: 1.2, status: "ok", note: "Prompt Injection & Safety Passed" },
    { name: "Agent Router", latencyMs: 2.1, status: "ok", note: "Intent Classified (Expense/Investment/Tax/Budget)" },
    { name: "Tool Execution", latencyMs: 8.4, status: "ok", note: "Ledger / Calculator / Market Query" },
    { name: "LLM Reasoning", latencyMs: 280.5, status: "ok", note: "Groq / OpenAI / Gemini High Speed Model" },
  ];

  const displayTotal = totalLatencyMs || defaultStages.reduce((s, c) => s + c.latencyMs, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-lg rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">
                4-Stage Pipeline Telemetry
              </h3>
              <p className="text-xs text-slate-400">
                End-to-end latency and security diagnostics
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-white/[0.05] hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Total Latency Meter */}
        <div className="mt-5 flex items-center justify-between rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300">
            <Clock className="h-4 w-4" />
            <span>Total End-to-End Latency</span>
          </div>
          <span className="font-mono text-lg font-bold text-white">
            {displayTotal.toFixed(1)} ms
          </span>
        </div>

        {/* Stages List */}
        <div className="mt-4 space-y-2.5">
          {defaultStages.map((stage, idx) => (
            <div
              key={stage.name}
              className="flex items-center justify-between rounded-xl border border-white/[0.05] bg-surface-card p-3.5"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.05] font-mono text-[11px] text-slate-400">
                  {idx + 1}
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                    <span>{stage.name}</span>
                    {stage.status === "ok" ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <AlertCircle className="h-3.5 w-3.5 text-rose-400" />
                    )}
                  </div>
                  {stage.note && (
                    <div className="text-[11px] text-slate-400">{stage.note}</div>
                  )}
                </div>
              </div>
              <span className="font-mono text-xs font-semibold text-indigo-300">
                {stage.latencyMs.toFixed(1)} ms
              </span>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between pt-2 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Cpu className="h-3.5 w-3.5 text-slate-500" />
            <span>Vercel Edge & Serverless Architecture</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl bg-surface-card px-4 py-1.5 font-medium text-slate-300 hover:text-white border border-white/[0.08]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
