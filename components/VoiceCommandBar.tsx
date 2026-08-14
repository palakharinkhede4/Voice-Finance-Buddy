"use client";

import React, { useState, useRef } from "react";
import { Mic, MicOff, Send, Volume2, VolumeX, Sparkles } from "lucide-react";

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

  // Suggested Prompts (No cheesy emojis)
  const SUGGESTIONS = [
    "What is my current total balance?",
    "How much did I spend on food this month?",
    "Compare Old vs New Tax Regime for 12 LPA",
    "Calculate SIP returns for ₹5,000/mo at 12% for 10 yrs",
    "Analyze my monthly budget status",
  ];

  // Start Voice Recording
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

        // Send to transcription API
        const formData = new FormData();
        formData.append("file", audioBlob, "voice_command.webm");

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
          console.warn("Audio transcription error:", err);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.warn("Microphone access failed or blocked:", err);
      // Fallback: Web Speech Recognition API if available in browser
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
      {/* Quick Suggestion Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <span className="flex items-center gap-1 text-slate-500 text-[11px] font-medium mr-1">
          <Sparkles className="h-3 w-3 text-indigo-400" />
          <span>Quick:</span>
        </span>
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => onSendMessage(s)}
            className="flex-shrink-0 rounded-lg border border-white/[0.06] bg-surface-card px-2.5 py-1 text-[11px] text-slate-400 transition hover:border-indigo-500/30 hover:bg-surface-hover hover:text-slate-200"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Main Bar */}
      <div className="glass-panel relative flex items-center gap-2 rounded-2xl p-2 shadow-2xl">
        {/* Voice Recording Waveform or Mic Button */}
        {isRecording ? (
          <button
            onClick={stopRecording}
            className="flex h-11 items-center gap-2 rounded-xl bg-rose-600 px-4 text-xs font-semibold text-white shadow-glow transition hover:bg-rose-500"
          >
            <MicOff className="h-4 w-4" />
            <div className="flex items-center gap-1">
              <span className="h-2 w-1 bg-white animate-wave-1 rounded-full"></span>
              <span className="h-4 w-1 bg-white animate-wave-2 rounded-full"></span>
              <span className="h-3 w-1 bg-white animate-wave-3 rounded-full"></span>
              <span className="h-5 w-1 bg-white animate-wave-4 rounded-full"></span>
            </div>
            <span>Listening...</span>
          </button>
        ) : (
          <button
            onClick={startRecording}
            title="Start voice recording"
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-glow transition hover:bg-indigo-500"
          >
            <Mic className="h-4 w-4" />
          </button>
        )}

        {/* Text Input */}
        <input
          type="text"
          placeholder="Ask anything about balance, expenses, SIP returns, or taxes..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading || isRecording}
          className="flex-1 bg-transparent px-3 text-xs text-white placeholder-slate-500 focus:outline-none disabled:opacity-50"
        />

        {/* Auto Speech Synthesis Toggle */}
        <button
          onClick={() => setAutoSpeak(!autoSpeak)}
          title={autoSpeak ? "Spoken response is enabled" : "Spoken response is muted"}
          className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border transition ${
            autoSpeak
              ? "border-indigo-500/40 bg-indigo-500/10 text-indigo-300"
              : "border-white/[0.06] bg-surface-card text-slate-500 hover:text-slate-300"
          }`}
        >
          {autoSpeak ? (
            <Volume2 className="h-4 w-4" />
          ) : (
            <VolumeX className="h-4 w-4" />
          )}
        </button>

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={!inputText.trim() || loading}
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white transition hover:bg-indigo-500 disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
