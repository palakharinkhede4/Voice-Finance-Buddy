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
    <div className="theme-card rounded-2xl p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Transaction Ledger
          </h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Categorized financial ledger and history
          </p>
        </div>

        <button
          onClick={onOpenAddModal}
          className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-500"
        >
          <Plus className="h-4 w-4" />
          <span>Record Expense</span>
        </button>
      </div>

      {/* Search & Category Filter Chips */}
      <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-zinc-900 py-1.5 pl-9 pr-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
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
                  : "bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 border border-slate-200/60 dark:border-white/[0.05]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="mt-3.5 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-white/[0.08] text-slate-500 dark:text-zinc-400">
              <th className="pb-2.5 font-semibold uppercase tracking-wider">Date</th>
              <th className="pb-2.5 font-semibold uppercase tracking-wider">Description</th>
              <th className="pb-2.5 font-semibold uppercase tracking-wider">Category</th>
              <th className="pb-2.5 font-semibold uppercase tracking-wider">Account</th>
              <th className="pb-2.5 text-right font-semibold uppercase tracking-wider">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
            {filtered.map((t) => {
              const isCredit = t.amount > 0;
              return (
                <tr
                  key={t.id}
                  className="transition hover:bg-slate-50 dark:hover:bg-white/[0.02]"
                >
                  <td className="py-2.5 font-mono text-slate-500 dark:text-zinc-400">{t.date}</td>
                  <td className="py-2.5 font-medium text-slate-900 dark:text-white">
                    <div className="flex items-center gap-2">
                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded-md ${
                          isCredit
                            ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400"
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
                  <td className="py-2.5">
                    <span className="rounded-md border border-slate-200 dark:border-white/[0.06] bg-slate-100 dark:bg-zinc-900 px-2 py-0.5 capitalize text-slate-700 dark:text-zinc-300">
                      {t.category}
                    </span>
                  </td>
                  <td className="py-2.5 font-mono capitalize text-slate-500 dark:text-zinc-400">
                    {t.account}
                  </td>
                  <td
                    className={`py-2.5 text-right font-mono font-semibold ${
                      isCredit ? "text-emerald-600 dark:text-emerald-400" : "text-slate-800 dark:text-zinc-200"
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
                <td colSpan={5} className="py-8 text-center text-slate-400">
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
