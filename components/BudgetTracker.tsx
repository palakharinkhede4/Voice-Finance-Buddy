"use client";

import React from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { BudgetLimit } from "@/lib/db/finance-db";

interface BudgetTrackerProps {
  budgets?: BudgetLimit[];
}

export const BudgetTracker: React.FC<BudgetTrackerProps> = ({ budgets = [] }) => {
  const overBudgetCount = budgets.filter((b) => b.isOver).length;

  return (
    <div className="theme-card rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Category Budget Limits
          </h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Monthly threshold guardrails
          </p>
        </div>
        <div>
          {overBudgetCount > 0 ? (
            <span className="flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-xs font-semibold text-rose-600 dark:text-rose-400">
              <AlertTriangle className="h-3.5 w-3.5" />
              {overBudgetCount} Limit Exceeded
            </span>
          ) : (
            <span className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Within Budget
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {budgets.map((b) => {
          const isWarning = b.percentage > 80 && !b.isOver;
          return (
            <div
              key={b.category}
              className="rounded-xl border border-slate-200/80 dark:border-white/[0.05] bg-slate-50 dark:bg-zinc-900/60 p-3.5"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold capitalize text-slate-800 dark:text-zinc-200">
                  {b.category}
                </span>
                <span
                  className={`font-mono font-medium ${
                    b.isOver
                      ? "text-rose-600 dark:text-rose-400"
                      : isWarning
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-slate-500 dark:text-zinc-400"
                  }`}
                >
                  {b.percentage}%
                </span>
              </div>

              <div className="mt-1.5 flex items-baseline justify-between text-xs">
                <span className="font-semibold text-slate-900 dark:text-white">
                  ₹{b.spent.toLocaleString("en-IN")}
                </span>
                <span className="text-slate-500 dark:text-zinc-500">
                  of ₹{b.monthlyLimit.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-zinc-800">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    b.isOver
                      ? "bg-rose-500"
                      : isWarning
                      ? "bg-amber-500"
                      : "bg-indigo-500"
                  }`}
                  style={{ width: `${Math.min(100, b.percentage)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
