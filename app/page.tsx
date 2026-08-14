"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { KPICards } from "@/components/KPICards";
import { SpendingCharts } from "@/components/SpendingCharts";
import { BudgetTracker } from "@/components/BudgetTracker";
import { TransactionsTable } from "@/components/TransactionsTable";
import { CalculatorsView } from "@/components/CalculatorsView";
import { AddTransactionModal } from "@/components/AddTransactionModal";
import { PipelineTelemetryModal } from "@/components/PipelineTelemetryModal";
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
import { Target, Wallet, ShieldCheck } from "lucide-react";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("assistant");
  const [loading, setLoading] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTelemetryModalOpen, setIsTelemetryModalOpen] = useState(false);
  const [activeTelemetry, setActiveTelemetry] = useState<OrchestrationResult | undefined>(undefined);

  // Financial Data State
  const [kpis, setKpis] = useState<FinancialKPIs | undefined>(undefined);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [spendingByCategory, setSpendingByCategory] = useState<Record<string, number>>({});
  const [dailyTrend, setDailyTrend] = useState<{ date: string; amount: number }[]>([]);
  const [budgets, setBudgets] = useState<BudgetLimit[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [indices, setIndices] = useState<MarketIndex[]>([]);
  const [providerName, setProviderName] = useState<string>("AI Active");

  // Initial messages starts empty so user sees clean prompt directory and hero console
  const [messages, setMessages] = useState<ChatMessage[]>([]);

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
        if (data.user?.provider) {
          setProviderName(data.user.provider);
        }
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
    window.speechSynthesis.cancel();

    const cleanText = text
      .replace(/[#*_`~-]/g, " ")
      .replace(/₹/g, "Rupees ")
      .replace(/\s+/g, " ")
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.lang = "en-IN";

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice =
      voices.find((v) => v.lang.includes("en-IN") || v.name.includes("Google") || v.name.includes("Natural")) ||
      voices[0];

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    window.speechSynthesis.speak(utterance);
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
        setActiveTelemetry(result);

        if (autoSpeak && result.response) {
          speakText(result.response);
        }

        fetchDashboardData();
      } else {
        const errJson = await res.json();
        const fallbackMsg: ChatMessage = {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: errJson.error || "Unable to process query at this moment.",
          timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, fallbackMsg]);
      }
    } catch {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: "Network error. Please check your connection.",
        timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-zinc-100">
      {/* Top Header */}
      <Header
        indices={indices}
        providerName={providerName}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenTelemetry={() => setIsTelemetryModalOpen(true)}
      />

      {/* Main Content */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-5 sm:px-6">
        {/* KPI Banner */}
        <div className="mb-5">
          <KPICards kpis={kpis} />
        </div>

        {/* Tab 1: AI Voice Assistant Hub */}
        {activeTab === "assistant" && (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            {/* Main Assistant Column */}
            <div className="space-y-4 lg:col-span-8">
              {/* HERO VOICE CONSOLE IN FRONT / AT TOP */}
              <VoiceCommandBar
                onSendMessage={handleSendMessage}
                loading={loading}
                autoSpeak={autoSpeak}
                setAutoSpeak={setAutoSpeak}
              />

              {/* Chat Stream & Prompt Directory */}
              <div className="glass-panel rounded-2xl p-5 min-h-[420px]">
                <ChatStream
                  messages={messages}
                  loading={loading}
                  onSpeakText={speakText}
                  onViewTelemetry={(meta) => {
                    setActiveTelemetry(meta);
                    setIsTelemetryModalOpen(true);
                  }}
                  onSelectPrompt={handleSendMessage}
                />
              </div>
            </div>

            {/* Side Overview & Quick Status Cards */}
            <div className="space-y-4 lg:col-span-4">
              {/* Linked Accounts */}
              <div className="glass-panel rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                    Linked Accounts
                  </span>
                  <Wallet className="h-3.5 w-3.5 text-zinc-400" />
                </div>
                <div className="mt-3 space-y-2">
                  {accounts.map((a) => (
                    <div
                      key={a.key}
                      className="flex items-center justify-between rounded-lg border border-white/[0.04] bg-surface-card p-2.5 text-xs"
                    >
                      <div>
                        <div className="font-semibold text-white">{a.label}</div>
                        <div className="font-mono text-[10px] capitalize text-zinc-500">
                          {a.accountType}
                        </div>
                      </div>
                      <span className="font-mono font-semibold text-zinc-200">
                        ₹{a.balance.toLocaleString("en-IN")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Goals / Milestones */}
              <div className="glass-panel rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                    Active Milestones
                  </span>
                  <Target className="h-3.5 w-3.5 text-emerald-400" />
                </div>
                <div className="mt-3 space-y-2.5">
                  {goals.map((g) => {
                    const pct = Math.round((g.currentAmount / g.targetAmount) * 100);
                    return (
                      <div key={g.id} className="rounded-lg border border-white/[0.04] bg-surface-card p-2.5 text-xs">
                        <div className="flex justify-between font-semibold text-white">
                          <span>{g.category}</span>
                          <span className="font-mono text-emerald-400">{pct}%</span>
                        </div>
                        <div className="mt-0.5 text-[10px] text-zinc-400">{g.description}</div>
                        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-zinc-800">
                          <div
                            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="mt-1 flex justify-between font-mono text-[10px] text-zinc-500">
                          <span>₹{g.currentAmount.toLocaleString("en-IN")}</span>
                          <span>Target: ₹{g.targetAmount.toLocaleString("en-IN")}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Prompt Defense Shield Status */}
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Prompt Injection Defense Active</span>
                </div>
                <p className="mt-1 text-[11px] text-zinc-400 leading-relaxed">
                  Real-time regex filters protect against prompt leakage and unauthorized instructions.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Financial Overview & Charts */}
        {activeTab === "overview" && (
          <div className="space-y-5">
            <SpendingCharts
              spendingByCategory={spendingByCategory}
              dailyTrend={dailyTrend}
            />
            <BudgetTracker budgets={budgets} />
          </div>
        )}

        {/* Tab 3: Transactions & Ledger */}
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
      <footer className="border-t border-white/[0.06] bg-[#0A0C13] py-3.5 text-center text-xs text-zinc-500">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Voice Finance Buddy • Vercel Serverless Architecture</span>
          <span>Instant Edge Execution • 0 Cold Sleeps</span>
        </div>
      </footer>

      {/* Modals */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchDashboardData}
      />

      <PipelineTelemetryModal
        isOpen={isTelemetryModalOpen}
        onClose={() => setIsTelemetryModalOpen(false)}
        stages={activeTelemetry?.stages}
        totalLatencyMs={activeTelemetry?.totalLatencyMs}
      />
    </div>
  );
}
