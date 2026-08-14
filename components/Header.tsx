"use client";

import React from "react";
import {
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Cpu,
  Layers,
  Sparkles,
  Receipt,
  Wallet,
} from "lucide-react";
import { MarketIndex } from "@/lib/tools/market";

interface HeaderProps {
  indices?: MarketIndex[];
  providerName?: string;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenTelemetry?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  indices = [],
  providerName = "AI Active",
  activeTab,
  setActiveTab,
  onOpenTelemetry,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#0A0C13]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6">
        {/* Brand & Monogram */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 border border-white/[0.1] font-mono text-sm font-bold text-white shadow-sm">
            VB
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold tracking-tight text-white">
                Voice Finance Buddy
              </span>
              <span className="rounded-md border border-white/[0.08] bg-zinc-900 px-1.5 py-0.2 text-[10px] font-mono text-zinc-400">
                v2.0
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Autonomous Personal Finance Intelligence
            </p>
          </div>
        </div>

        {/* Live Market Ticker */}
        <div className="hidden items-center gap-3 lg:flex">
          {indices.slice(0, 3).map((idx) => {
            const isPositive = idx.change >= 0;
            return (
              <div
                key={idx.symbol}
                className="flex items-center gap-2 rounded-lg border border-white/[0.05] bg-zinc-900/60 px-2.5 py-1 text-[11px] font-mono"
              >
                <span className="font-sans text-zinc-400">{idx.name}</span>
                <span className="font-semibold text-white">
                  {idx.value.toLocaleString("en-IN")}
                </span>
                <span
                  className={`flex items-center gap-0.5 font-medium ${
                    isPositive ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {isPositive ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {isPositive ? "+" : ""}
                  {idx.changePct}%
                </span>
              </div>
            );
          })}
        </div>

        {/* Telemetry & Model Status */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenTelemetry}
            title="Inspect latency and safety telemetry"
            className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-zinc-900 px-2.5 py-1 text-xs font-medium text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-800"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Telemetry</span>
          </button>

          <div className="flex items-center gap-1.5 rounded-lg border border-indigo-500/20 bg-indigo-500/5 px-2.5 py-1 text-xs font-medium text-indigo-300">
            <Cpu className="h-3.5 w-3.5 text-indigo-400" />
            <span className="hidden sm:inline">{providerName}</span>
          </div>
        </div>
      </div>

      {/* Modern Compact Navigation Tabs */}
      <div className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4 pb-2 pt-0.5 sm:px-6">
        {[
          { id: "assistant", label: "Voice Assistant", icon: Sparkles },
          { id: "overview", label: "Overview & Charts", icon: Layers },
          { id: "ledger", label: "Transactions & Ledger", icon: Wallet },
          { id: "calculators", label: "Calculators & Tax", icon: Receipt },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                isActive
                  ? "bg-zinc-800 text-white border border-white/[0.1]"
                  : "text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200 border border-transparent"
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${isActive ? "text-indigo-400" : "text-zinc-400"}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
