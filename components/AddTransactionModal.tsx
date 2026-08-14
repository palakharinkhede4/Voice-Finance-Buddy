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
      <div className="glass-panel w-full max-w-md rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
              <Plus className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-semibold text-white">Record Transaction</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-white/[0.05] hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-400">
              {error}
            </div>
          )}

          {/* Type Toggle */}
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/[0.08] bg-surface-card p-1">
            <button
              type="button"
              onClick={() => setType("debit")}
              className={`rounded-lg py-1.5 text-xs font-medium transition ${
                type === "debit" ? "bg-rose-500 text-white shadow-sm" : "text-slate-400 hover:text-white"
              }`}
            >
              Debit (Expense)
            </button>
            <button
              type="button"
              onClick={() => setType("credit")}
              className={`rounded-lg py-1.5 text-xs font-medium transition ${
                type === "credit" ? "bg-emerald-500 text-white shadow-sm" : "text-slate-400 hover:text-white"
              }`}
            >
              Credit (Income)
            </button>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300">Description</label>
            <input
              type="text"
              required
              placeholder="e.g. Swiggy, Groceries, Salary"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-white/[0.08] bg-surface-card px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300">Amount (INR)</label>
            <input
              type="number"
              step="any"
              required
              placeholder="e.g. 1200"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-white/[0.08] bg-surface-card px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-300">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-white/[0.08] bg-surface-card px-3 py-2 text-xs capitalize text-white focus:border-indigo-500 focus:outline-none"
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
                  <option key={cat} value={cat} className="bg-surface text-white">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300">Account</label>
              <select
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-white/[0.08] bg-surface-card px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="checking" className="bg-surface text-white">ICICI Salary</option>
                <option value="savings" className="bg-surface text-white">HDFC Savings</option>
                <option value="fd" className="bg-surface text-white">SBI Fixed Deposit</option>
              </select>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-glow transition hover:bg-indigo-500 disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" />
              <span>{loading ? "Recording..." : "Save Entry"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
