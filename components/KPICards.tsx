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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Net Worth / Total Balance */}
      <div className="glass-panel glass-panel-hover rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total Net Worth
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
            <Wallet className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold tracking-tight text-white">
            ₹{kpis.netWorth.toLocaleString("en-IN")}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
            <span>Across Savings, Checking & FD</span>
          </div>
        </div>
      </div>

      {/* 30-Day Total Spending */}
      <div className="glass-panel glass-panel-hover rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            30-Day Outflow
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400">
            <ArrowDownRight className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold tracking-tight text-white">
            ₹{kpis.totalExpense30Days.toLocaleString("en-IN")}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
            <span>Top:</span>
            <span className="font-medium capitalize text-slate-200">
              {kpis.topExpenseCategory.category} (₹{kpis.topExpenseCategory.amount.toLocaleString("en-IN")})
            </span>
          </div>
        </div>
      </div>

      {/* Monthly Savings Rate */}
      <div className="glass-panel glass-panel-hover rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Monthly Savings Rate
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
            <Percent className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-emerald-400">
              {kpis.savingsRatePct}%
            </span>
            <span className="text-xs text-slate-400">of net income</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${Math.min(100, kpis.savingsRatePct)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Budget Utilization */}
      <div className="glass-panel glass-panel-hover rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Budget Utilization
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
            <Target className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span
              className={`text-2xl font-bold tracking-tight ${
                kpis.budgetUtilizationPct > 90
                  ? "text-rose-400"
                  : kpis.budgetUtilizationPct > 75
                  ? "text-amber-400"
                  : "text-indigo-400"
              }`}
            >
              {kpis.budgetUtilizationPct}%
            </span>
            <span className="text-xs text-slate-400">consumed</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
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
