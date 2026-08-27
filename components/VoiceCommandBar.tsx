"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
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
  AlertCircle,
  X,
  Radio,
  Globe,
  SlidersHorizontal,
  Info,
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
  const [interimText, setInterimText] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [selectedLang, setSelectedLang] = useState<string>("en-IN");
  const [hasSpeechRecognition, setHasSpeechRecognition] = useState(false);
  const [forceMediaRecorder, setForceMediaRecorder] = useState(false);

  // References
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Detect browser speech recognition support
  useEffect(() => {
    if (typeof window !== "undefined") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const hasRec = Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
      setHasSpeechRecognition(hasRec);
    }
  }, []);

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

  // Stop Recording / Recognition helper
  const stopRecording = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    setIsRecording(false);
  }, []);

  // Option B: MediaRecorder Microphone Stream Recording
  const startMediaRecorder = useCallback(async (customInfo?: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : MediaRecorder.isTypeSupported("audio/mp4")
          ? "audio/mp4"
          : undefined,
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType || "audio/webm",
        });

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        const formData = new FormData();
        formData.append("file", audioBlob, "recording.webm");

        try {
          const res = await fetch("/api/transcribe", {
            method: "POST",
            body: formData,
          });

          const data = await res.json();

          if (res.ok && data.transcript && data.transcript.trim()) {
            const text = data.transcript.trim();
            setInputText(text);
            setInterimText("");
            setErrorMessage(null);
            setInfoMessage(null);
            onSendMessage(text);
          } else {
            setErrorMessage(
              data.error ||
                "Could not transcribe audio. Please type your query in the input field or check API key."
            );
          }
        } catch (err) {
          console.warn("Transcription API error:", err);
          setErrorMessage("Failed to send audio for transcription. Please check your connection.");
        } finally {
          setIsRecording(false);
          setInterimText("");
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setErrorMessage(null);
      if (customInfo) {
        setInfoMessage(customInfo);
      }
    } catch (err) {
      console.warn("Microphone access failed:", err);
      setIsRecording(false);
      setErrorMessage(
        "Microphone access blocked or unavailable. Please enable microphone permissions in your browser address bar."
      );
    }
  }, [onSendMessage]);

  // Main Record Action
  const startRecording = async () => {
    setErrorMessage(null);
    setInfoMessage(null);
    setInterimText("");

    // If forced to MediaRecorder or Web Speech not available, use MediaRecorder
    if (forceMediaRecorder || !hasSpeechRecognition) {
      startMediaRecorder();
      return;
    }

    // Option A: Native Browser Web Speech API
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRec = typeof window !== "undefined" && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

    if (SpeechRec) {
      try {
        const recognition = new SpeechRec();
        recognitionRef.current = recognition;
        recognition.lang = selectedLang;
        recognition.interimResults = true;
        recognition.continuous = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          setIsRecording(true);
          setErrorMessage(null);
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onresult = (event: any) => {
          let currentInterim = "";
          let finalTranscript = "";

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const item = event.results[i];
            if (item.isFinal) {
              finalTranscript += item[0].transcript;
            } else {
              currentInterim += item[0].transcript;
            }
          }

          const liveText = finalTranscript || currentInterim;
          if (liveText) {
            setInterimText(liveText);
          }

          if (finalTranscript.trim()) {
            const queryToSend = finalTranscript.trim();
            setInputText(queryToSend);
            setIsRecording(false);
            setInterimText("");
            onSendMessage(queryToSend);
          }
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onerror = (event: any) => {
          const errType = event.error;
          console.warn("Speech recognition error:", errType);

          if (errType === "network") {
            // Google Speech Service blocked (e.g. Brave browser or adblock/firewall)
            // Seamlessly fall back to MediaRecorder audio capture immediately!
            setForceMediaRecorder(true);
            stopRecording();
            startMediaRecorder(
              "Google speech service blocked in browser. Automatically switched to Microphone Audio mode."
            );
            return;
          }

          setIsRecording(false);

          if (errType === "no-speech") {
            setErrorMessage("No speech was detected. Please try speaking again.");
          } else if (errType === "not-allowed" || errType === "permission-denied") {
            setErrorMessage("Microphone access was denied. Please allow microphone permissions in your browser address bar.");
          } else if (errType === "audio-capture") {
            setErrorMessage("No microphone found. Please check your audio input device.");
          } else {
            setErrorMessage(`Speech recognition notice: ${errType || "Unable to capture audio"}. Try typing your query.`);
          }
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognition.start();

        // Safety timeout after 15 seconds
        timeoutRef.current = setTimeout(() => {
          if (recognitionRef.current) {
            try {
              recognitionRef.current.stop();
            } catch {
              // ignore
            }
          }
          setIsRecording(false);
        }, 15000);

        return;
      } catch (err) {
        console.warn("Web Speech API init failed, switching to MediaRecorder:", err);
        setForceMediaRecorder(true);
        startMediaRecorder();
      }
    } else {
      startMediaRecorder();
    }
  };

  const handleSend = () => {
    if (!inputText.trim() || loading) return;
    onSendMessage(inputText.trim());
    setInputText("");
    setInterimText("");
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
      <div className="theme-card rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-white/[0.08] shadow-sm">
        {/* Info Banner */}
        {infoMessage && (
          <div className="mb-3.5 flex items-center justify-between gap-2 rounded-xl border border-indigo-500/20 bg-indigo-500/10 px-3.5 py-2.5 text-xs text-indigo-600 dark:text-indigo-300">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 flex-shrink-0" />
              <span>{infoMessage}</span>
            </div>
            <button
              onClick={() => setInfoMessage(null)}
              className="rounded p-1 hover:bg-indigo-500/20 text-indigo-500 transition"
              title="Dismiss note"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Error Notification Banner */}
        {errorMessage && (
          <div className="mb-3.5 flex items-center justify-between gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3.5 py-2.5 text-xs text-rose-600 dark:text-rose-400">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="rounded p-1 hover:bg-rose-500/20 text-rose-500 transition"
              title="Dismiss error"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between">
          {/* Voice Mic Hero Action */}
          <div className="flex items-center gap-3.5">
            {isRecording ? (
              <button
                onClick={stopRecording}
                className="mic-active-pulse flex h-11 items-center gap-2.5 rounded-xl bg-rose-600 px-4 text-xs font-semibold text-white transition hover:bg-rose-500 shadow-md active:scale-98"
              >
                <MicOff className="h-4 w-4 animate-pulse" />
                <div className="flex items-center gap-1">
                  <span className="h-2 w-1 rounded-full bg-white wave-bar-1" />
                  <span className="h-4 w-1 rounded-full bg-white wave-bar-2" />
                  <span className="h-3 w-1 rounded-full bg-white wave-bar-3" />
                  <span className="h-5 w-1 rounded-full bg-white wave-bar-4" />
                </div>
                <span>Listening... Tap to Finish</span>
              </button>
            ) : (
              <button
                onClick={startRecording}
                disabled={loading}
                className="flex h-11 items-center gap-2.5 rounded-xl bg-indigo-600 px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-500 active:scale-98 disabled:opacity-50"
              >
                <Mic className="h-4 w-4 text-white" />
                <span>Tap to Speak</span>
              </button>
            )}

            <div className="text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-white">
                <span>Voice Command Console</span>
                <button
                  onClick={() => setForceMediaRecorder(!forceMediaRecorder)}
                  title="Click to toggle between Browser Web Speech and Microphone Audio capture modes"
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium transition cursor-pointer ${
                    !forceMediaRecorder && hasSpeechRecognition
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
                      : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20"
                  }`}
                >
                  <Radio className="h-2.5 w-2.5 animate-pulse" />
                  <span>
                    {!forceMediaRecorder && hasSpeechRecognition
                      ? "Web Speech (Live)"
                      : "Mic Audio Mode"}
                  </span>
                  <SlidersHorizontal className="h-2.5 w-2.5 ml-0.5 opacity-60" />
                </button>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {isRecording
                  ? "Speak your query naturally (e.g. what is my balance, compare tax)..."
                  : "Instant voice recognition in English or Hindi"}
              </div>
            </div>
          </div>

          {/* Controls: Language & Audio toggle */}
          <div className="flex items-center gap-2">
            {/* Language Selector */}
            <div className="flex items-center gap-1 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-zinc-900 px-2 py-1.5 text-xs text-slate-600 dark:text-slate-300">
              <Globe className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={selectedLang}
                onChange={(e) => setSelectedLang(e.target.value)}
                className="bg-transparent text-[11px] font-medium text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
                title="Select recognition language"
              >
                <option value="en-IN" className="dark:bg-zinc-900">EN (India)</option>
                <option value="hi-IN" className="dark:bg-zinc-900">HI (Hindi)</option>
                <option value="en-US" className="dark:bg-zinc-900">EN (US)</option>
              </select>
            </div>

            {/* Auto-speech audio toggle */}
            <button
              onClick={() => setAutoSpeak(!autoSpeak)}
              title={autoSpeak ? "Spoken audio playback is ON" : "Spoken audio playback is MUTED"}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition ${
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

        {/* Live Audio Transcript Preview during speech */}
        {isRecording && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/5 px-3 py-2 text-xs text-indigo-900 dark:text-indigo-200 animate-fadeIn">
            <Radio className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 animate-pulse flex-shrink-0" />
            <span className="font-semibold text-indigo-600 dark:text-indigo-400">Hearing:</span>
            <span className="italic font-medium text-slate-700 dark:text-slate-200 truncate">
              {interimText || "Listening for your voice... Tap finish when done"}
            </span>
          </div>
        )}

        {/* Text Input Field */}
        <div className="mt-3.5 flex items-center gap-2 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-zinc-900/80 px-3 py-1.5 focus-within:border-indigo-500/50 transition">
          <input
            type="text"
            placeholder="Type your question (e.g. what is my balance, compare tax, calculate SIP)..."
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
            title="Send query"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Quick Action Chips */}
        <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400 mr-1 flex-shrink-0">
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
