"use client";

import React, { useState, useRef } from "react";
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  Sparkles,
  Wallet,
  TrendingUp,
  Receipt,
  Target,
} from "lucide-react";

interface VoiceCommandBarProps {
  onSendMessage: (text: string) => void;
  loading?: boolean;
  autoSpeak: boolean;
  setAutoSpeak: (val: boolean) => void;
}

export const VoiceCommandBar: React.FC<VoiceCommandBarProps> = ({
  onSendMessage,
  loading = false,
  autoSpeak,
  setAutoSpeak,
}) => {
  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Categorized Quick Prompts
  const PROMPTS = [
    {
      category: "Balance",
      label: "Account Balance",
      query: "What is my total account balance across savings and checking?",
      icon: Wallet,
    },
    {
      category: "Expenses",
      label: "Food Expenses",
      query: "How much did I spend on food and dining this month?",
      icon: Target,
    },
    {
      category: "Tax",
      label: "Tax Comparison",
      query: "Compare Old vs New Tax Regime for 12 LPA salary",
      icon: Receipt,
    },
    {
      category: "SIP",
      label: "SIP Projection",
      query: "Calculate SIP returns for ₹10,000 per month at 12% for 10 years",
      icon: TrendingUp,
    },
  ];

  // Start Audio Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach((track) => track.stop());

        const formData = new FormData();
        formData.append("file", audioBlob, "voice_recording.webm");

        try {
          const res = await fetch("/api/transcribe", {
            method: "POST",
            body: formData,
          });

          if (res.ok) {
            const data = await res.json();
            if (data.transcript) {
              onSendMessage(data.transcript);
            }
          }
        } catch (err) {
          console.warn("Transcription request failed:", err);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.warn("Mic access blocked, attempting Web Speech API fallback:", err);
      if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRec();
        recognition.lang = "en-IN";
        recognition.interimResults = false;

        recognition.onstart = () => setIsRecording(true);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            onSendMessage(transcript);
          }
          setIsRecording(false);
        };
        recognition.onerror = () => setIsRecording(false);
        recognition.onend = () => setIsRecording(false);
        recognition.start();
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSend = () => {
    if (!inputText.trim() || loading) return;
    onSendMessage(inputText.trim());
    setInputText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="space-y-3">
      {/* Hero Voice Console Card */}
      <div className="theme-card rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between">
          {/* Voice Mic Hero Action */}
          <div className="flex items-center gap-3.5">
            {isRecording ? (
              <button
                onClick={stopRecording}
                className="mic-active-pulse flex h-11 items-center gap-2.5 rounded-xl bg-rose-600 px-4 text-xs font-semibold text-white transition hover:bg-rose-500 shadow-md"
              >
                <MicOff className="h-4 w-4" />
                <div className="flex items-center gap-1">
                  <span className="h-2 w-1 rounded-full bg-white wave-bar-1" />
                  <span className="h-4 w-1 rounded-full bg-white wave-bar-2" />
                  <span className="h-3 w-1 rounded-full bg-white wave-bar-3" />
                  <span className="h-5 w-1 rounded-full bg-white wave-bar-4" />
                </div>
                <span>Listening... Tap to Send</span>
              </button>
            ) : (
              <button
                onClick={startRecording}
                className="flex h-11 items-center gap-2.5 rounded-xl bg-indigo-600 px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-500 active:scale-98"
              >
                <Mic className="h-4 w-4 text-white" />
                <span>Tap to Speak</span>
              </button>
            )}

            <div className="hidden sm:block text-xs">
              <div className="font-semibold text-slate-800 dark:text-white">Voice Command Console</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Ask questions naturally in English or Hindi</div>
            </div>
          </div>

          {/* Controls: Auto-speech audio toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoSpeak(!autoSpeak)}
              title={autoSpeak ? "Spoken response is ON" : "Spoken response is MUTED"}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition ${
                autoSpeak
                  ? "border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300"
                  : "border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-zinc-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              {autoSpeak ? (
                <Volume2 className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              ) : (
                <VolumeX className="h-3.5 w-3.5" />
              )}
              <span>{autoSpeak ? "Voice Audio On" : "Muted"}</span>
            </button>
          </div>
        </div>

        {/* Text Input Field */}
        <div className="mt-3.5 flex items-center gap-2 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-zinc-900/80 px-3 py-1.5 focus-within:border-indigo-500/50 transition">
          <input
            type="text"
            placeholder="Type your question (e.g. check balance, compare tax, calculate SIP)..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading || isRecording}
            className="flex-1 bg-transparent py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none disabled:opacity-50"
          />

          <button
            onClick={handleSend}
            disabled={!inputText.trim() || loading}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white transition hover:bg-indigo-500 disabled:opacity-30"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Quick Action Chips */}
        <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400 mr-1">
            <Sparkles className="h-3 w-3 text-indigo-500" />
            <span>Shortcuts:</span>
          </div>

          {PROMPTS.map((p) => {
            const Icon = p.icon;
            return (
              <button
                key={p.label}
                onClick={() => onSendMessage(p.query)}
                className="flex items-center gap-1.5 flex-shrink-0 rounded-lg border border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-zinc-900/60 px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-300 transition hover:border-indigo-500/40 hover:bg-slate-100 dark:hover:bg-zinc-800"
              >
                <Icon className="h-3 w-3 text-indigo-500 dark:text-indigo-400" />
                <span>{p.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
