"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { KPICards } from "@/components/KPICards";
import { SpendingCharts } from "@/components/SpendingCharts";
import { BudgetTracker } from "@/components/BudgetTracker";
import { TransactionsTable } from "@/components/TransactionsTable";
import { CalculatorsView } from "@/components/CalculatorsView";
import { AddTransactionModal } from "@/components/AddTransactionModal";
import { ChatStream, ChatMessage } from "@/components/ChatStream";
import { VoiceCommandBar } from "@/components/VoiceCommandBar";
import {
  FinancialKPIs,
  Account,
  Transaction,
  BudgetLimit,
  Goal,
} from "@/lib/db/finance-db";
import { MarketIndex } from "@/lib/tools/market";
import { OrchestrationResult } from "@/lib/agents/orchestrator";
import { Target, Wallet } from "lucide-react";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("assistant");
  const [loading, setLoading] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Dark / Light Theme State
  const [isDark, setIsDark] = useState(true);

  // Financial Data State
  const [kpis, setKpis] = useState<FinancialKPIs | undefined>(undefined);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [spendingByCategory, setSpendingByCategory] = useState<Record<string, number>>({});
  const [dailyTrend, setDailyTrend] = useState<{ date: string; amount: number }[]>([]);
  const [budgets, setBudgets] = useState<BudgetLimit[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [indices, setIndices] = useState<MarketIndex[]>([]);

  // Chat Messages State (starts clean without noisy greeting)
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Initialize theme based on system settings or localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("theme");
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const shouldUseDark = stored ? stored === "dark" : prefersDark;

      setIsDark(shouldUseDark);
      if (shouldUseDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } catch {
      // fallback
    }
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    try {
      localStorage.setItem("theme", nextDark ? "dark" : "light");
      if (nextDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } catch {
      // fallback
    }
  };

  // Fetch initial financial data from server
  const fetchDashboardData = async () => {
    try {
      const res = await fetch("/api/finance");
      if (res.ok) {
        const data = await res.json();
        setKpis(data.kpis);
        setAccounts(data.accounts || []);
        setTransactions(data.transactions || []);
        setSpendingByCategory(data.spendingByCategory || {});
        setDailyTrend(data.dailyTrend || []);
        setBudgets(data.budgets || []);
        setGoals(data.goals || []);
        setIndices(data.market?.indices || []);
      }
    } catch (err) {
      console.warn("Failed to fetch dashboard data:", err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Speech synthesis helper
  const speakText = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();

      const cleanText = text
        .replace(/[#*_`~-]/g, " ")
        .replace(/₹/g, "Rupees ")
        .replace(/\s+/g, " ")
        .trim();

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.lang = "en-IN";

      const loadAndSpeak = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          const preferredVoice =
            voices.find((v) => v.lang.includes("en-IN") || v.name.includes("India")) ||
            voices.find((v) => v.lang.includes("en-GB") || v.name.includes("Google") || v.name.includes("Natural")) ||
            voices.find((v) => v.lang.startsWith("en")) ||
            voices[0];

          if (preferredVoice) {
            utterance.voice = preferredVoice;
          }
        }
        window.speechSynthesis.speak(utterance);
      };

      if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
          loadAndSpeak();
          window.speechSynthesis.onvoiceschanged = null;
        };
      } else {
        loadAndSpeak();
      }
    } catch (err) {
      console.warn("Speech synthesis error:", err);
    }
  };

  // Handle incoming user query
  const handleSendMessage = async (queryText: string) => {
    if (!queryText.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: "user",
      content: queryText,
      timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const historyPayload = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: queryText,
          history: historyPayload,
        }),
      });

      if (res.ok) {
        const result: OrchestrationResult = await res.json();

        const assistantMsg: ChatMessage = {
          id: `ast-${Date.now()}`,
          role: "assistant",
          content: result.response,
          timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
          metadata: result,
        };

        setMessages((prev) => [...prev, assistantMsg]);

        if (autoSpeak && result.response) {
          speakText(result.response);
        }

        fetchDashboardData();
      } else {
        const errJson = await res.json();
        const fallbackMsg: ChatMessage = {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: errJson.error || "Unable to process your request at this moment.",
          timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, fallbackMsg]);
      }
    } catch {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: "Network connection error. Please check your connection and try again.",
        timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-slate-900 dark:text-zinc-100 transition-colors">
      {/* Top Header */}
      <Header
        indices={indices}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDark={isDark}
        onToggleTheme={toggleTheme}
      />

      {/* Main Content */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-5 sm:px-6">
        {/* Tab 1: AI Voice Assistant Hub */}
        {activeTab === "assistant" && (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            {/* Main Assistant Column */}
            <div className="space-y-4 lg:col-span-8">
              <VoiceCommandBar
                onSendMessage={handleSendMessage}
                loading={loading}
                autoSpeak={autoSpeak}
                setAutoSpeak={setAutoSpeak}
              />

              {/* Chat Stream */}
              <div className="theme-card rounded-2xl p-4 sm:p-5 min-h-[420px]">
                <ChatStream
                  messages={messages}
                  loading={loading}
                  onSpeakText={speakText}
                  onSelectPrompt={handleSendMessage}
                />
              </div>
            </div>

            {/* Side Column: Clean Account Summary & Goals */}
            <div className="space-y-4 lg:col-span-4">
              {/* Net Worth Summary Badge */}
              {kpis && (
                <div className="theme-card rounded-xl p-4">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                    Net Worth
                  </span>
                  <div className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-mono">
                    ₹{kpis.netWorth.toLocaleString("en-IN")}
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400">
                    <span>Spent This Month: ₹{kpis.totalExpense30Days.toLocaleString("en-IN")}</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                      {kpis.savingsRatePct}% Savings
                    </span>
                  </div>
                </div>
              )}

              {/* Linked Accounts */}
              <div className="theme-card rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                    Linked Accounts
                  </span>
                  <Wallet className="h-3.5 w-3.5 text-slate-400" />
                </div>
                <div className="mt-3 space-y-2">
                  {accounts.map((a) => (
                    <div
                      key={a.key}
                      className="flex items-center justify-between rounded-lg border border-slate-100 dark:border-white/[0.04] bg-slate-50 dark:bg-zinc-900/60 p-2.5 text-xs"
                    >
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">{a.label}</div>
                        <div className="font-mono text-[10px] capitalize text-slate-400 dark:text-zinc-500">
                          {a.accountType}
                        </div>
                      </div>
                      <span className="font-mono font-semibold text-slate-800 dark:text-zinc-200">
                        ₹{a.balance.toLocaleString("en-IN")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Active Goals */}
              <div className="theme-card rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                    Financial Goals
                  </span>
                  <Target className="h-3.5 w-3.5 text-emerald-500" />
                </div>
                <div className="mt-3 space-y-2.5">
                  {goals.map((g) => {
                    const pct = Math.round((g.currentAmount / g.targetAmount) * 100);
                    return (
                      <div key={g.id} className="rounded-lg border border-slate-100 dark:border-white/[0.04] bg-slate-50 dark:bg-zinc-900/60 p-2.5 text-xs">
                        <div className="flex justify-between font-semibold text-slate-900 dark:text-white">
                          <span>{g.category}</span>
                          <span className="font-mono text-emerald-600 dark:text-emerald-400">{pct}%</span>
                        </div>
                        <div className="mt-0.5 text-[10px] text-slate-500 dark:text-zinc-400">{g.description}</div>
                        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-zinc-800">
                          <div
                            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="mt-1 flex justify-between font-mono text-[10px] text-slate-400 dark:text-zinc-500">
                          <span>₹{g.currentAmount.toLocaleString("en-IN")}</span>
                          <span>Target: ₹{g.targetAmount.toLocaleString("en-IN")}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Financial Overview & Analytics */}
        {activeTab === "overview" && (
          <div className="space-y-5">
            <KPICards kpis={kpis} />
            <SpendingCharts
              spendingByCategory={spendingByCategory}
              dailyTrend={dailyTrend}
            />
            <BudgetTracker budgets={budgets} />
          </div>
        )}

        {/* Tab 3: Transactions */}
        {activeTab === "ledger" && (
          <div className="space-y-5">
            <TransactionsTable
              transactions={transactions}
              onOpenAddModal={() => setIsAddModalOpen(true)}
            />
          </div>
        )}

        {/* Tab 4: Calculators & Tax */}
        {activeTab === "calculators" && (
          <div className="space-y-5">
            <CalculatorsView />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 dark:border-white/[0.06] bg-white dark:bg-[#0A0C13] py-3.5 text-center text-xs text-slate-500 dark:text-zinc-500 transition-colors">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Voice Finance Buddy • Private & Secure Personal Finance Assistant</span>
          <span>Designed for effortless money management</span>
        </div>
      </footer>

      {/* Modals */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchDashboardData}
      />
    </div>
  );
}
