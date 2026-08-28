"use client";

import React from "react";
import {
  TrendingUp,
  TrendingDown,
  Layers,
  Sparkles,
  Receipt,
  Wallet,
  Sun,
  Moon,
} from "lucide-react";
import { MarketIndex } from "@/lib/tools/market";

interface HeaderProps {
  indices?: MarketIndex[];
  providerName?: string;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenTelemetry?: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  indices = [],
  activeTab,
  setActiveTab,
  isDark,
  onToggleTheme,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 dark:border-white/[0.06] bg-white/90 dark:bg-[#090A0E]/90 backdrop-blur-md transition-colors">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 font-mono text-xs font-bold text-white shadow-sm">
            VB
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white">
              Voice Finance Buddy
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Your Personal Financial Assistant
            </p>
          </div>
        </div>

        {/* Live Market Ticker */}
        <div className="hidden items-center gap-2.5 lg:flex">
          {indices.slice(0, 3).map((idx) => {
            const isPositive = idx.change >= 0;
            return (
              <div
                key={idx.symbol}
                className="flex items-center gap-2 rounded-lg border border-slate-200/80 dark:border-white/[0.05] bg-slate-50 dark:bg-zinc-900/60 px-2.5 py-1 text-[11px] font-mono"
              >
                <span className="font-sans text-slate-500 dark:text-slate-400">{idx.name}</span>
                <span className="font-semibold text-slate-800 dark:text-white">
                  {idx.value.toLocaleString("en-IN")}
                </span>
                <span
                  className={`flex items-center gap-0.5 font-medium ${
                    isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
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

        {/* Controls: Theme Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleTheme}
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label="Toggle theme"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-zinc-900 text-slate-600 dark:text-slate-300 transition hover:bg-slate-100 dark:hover:bg-zinc-800"
          >
            {isDark ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-slate-600" />
            )}
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4 pb-2 pt-0.5 sm:px-6">
        {[
          { id: "assistant", label: "Voice Assistant", icon: Sparkles },
          { id: "overview", label: "Overview & Analytics", icon: Layers },
          { id: "ledger", label: "Transactions", icon: Wallet },
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
                  ? "bg-slate-900 text-white dark:bg-zinc-800 dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-900/60 hover:text-slate-900 dark:hover:text-slate-200"
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
