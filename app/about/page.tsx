"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Globe,
  Sparkles,
  ShieldCheck,
  Cpu,
  Bot,
  Layers,
  Zap,
  CheckCircle2,
  ExternalLink,
  Code2,
  TrendingUp,
  Receipt,
  Wallet,
  Target,
  Copy,
  Check,
  Server,
  Sun,
  Moon,
  Mic,
  Volume2,
  Terminal,
  Database,
  Lock,
  Compass,
} from "lucide-react";

const GithubIcon: React.FC<{ className?: string }> = ({ className = "h-4 w-4" }) => (
  <svg
    className={className}
    fill="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      clipRule="evenodd"
    />
  </svg>
);

const LinkedinIcon: React.FC<{ className?: string }> = ({ className = "h-4 w-4" }) => (
  <svg
    className={className}
    fill="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
  </svg>
);

export default function AboutPage() {
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [activeDiagramTab, setActiveDiagramTab] = useState<"system" | "agents" | "tech">("system");
  const [isDark, setIsDark] = useState(true);

  // Initialize theme
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

  const copyToClipboard = (text: string, id: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedLink(id);
      setTimeout(() => setCopiedLink(null), 2000);
    }
  };

  const ownerInfo = {
    name: "Palak Harinkhede",
    role: "AI Engineer & Full-Stack Developer",
    tagline: "Creator & Lead Architect of Voice Finance Buddy",
    bio: "Passionate about building autonomous agentic AI systems, real-time voice interfaces, and high-performance financial intelligence applications. Specializes in modern Next.js architectures, edge computing, LLM orchestration, and deterministic security guardrails.",
    avatar: "/palak-harinkhede.jpg",
    linkedin: "https://www.linkedin.com/in/palakharinkhede/",
    github: "https://github.com/palakharinkhede4",
    repo: "https://github.com/palakharinkhede4/Voice-Finance-Buddy",
    portfolio: "https://palakharinkhede4.github.io/",
    skills: [
      "Multi-Agent AI Orchestration",
      "Next.js 15 & React 19",
      "TypeScript & Tailwind CSS",
      "Voice AI & Whisper Speech-to-Text",
      "Financial Modeling & Tax Engines",
      "Vercel Edge Serverless Deployment",
      "LLM Guardrails & Security",
      "Recharts Data Visualization",
    ],
  };

  return (
    <div className="min-h-screen bg-background font-sans text-slate-900 dark:text-zinc-100 transition-colors">
      {/* Top Sticky Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 dark:border-white/[0.06] bg-white/90 dark:bg-[#090A0E]/90 backdrop-blur-md transition-colors">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-zinc-900 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 transition hover:bg-slate-100 dark:hover:bg-zinc-800"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Dashboard</span>
            </Link>

            <div className="hidden sm:flex items-center gap-2 border-l border-slate-200 dark:border-white/[0.08] pl-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-600 font-mono text-[10px] font-bold text-white shadow-sm">
                VB
              </div>
              <span className="text-xs font-semibold tracking-tight text-slate-900 dark:text-white">
                Voice Finance Buddy
              </span>
              <span className="rounded bg-indigo-500/10 px-1.5 py-0.5 text-[10px] font-medium text-indigo-600 dark:text-indigo-400">
                Documentation & Architecture
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={ownerInfo.portfolio}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-emerald-200/80 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 transition hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
            >
              <Globe className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden md:inline">Portfolio</span>
            </a>

            <a
              href={ownerInfo.github}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 transition hover:bg-slate-100 dark:hover:bg-zinc-800"
            >
              <GithubIcon className="h-3.5 w-3.5" />
              <span className="hidden md:inline">GitHub</span>
            </a>

            <a
              href={ownerInfo.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50/50 dark:bg-indigo-950/30 px-2.5 py-1.5 text-xs font-medium text-indigo-700 dark:text-indigo-300 transition hover:bg-indigo-100 dark:hover:bg-indigo-900/50"
            >
              <LinkedinIcon className="h-3.5 w-3.5 text-[#0A66C2]" />
              <span className="hidden md:inline">LinkedIn</span>
            </a>

            <button
              onClick={toggleTheme}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle theme"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-zinc-900 text-slate-600 dark:text-slate-300 transition hover:bg-slate-100 dark:hover:bg-zinc-800"
            >
              {isDark ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-slate-600" />
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-12">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-white/[0.08] bg-gradient-to-b from-slate-50 via-white to-white dark:from-[#111422] dark:via-[#0c0e17] dark:to-[#090a0e] p-6 sm:p-10 shadow-xl">
          <div className="absolute top-0 right-0 -mt-12 -mr-12 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-12 -ml-12 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-4xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 dark:border-indigo-500/20 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
              <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
              Autonomous Voice & Financial Intelligence Engine
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Voice Finance Buddy
            </h1>

            <p className="text-base sm:text-lg text-slate-600 dark:text-zinc-300 leading-relaxed max-w-3xl">
              An intelligent, voice-first personal finance copilot powered by autonomous multi-agent orchestration,
              real-time Indian market telemetry, deterministic prompt security guardrails, and precision financial mathematical calculators.
            </p>

            {/* Quick Action Badges */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/"
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-500"
              >
                <Mic className="h-4 w-4" />
                Launch Voice Assistant
              </Link>

              <a
                href={ownerInfo.portfolio}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl border border-emerald-300 dark:border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-950/30 px-4 py-2.5 text-xs sm:text-sm font-semibold text-emerald-800 dark:text-emerald-300 transition hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
              >
                <Globe className="h-4 w-4" />
                View Portfolio
                <ExternalLink className="h-3 w-3 text-emerald-500" />
              </a>

              <a
                href={ownerInfo.repo}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-zinc-900 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 dark:text-zinc-200 transition hover:bg-slate-50 dark:hover:bg-zinc-800"
              >
                <GithubIcon className="h-4 w-4" />
                View GitHub Repository
                <ExternalLink className="h-3 w-3 text-slate-400" />
              </a>

              <button
                onClick={() => copyToClipboard(ownerInfo.repo, "repo-clone")}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-zinc-900/60 px-3 py-2.5 text-xs font-mono text-slate-600 dark:text-zinc-400 transition hover:bg-slate-100 dark:hover:bg-zinc-800"
              >
                {copiedLink === "repo-clone" ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>git clone repo</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* OWNER & CREATOR PROFILE */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/[0.06] pb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold">
                  <Code2 className="h-4 w-4" />
                </div>
                Project Creator & Architect
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-0.5">
                Designed, engineered, and maintained by Palak Harinkhede
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Creator Bio Card with Real Profile Picture */}
            <div className="lg:col-span-8 theme-card rounded-2xl p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                <div className="flex items-center gap-4">
                  {/* Photo Container with glowing border and online badge */}
                  <div className="relative flex-shrink-0">
                    <img
                      src={ownerInfo.avatar}
                      alt={ownerInfo.name}
                      className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl object-cover ring-2 ring-indigo-500/30 dark:ring-indigo-400/40 shadow-lg shadow-indigo-500/10"
                    />
                    <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-900">
                      <span className="h-2.5 w-2.5 rounded-full bg-white animate-pulse" />
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      {ownerInfo.name}
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        Lead Developer
                      </span>
                    </h3>
                    <p className="text-xs sm:text-sm font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">
                      {ownerInfo.role}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                      {ownerInfo.tagline}
                    </p>
                  </div>
                </div>

                {/* Direct Connect Buttons */}
                <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto">
                  <a
                    href={ownerInfo.portfolio}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow transition hover:bg-emerald-500"
                  >
                    <Globe className="h-3.5 w-3.5" />
                    Portfolio
                  </a>
                  <a
                    href={ownerInfo.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-xl bg-[#0A66C2] px-3.5 py-2 text-xs font-semibold text-white shadow transition hover:bg-[#084e96]"
                  >
                    <LinkedinIcon className="h-3.5 w-3.5" />
                    LinkedIn
                  </a>
                  <a
                    href={ownerInfo.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-100 dark:bg-zinc-800 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-zinc-200 transition hover:bg-slate-200 dark:hover:bg-zinc-700"
                  >
                    <GithubIcon className="h-3.5 w-3.5" />
                    GitHub
                  </a>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 leading-relaxed">
                {ownerInfo.bio}
              </p>

              {/* Skills & Expertise */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-3">
                  Technical Core Competencies
                </h4>
                <div className="flex flex-wrap gap-2">
                  {ownerInfo.skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-lg border border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-zinc-900 px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:text-zinc-300"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Links & Contact Card */}
            <div className="lg:col-span-4 theme-card rounded-2xl p-6 sm:p-7 space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-4 flex items-center gap-2">
                  <Compass className="h-4 w-4 text-indigo-500" />
                  Official Links & Profiles
                </h3>

                <div className="space-y-2.5">
                  {/* Portfolio */}
                  <a
                    href={ownerInfo.portfolio}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between rounded-xl border border-emerald-200/80 dark:border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-950/20 p-3 text-xs transition hover:border-emerald-500/40 hover:bg-emerald-50/70 dark:hover:bg-emerald-950/40"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <Globe className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                          Personal Portfolio
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-zinc-500">
                          palakharinkhede4.github.io
                        </div>
                      </div>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-emerald-500" />
                  </a>

                  {/* LinkedIn */}
                  <a
                    href={ownerInfo.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between rounded-xl border border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-zinc-900/60 p-3 text-xs transition hover:border-indigo-500/40 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/20"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0A66C2]/10 text-[#0A66C2]">
                        <LinkedinIcon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                          LinkedIn Profile
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-zinc-500">
                          /in/palakharinkhede
                        </div>
                      </div>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-slate-400 group-hover:text-indigo-500" />
                  </a>

                  {/* GitHub Profile */}
                  <a
                    href={ownerInfo.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between rounded-xl border border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-zinc-900/60 p-3 text-xs transition hover:border-indigo-500/40 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/20"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900/10 dark:bg-white/10 text-slate-900 dark:text-white">
                        <GithubIcon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                          GitHub Profile
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-zinc-500">
                          @palakharinkhede4
                        </div>
                      </div>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-slate-400 group-hover:text-indigo-500" />
                  </a>

                  {/* GitHub Repository */}
                  <a
                    href={ownerInfo.repo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between rounded-xl border border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-zinc-900/60 p-3 text-xs transition hover:border-indigo-500/40 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/20"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                        <Code2 className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                          Project Repository
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-zinc-500">
                          Voice-Finance-Buddy
                        </div>
                      </div>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-slate-400 group-hover:text-indigo-500" />
                  </a>
                </div>
              </div>

              <div className="rounded-xl border border-indigo-100 dark:border-indigo-500/10 bg-indigo-50/50 dark:bg-indigo-950/20 p-3 text-[11px] text-slate-600 dark:text-zinc-400 mt-4">
                <span className="font-semibold text-indigo-700 dark:text-indigo-300">Open for Collaboration:</span> Connect on LinkedIn or visit portfolio for AI/ML engineering, multi-agent systems, or full-stack software development.
              </div>
            </div>
          </div>
        </section>

        {/* ARCHITECTURE WITH BEAUTIFUL INTERACTIVE DIAGRAMS */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/[0.06] pb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold">
                  <Layers className="h-4 w-4" />
                </div>
                High-Performance Architecture & Flow Diagrams
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-0.5">
                Visualizing the multi-stage execution pipeline, agent dispatchers, and edge infrastructure
              </p>
            </div>

            {/* Diagram Switcher Tabs */}
            <div className="flex items-center gap-1 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-100 dark:bg-zinc-900 p-1 text-xs">
              <button
                onClick={() => setActiveDiagramTab("system")}
                className={`rounded-lg px-3 py-1.5 font-medium transition ${
                  activeDiagramTab === "system"
                    ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                1. System Lifecycle
              </button>
              <button
                onClick={() => setActiveDiagramTab("agents")}
                className={`rounded-lg px-3 py-1.5 font-medium transition ${
                  activeDiagramTab === "agents"
                    ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                2. Multi-Agent Router
              </button>
              <button
                onClick={() => setActiveDiagramTab("tech")}
                className={`rounded-lg px-3 py-1.5 font-medium transition ${
                  activeDiagramTab === "tech"
                    ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                3. Tech Stack Blueprint
              </button>
            </div>
          </div>

          {/* DIAGRAM 1: COMPLETE SYSTEM REQUEST LIFECYCLE */}
          {activeDiagramTab === "system" && (
            <div className="theme-card rounded-2xl p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.04] pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    End-to-End Voice & Query Request Lifecycle
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    From audio microphone waveform capture to stage latency profiling and speech playback
                  </p>
                </div>
                <span className="rounded-full bg-indigo-500/10 px-2.5 py-1 text-[11px] font-mono font-medium text-indigo-600 dark:text-indigo-400">
                  Avg Telemetry Latency: ~300ms - 800ms
                </span>
              </div>

              {/* Visual Flow Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Node 1: Input & Audio Transcription */}
                <div className="relative rounded-xl border border-indigo-200/80 dark:border-indigo-500/20 bg-indigo-50/40 dark:bg-indigo-950/20 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-600 text-white font-mono text-xs font-bold">
                      01
                    </span>
                    <span className="rounded bg-indigo-100 dark:bg-indigo-900/60 px-1.5 py-0.5 text-[10px] font-medium text-indigo-700 dark:text-indigo-300">
                      Input Layer
                    </span>
                  </div>
                  <div className="font-semibold text-slate-900 dark:text-white text-sm">
                    Voice & Text Ingestion
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-zinc-400">
                    • Web MediaRecorder captures high-fidelity audio chunk
                    <br />• Dual STT Engine: Web Speech API + Groq Whisper Large v3
                    <br />• Instant transcription streaming
                  </p>
                  <div className="flex items-center gap-1 text-[10px] font-mono text-indigo-600 dark:text-indigo-400">
                    <Mic className="h-3 w-3" /> /api/transcribe
                  </div>
                </div>

                {/* Node 2: Prompt Guard & Security */}
                <div className="relative rounded-xl border border-amber-200/80 dark:border-amber-500/20 bg-amber-50/40 dark:bg-amber-950/20 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-600 text-white font-mono text-xs font-bold">
                      02
                    </span>
                    <span className="rounded bg-amber-100 dark:bg-amber-900/60 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300">
                      Stage 1: Guard
                    </span>
                  </div>
                  <div className="font-semibold text-slate-900 dark:text-white text-sm">
                    Deterministic Security
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-zinc-400">
                    • Pre-LLM Regex injection check
                    <br />• Blocks jailbreak vectors, system leaks, and malicious prompts
                    <br />• 0ms cold latency overhead
                  </p>
                  <div className="flex items-center gap-1 text-[10px] font-mono text-amber-600 dark:text-amber-400">
                    <ShieldCheck className="h-3 w-3" /> prompt-guard.ts
                  </div>
                </div>

                {/* Node 3: Intent Classification & Agent Dispatch */}
                <div className="relative rounded-xl border border-emerald-200/80 dark:border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-950/20 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-600 text-white font-mono text-xs font-bold">
                      03
                    </span>
                    <span className="rounded bg-emerald-100 dark:bg-emerald-900/60 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-300">
                      Stage 2-3: Execution
                    </span>
                  </div>
                  <div className="font-semibold text-slate-900 dark:text-white text-sm">
                    Multi-Agent Tools
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-zinc-400">
                    • Routes to Expense, Budget, Market, Tax, or Planner Agent
                    <br />• Executes database queries & financial calculators
                    <br />• Injects structured financial telemetry
                  </p>
                  <div className="flex items-center gap-1 text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                    <Bot className="h-3 w-3" /> orchestrator.ts
                  </div>
                </div>

                {/* Node 4: LLM Synthesis & Speech Output */}
                <div className="relative rounded-xl border border-purple-200/80 dark:border-purple-500/20 bg-purple-50/40 dark:bg-purple-950/20 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-purple-600 text-white font-mono text-xs font-bold">
                      04
                    </span>
                    <span className="rounded bg-purple-100 dark:bg-purple-900/60 px-1.5 py-0.5 text-[10px] font-medium text-purple-700 dark:text-purple-300">
                      Stage 4: Synthesis
                    </span>
                  </div>
                  <div className="font-semibold text-slate-900 dark:text-white text-sm">
                    Reasoning & Speech TTS
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-zinc-400">
                    • Groq Llama 3.3 70B / Gemini 2.0 Flash generation
                    <br />• Synthesized speech with natural Indian English cadence
                    <br />• Updates UI telemetry and charts
                  </p>
                  <div className="flex items-center gap-1 text-[10px] font-mono text-purple-600 dark:text-purple-400">
                    <Volume2 className="h-3 w-3" /> Web Speech Synthesis
                  </div>
                </div>
              </div>

              {/* Connecting Data Pipeline Bar */}
              <div className="rounded-xl border border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-zinc-900/80 p-4 font-mono text-xs text-slate-600 dark:text-zinc-300">
                <div className="flex flex-wrap items-center justify-center gap-2 text-center">
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold">Mic / Text Input</span>
                  <span>➜</span>
                  <span className="text-amber-600 dark:text-amber-400 font-bold">Security Guard</span>
                  <span>➜</span>
                  <span className="text-cyan-600 dark:text-cyan-400 font-bold">Intent Classifier</span>
                  <span>➜</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">Domain Agent Tools</span>
                  <span>➜</span>
                  <span className="text-purple-600 dark:text-purple-400 font-bold">LLM Synthesis</span>
                  <span>➜</span>
                  <span className="text-rose-600 dark:text-rose-400 font-bold">Voice Output & UI Cards</span>
                </div>
              </div>
            </div>
          )}

          {/* DIAGRAM 2: MULTI-AGENT ORCHESTRATOR & DOMAIN SPECIALISTS */}
          {activeDiagramTab === "agents" && (
            <div className="theme-card rounded-2xl p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.04] pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Multi-Agent Intent Routing & Domain Specialists
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    How user financial intent is classified and delegated to specialized sub-agents with dedicated toolsets
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {/* Agent 1: Expense */}
                <div className="rounded-xl border border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-zinc-900/60 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                    <Wallet className="h-4 w-4" />
                    Expense Agent
                  </div>
                  <div className="text-[11px] font-semibold text-slate-800 dark:text-zinc-200">
                    Ledger & Accounts
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-zinc-400">
                    Queries transaction ledgers, computes categorized spending, and checks live bank/card balances.
                  </p>
                  <div className="rounded bg-slate-200/60 dark:bg-zinc-800/80 p-1.5 font-mono text-[9px] text-slate-700 dark:text-zinc-300">
                    Tools: getAccounts, getTransactions, getSpendingByCategory
                  </div>
                </div>

                {/* Agent 2: Budget */}
                <div className="rounded-xl border border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-zinc-900/60 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                    <Target className="h-4 w-4" />
                    Budget Agent
                  </div>
                  <div className="text-[11px] font-semibold text-slate-800 dark:text-zinc-200">
                    Guardrails & Savings
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-zinc-400">
                    Monitors monthly budget limits, triggers overspending warnings, and calculates savings percentage.
                  </p>
                  <div className="rounded bg-slate-200/60 dark:bg-zinc-800/80 p-1.5 font-mono text-[9px] text-slate-700 dark:text-zinc-300">
                    Tools: getBudgetStatus, evaluateOverspending, getSavingsRate
                  </div>
                </div>

                {/* Agent 3: Investment */}
                <div className="rounded-xl border border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-zinc-900/60 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 font-bold text-xs">
                    <TrendingUp className="h-4 w-4" />
                    Investment Agent
                  </div>
                  <div className="text-[11px] font-semibold text-slate-800 dark:text-zinc-200">
                    Markets & SIP Growth
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-zinc-400">
                    Fetches real-time NSE/BSE stock quotes (Nifty 50, Sensex, Gold) and projects compound SIP returns.
                  </p>
                  <div className="rounded bg-slate-200/60 dark:bg-zinc-800/80 p-1.5 font-mono text-[9px] text-slate-700 dark:text-zinc-300">
                    Tools: getMarketOverview, searchStock, calculateSIPReturns
                  </div>
                </div>

                {/* Agent 4: Tax */}
                <div className="rounded-xl border border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-zinc-900/60 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs">
                    <Receipt className="h-4 w-4" />
                    Tax Agent
                  </div>
                  <div className="text-[11px] font-semibold text-slate-800 dark:text-zinc-200">
                    Old vs New Regime
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-zinc-400">
                    Calculates Indian Income Tax for FY 2024-25, 87A rebate, standard deduction, and 4% cess.
                  </p>
                  <div className="rounded bg-slate-200/60 dark:bg-zinc-800/80 p-1.5 font-mono text-[9px] text-slate-700 dark:text-zinc-300">
                    Tools: calculateIncomeTax, compareTaxRegimes
                  </div>
                </div>

                {/* Agent 5: Planner */}
                <div className="rounded-xl border border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-zinc-900/60 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold text-xs">
                    <Compass className="h-4 w-4" />
                    Planner Agent
                  </div>
                  <div className="text-[11px] font-semibold text-slate-800 dark:text-zinc-200">
                    Wealth Advisory
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-zinc-400">
                    Holistic financial health audit, milestone progress tracking, and emergency fund recommendations.
                  </p>
                  <div className="rounded bg-slate-200/60 dark:bg-zinc-800/80 p-1.5 font-mono text-[9px] text-slate-700 dark:text-zinc-300">
                    Tools: getFullFinancialSnapshot, evaluateGoals
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DIAGRAM 3: TECH STACK & INFRASTRUCTURE BLUEPRINT */}
          {activeDiagramTab === "tech" && (
            <div className="theme-card rounded-2xl p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.04] pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Technology Stack & Cloud Architecture Blueprint
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Engineered for zero cold sleeps, instantaneous edge responsiveness, and maximum accessibility
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Layer 1: Client & Presentation */}
                <div className="space-y-3 rounded-xl border border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-zinc-900/50 p-5">
                  <div className="flex items-center gap-2 font-bold text-xs text-indigo-600 dark:text-indigo-400">
                    <Globe className="h-4 w-4" />
                    Frontend & Client Layer
                  </div>
                  <ul className="space-y-2 text-xs text-slate-600 dark:text-zinc-300">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-indigo-500 mt-0.5 flex-shrink-0" />
                      <span><strong>Next.js 15 App Router</strong> with React 19 Client Components</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-indigo-500 mt-0.5 flex-shrink-0" />
                      <span><strong>Tailwind CSS</strong> + Obsidian Glassmorphic Design System</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-indigo-500 mt-0.5 flex-shrink-0" />
                      <span><strong>Recharts</strong> interactive SVG financial telemetry graphs</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-indigo-500 mt-0.5 flex-shrink-0" />
                      <span><strong>Web Audio & Speech API</strong> client-side TTS & speech recognition</span>
                    </li>
                  </ul>
                </div>

                {/* Layer 2: Edge API & Agent Orchestration */}
                <div className="space-y-3 rounded-xl border border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-zinc-900/50 p-5">
                  <div className="flex items-center gap-2 font-bold text-xs text-emerald-600 dark:text-emerald-400">
                    <Server className="h-4 w-4" />
                    Edge & Compute Layer
                  </div>
                  <ul className="space-y-2 text-xs text-slate-600 dark:text-zinc-300">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span><strong>Vercel Serverless Edge</strong>: 100% uptime with zero sleep lag</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span><strong>Multi-Agent Orchestrator</strong>: TypeScript-native router</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span><strong>Deterministic Security Guardrail</strong>: Regex jailbreak filter</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span><strong>High-Precision Calculators</strong>: SIP, EMI, FD, and Tax engines</span>
                    </li>
                  </ul>
                </div>

                {/* Layer 3: AI Models & Data Providers */}
                <div className="space-y-3 rounded-xl border border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-zinc-900/50 p-5">
                  <div className="flex items-center gap-2 font-bold text-xs text-purple-600 dark:text-purple-400">
                    <Cpu className="h-4 w-4" />
                    AI & Model Inference Layer
                  </div>
                  <ul className="space-y-2 text-xs text-slate-600 dark:text-zinc-300">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-purple-500 mt-0.5 flex-shrink-0" />
                      <span><strong>Groq Cloud</strong>: Llama 3.3 70B Versatile (ultra-low inference latency)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-purple-500 mt-0.5 flex-shrink-0" />
                      <span><strong>Groq Whisper Large v3</strong>: Whisper audio transcription</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-purple-500 mt-0.5 flex-shrink-0" />
                      <span><strong>Google Gemini / OpenAI Fallback</strong>: Multi-provider redundancy</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-purple-500 mt-0.5 flex-shrink-0" />
                      <span><strong>Market Ticker Feeds</strong>: Real-time NSE/BSE indices & commodities</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* CORE FEATURES & WORKING HIGHLIGHTS */}
        <section className="space-y-6">
          <div className="border-b border-slate-200 dark:border-white/[0.06] pb-4">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold">
                <Zap className="h-4 w-4" />
              </div>
              Key Features & Architectural Capabilities
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-0.5">
              Built for speed, accuracy, privacy, and frictionless financial conversation
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Feature 1 */}
            <div className="theme-card rounded-2xl p-5 space-y-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <Mic className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Bilingual Voice Recognition
              </h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                Seamlessly understands natural Indian English, Hindi, and Hinglish queries (e.g. <em>"Mera HDFC account balance kitna hai?"</em> or <em>"Calculate SIP for 15,000"</em>).
              </p>
            </div>

            {/* Feature 2 */}
            <div className="theme-card rounded-2xl p-5 space-y-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Lock className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Prompt Injection Defense
              </h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                Deterministic security layer that sanitizes user queries before reaching LLM backends, preventing system prompt extraction and unauthorized instruction hijacking.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="theme-card rounded-2xl p-5 space-y-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Receipt className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                FY 2024-25 Tax Engine
              </h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                Side-by-side Old vs New Tax Regime calculations incorporating updated standard deductions, Section 87A rebates, and surcharge slabs.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="theme-card rounded-2xl p-5 space-y-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <TrendingUp className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Live Market Telemetry
              </h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                Real-time Nifty 50, Sensex, Gold 24K, and USD/INR indices with live percentage delta indicators directly in the header and assistant stream.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="theme-card rounded-2xl p-5 space-y-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                <Database className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                In-Memory & IndexedDB Storage
              </h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                Instant transaction ledgers, automatic category aggregation, savings rate calculation, and net worth profiling with local privacy.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="theme-card rounded-2xl p-5 space-y-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                <Terminal className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                4-Stage Pipeline Profiling
              </h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                Transparent telemetry modal displaying millisecond latency metrics for Security, Routing, Tool Invocations, and LLM Generation.
              </p>
            </div>
          </div>
        </section>

        {/* REPOSITORY & DEPLOYMENT SECTION */}
        <section className="rounded-3xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-zinc-900/60 p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <GithubIcon className="h-5 w-5" />
                Source Code & Open Resources
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                Explore the complete codebase, clone locally, or deploy your own instance
              </p>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={ownerInfo.portfolio}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow transition hover:bg-emerald-500"
              >
                <Globe className="h-3.5 w-3.5" />
                Portfolio
              </a>
              <a
                href={ownerInfo.repo}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-xl bg-slate-900 dark:bg-white px-4 py-2 text-xs font-semibold text-white dark:text-slate-900 shadow transition hover:bg-slate-800 dark:hover:bg-zinc-200"
              >
                <GithubIcon className="h-3.5 w-3.5" />
                Star on GitHub
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-zinc-950 p-4 space-y-2">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
                Clone Repository Command
              </span>
              <div className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-zinc-900 p-2 font-mono text-xs text-slate-800 dark:text-zinc-200">
                <span className="truncate">git clone https://github.com/palakharinkhede4/Voice-Finance-Buddy.git</span>
                <button
                  onClick={() => copyToClipboard("git clone https://github.com/palakharinkhede4/Voice-Finance-Buddy.git", "clone-cmd")}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
                  title="Copy command"
                >
                  {copiedLink === "clone-cmd" ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-zinc-950 p-4 space-y-2">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
                Local Quickstart
              </span>
              <div className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-zinc-900 p-2 font-mono text-xs text-slate-800 dark:text-zinc-200">
                <span>npm install && npm run dev</span>
                <button
                  onClick={() => copyToClipboard("npm install && npm run dev", "npm-cmd")}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
                  title="Copy command"
                >
                  {copiedLink === "npm-cmd" ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 dark:border-white/[0.06] bg-white dark:bg-[#0A0C13] py-6 text-center text-xs text-slate-500 dark:text-zinc-500 transition-colors mt-12">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800 dark:text-zinc-300">Voice Finance Buddy</span>
            <span>•</span>
            <span>Created by <a href={ownerInfo.linkedin} target="_blank" rel="noopener noreferrer" className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline">{ownerInfo.name}</a></span>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">
              Dashboard
            </Link>
            <a href={ownerInfo.portfolio} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition">
              Portfolio
            </a>
            <a href={ownerInfo.github} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">
              GitHub Profile
            </a>
            <a href={ownerInfo.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">
              LinkedIn
            </a>
            <a href={ownerInfo.repo} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">
              Repository
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
