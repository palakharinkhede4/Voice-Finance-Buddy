"use client";

import React, { useState } from "react";
import { Search, Plus, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { Transaction } from "@/lib/db/finance-db";

interface TransactionsTableProps {
  transactions?: Transaction[];
  onOpenAddModal: () => void;
}

export const TransactionsTable: React.FC<TransactionsTableProps> = ({
  transactions = [],
  onOpenAddModal,
}) => {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = [
    "all",
    "food",
    "grocery",
    "shopping",
    "transport",
    "utilities",
    "housing",
    "entertainment",
    "income",
  ];

  const filtered = transactions.filter((t) => {
    const matchesSearch =
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" ||
      t.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="glass-panel rounded-2xl p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">
            Transaction Ledger
          </h3>
          <p className="text-xs text-slate-400">
            Real-time categorized ledger with audit logs
          </p>
        </div>

        <button
          onClick={onOpenAddModal}
          className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500 shadow-glow"
        >
          <Plus className="h-4 w-4" />
          <span>Record Expense</span>
        </button>
      </div>

      {/* Search & Category Filter Chips */}
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-white/[0.08] bg-surface-card py-1.5 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-lg px-2.5 py-1 capitalize transition ${
                selectedCategory === cat
                  ? "bg-indigo-600 text-white font-medium"
                  : "bg-surface-card text-slate-400 hover:text-slate-200 border border-white/[0.05]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-white/[0.08] text-slate-400">
              <th className="pb-3 font-semibold uppercase tracking-wider">Date</th>
              <th className="pb-3 font-semibold uppercase tracking-wider">Description</th>
              <th className="pb-3 font-semibold uppercase tracking-wider">Category</th>
              <th className="pb-3 font-semibold uppercase tracking-wider">Account</th>
              <th className="pb-3 text-right font-semibold uppercase tracking-wider">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {filtered.map((t) => {
              const isCredit = t.amount > 0;
              return (
                <tr
                  key={t.id}
                  className="transition hover:bg-white/[0.02]"
                >
                  <td className="py-3 font-mono text-slate-400">{t.date}</td>
                  <td className="py-3 font-medium text-white">
                    <div className="flex items-center gap-2">
                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded-md ${
                          isCredit
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-rose-500/10 text-rose-400"
                        }`}
                      >
                        {isCredit ? (
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        ) : (
                          <ArrowDownLeft className="h-3.5 w-3.5" />
                        )}
                      </div>
                      <span>{t.description}</span>
                    </div>
                  </td>
                  <td className="py-3">
                    <span className="rounded-md border border-white/[0.06] bg-surface-card px-2 py-0.5 capitalize text-slate-300">
                      {t.category}
                    </span>
                  </td>
                  <td className="py-3 font-mono capitalize text-slate-400">
                    {t.account}
                  </td>
                  <td
                    className={`py-3 text-right font-mono font-semibold ${
                      isCredit ? "text-emerald-400" : "text-slate-200"
                    }`}
                  >
                    {isCredit ? "+" : ""}
                    ₹{Math.abs(t.amount).toLocaleString("en-IN")}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500">
                  No matching transactions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
