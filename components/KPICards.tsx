"use client";

import React from "react";
import {
  Wallet,
  ArrowDownRight,
  Target,
  Percent,
} from "lucide-react";
import { FinancialKPIs } from "@/lib/db/finance-db";

interface KPICardsProps {
  kpis?: FinancialKPIs;
}

export const KPICards: React.FC<KPICardsProps> = ({ kpis }) => {
  if (!kpis) return null;

  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
      {/* Net Worth / Total Balance */}
      <div className="glass-panel glass-panel-hover rounded-xl p-4">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium tracking-wide uppercase text-zinc-400">
            Total Net Worth
          </span>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-800 text-zinc-300">
            <Wallet className="h-3.5 w-3.5" />
          </div>
        </div>
        <div className="mt-2.5">
          <div className="text-xl font-bold tracking-tight text-white font-mono">
            ₹{kpis.netWorth.toLocaleString("en-IN")}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-zinc-400">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span>Savings, Checking & FD</span>
          </div>
        </div>
      </div>

      {/* 30-Day Total Spending */}
      <div className="glass-panel glass-panel-hover rounded-xl p-4">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium tracking-wide uppercase text-zinc-400">
            30-Day Outflow
          </span>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-800 text-zinc-300">
            <ArrowDownRight className="h-3.5 w-3.5 text-rose-400" />
          </div>
        </div>
        <div className="mt-2.5">
          <div className="text-xl font-bold tracking-tight text-white font-mono">
            ₹{kpis.totalExpense30Days.toLocaleString("en-IN")}
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-zinc-400">
            <span>Top:</span>
            <span className="font-medium capitalize text-zinc-200">
              {kpis.topExpenseCategory.category} (₹{kpis.topExpenseCategory.amount.toLocaleString("en-IN")})
            </span>
          </div>
        </div>
      </div>

      {/* Monthly Savings Rate */}
      <div className="glass-panel glass-panel-hover rounded-xl p-4">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium tracking-wide uppercase text-zinc-400">
            Savings Rate
          </span>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-800 text-zinc-300">
            <Percent className="h-3.5 w-3.5 text-emerald-400" />
          </div>
        </div>
        <div className="mt-2.5">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold tracking-tight text-emerald-400 font-mono">
              {kpis.savingsRatePct}%
            </span>
            <span className="text-[11px] text-zinc-400">of net income</span>
          </div>
          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${Math.min(100, kpis.savingsRatePct)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Budget Utilization */}
      <div className="glass-panel glass-panel-hover rounded-xl p-4">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium tracking-wide uppercase text-zinc-400">
            Budget Utilization
          </span>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-800 text-zinc-300">
            <Target className="h-3.5 w-3.5 text-amber-400" />
          </div>
        </div>
        <div className="mt-2.5">
          <div className="flex items-baseline gap-2">
            <span
              className={`text-xl font-bold tracking-tight font-mono ${
                kpis.budgetUtilizationPct > 90
                  ? "text-rose-400"
                  : kpis.budgetUtilizationPct > 75
                  ? "text-amber-400"
                  : "text-zinc-200"
              }`}
            >
              {kpis.budgetUtilizationPct}%
            </span>
            <span className="text-[11px] text-zinc-400">consumed</span>
          </div>
          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-zinc-800">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                kpis.budgetUtilizationPct > 90
                  ? "bg-rose-500"
                  : kpis.budgetUtilizationPct > 75
                  ? "bg-amber-500"
                  : "bg-indigo-500"
              }`}
              style={{ width: `${Math.min(100, kpis.budgetUtilizationPct)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
