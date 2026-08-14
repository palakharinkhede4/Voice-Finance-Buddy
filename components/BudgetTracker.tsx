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
    <div className="glass-panel rounded-2xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">
            Category Budget Utilization
          </h3>
          <p className="text-xs text-slate-400">
            Monthly threshold guardrails and limits
          </p>
        </div>
        <div>
          {overBudgetCount > 0 ? (
            <span className="flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-xs font-semibold text-rose-400">
              <AlertTriangle className="h-3.5 w-3.5" />
              {overBudgetCount} Category Exceeded
            </span>
          ) : (
            <span className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              All Within Threshold
            </span>
          )}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {budgets.map((b) => {
          const isWarning = b.percentage > 80 && !b.isOver;
          return (
            <div
              key={b.category}
              className="rounded-xl border border-white/[0.05] bg-surface-card/60 p-4"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold capitalize text-slate-200">
                  {b.category}
                </span>
                <span
                  className={`font-mono font-medium ${
                    b.isOver
                      ? "text-rose-400"
                      : isWarning
                      ? "text-amber-400"
                      : "text-slate-400"
                  }`}
                >
                  {b.percentage}%
                </span>
              </div>

              <div className="mt-2 flex items-baseline justify-between text-xs">
                <span className="font-semibold text-white">
                  ₹{b.spent.toLocaleString("en-IN")}
                </span>
                <span className="text-slate-500">
                  of ₹{b.monthlyLimit.toLocaleString("en-IN")}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
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
