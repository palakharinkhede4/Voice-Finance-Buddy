"use client";

import React from "react";
import {
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Cpu,
  Layers,
  Sparkles,
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
    <header className="sticky top-0 z-30 border-b border-white/[0.08] bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand & Monogram */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 font-mono text-lg font-bold text-white shadow-glow">
            VB
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold tracking-tight text-white">
                Voice Finance Buddy
              </span>
              <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-[11px] font-medium text-indigo-300">
                PRO
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Autonomous Multi-Agent Wealth Intelligence
            </p>
          </div>
        </div>

        {/* Live Market Ticker */}
        <div className="hidden items-center gap-4 lg:flex">
          {indices.slice(0, 3).map((idx) => {
            const isPositive = idx.change >= 0;
            return (
              <div
                key={idx.symbol}
                className="flex items-center gap-2 rounded-lg border border-white/[0.05] bg-surface-card/60 px-3 py-1.5 text-xs font-mono"
              >
                <span className="font-sans font-medium text-slate-400">
                  {idx.name}
                </span>
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

        {/* System Telemetry & Model Badge */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenTelemetry}
            title="Inspect 4-stage pipeline latency and security telemetry"
            className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-surface-card px-2.5 py-1.5 text-xs font-medium text-slate-300 transition hover:border-indigo-500/40 hover:bg-surface-hover"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Telemetry</span>
          </button>

          <div className="flex items-center gap-1.5 rounded-lg border border-indigo-500/20 bg-indigo-500/5 px-2.5 py-1.5 text-xs font-medium text-indigo-300">
            <Cpu className="h-3.5 w-3.5 text-indigo-400" />
            <span className="hidden sm:inline">{providerName}</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4 pb-2 pt-1 sm:px-6">
        {[
          { id: "assistant", label: "Voice Assistant", icon: Sparkles },
          { id: "overview", label: "Overview & KPIs", icon: Layers },
          { id: "ledger", label: "Transactions & Ledger", icon: TrendingUp },
          { id: "calculators", label: "Calculators & Tax", icon: Cpu },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-medium transition ${
                isActive
                  ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                  : "text-slate-400 hover:bg-surface-hover hover:text-slate-200 border border-transparent"
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${isActive ? "text-indigo-400" : "text-slate-400"}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
