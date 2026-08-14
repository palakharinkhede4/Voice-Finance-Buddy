"use client";

import React, { useState } from "react";
import { X, Plus, Check } from "lucide-react";

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"debit" | "credit">("debit");
  const [category, setCategory] = useState("food");
  const [account, setAccount] = useState("checking");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) {
      setError("Please fill all required fields.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const parsedAmt = parseFloat(amount);
      const finalAmount = type === "debit" ? -Math.abs(parsedAmt) : Math.abs(parsedAmt);

      const res = await fetch("/api/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          category,
          amount: finalAmount,
          account,
          date: new Date().toISOString().split("T")[0],
        }),
      });

      if (res.ok) {
        onSuccess();
        onClose();
        setDescription("");
        setAmount("");
      } else {
        const errJson = await res.json();
        setError(errJson.error || "Failed to add transaction.");
      }
    } catch {
      setError("Network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="theme-card w-full max-w-md rounded-2xl p-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.08] pb-3.5">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Plus className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Record Transaction</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          {error && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-600 dark:text-rose-400">
              {error}
            </div>
          )}

          {/* Type Toggle */}
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-zinc-900 p-1">
            <button
              type="button"
              onClick={() => setType("debit")}
              className={`rounded-lg py-1.5 text-xs font-medium transition ${
                type === "debit" ? "bg-rose-500 text-white shadow-sm" : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Debit (Expense)
            </button>
            <button
              type="button"
              onClick={() => setType("credit")}
              className={`rounded-lg py-1.5 text-xs font-medium transition ${
                type === "credit" ? "bg-emerald-500 text-white shadow-sm" : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Credit (Income)
            </button>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-700 dark:text-zinc-300">Description</label>
            <input
              type="text"
              required
              placeholder="e.g. Grocery, Electricity, Salary"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-zinc-900 px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-700 dark:text-zinc-300">Amount (INR)</label>
            <input
              type="number"
              step="any"
              required
              placeholder="e.g. 1500"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-zinc-900 px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-zinc-300">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-zinc-900 px-3 py-2 text-xs capitalize text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
              >
                {[
                  "food",
                  "grocery",
                  "shopping",
                  "transport",
                  "utilities",
                  "health",
                  "housing",
                  "entertainment",
                  "education",
                  "travel",
                  "income",
                  "transfer",
                ].map((cat) => (
                  <option key={cat} value={cat} className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-white">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-zinc-300">Account</label>
              <select
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-zinc-900 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="checking" className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-white">ICICI Salary</option>
                <option value="savings" className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-white">HDFC Savings</option>
                <option value="fd" className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-white">SBI Fixed Deposit</option>
              </select>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-3.5 py-1.5 text-xs font-medium text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" />
              <span>{loading ? "Saving..." : "Save Entry"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
