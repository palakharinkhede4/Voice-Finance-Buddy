import { NextRequest, NextResponse } from "next/server";
import { getSettings } from "@/lib/config/settings";

export async function POST(req: NextRequest) {
  try {
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return NextResponse.json(
        { error: "Audio file is required in multipart/form-data format." },
        { status: 400 }
      );
    }
    const file = formData.get("file") as Blob | null;

    if (!file) {
      return NextResponse.json(
        { error: "Audio file is required." },
        { status: 400 }
      );
    }

    const groqKey = process.env.GROQ_API_KEY?.trim();
    const geminiKey = process.env.GEMINI_API_KEY?.trim();
    const openaiKey = process.env.OPENAI_API_KEY?.trim();

    // ── 1. Try Groq Whisper if key exists ──
    if (groqKey && groqKey.startsWith("gsk_")) {
      try {
        const apiFormData = new FormData();
        apiFormData.append("file", file, "audio.webm");
        apiFormData.append("model", "whisper-large-v3-turbo");
        apiFormData.append("language", "en");

        const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${groqKey}`,
          },
          body: apiFormData,
        });

        if (response.ok) {
          const data = await response.json();
          if (data.text?.trim()) {
            return NextResponse.json({
              transcript: data.text.trim(),
              engine: "Groq Whisper Large v3",
            });
          }
        } else {
          console.warn("Groq Whisper failed with status:", response.status);
        }
      } catch (err) {
        console.warn("Groq Whisper error:", err);
      }
    }

    // ── 2. Try Google Gemini Multimodal Audio STT ──
    if (geminiKey) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const base64Audio = Buffer.from(arrayBuffer).toString("base64");
        const mimeType = file.type || "audio/webm";

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: "Transcribe this spoken audio verbatim in English or Hinglish. Output ONLY the transcribed query text, nothing else. Do not add quotes or commentary.",
                    },
                    {
                      inline_data: {
                        mime_type: mimeType,
                        data: base64Audio,
                      },
                    },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0.0,
                maxOutputTokens: 150,
              },
            }),
          }
        );

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const transcript = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
          if (transcript) {
            return NextResponse.json({
              transcript,
              engine: "Google Gemini 2.0 Flash Audio",
            });
          }
        }
      } catch (err) {
        console.warn("Gemini audio transcription error:", err);
      }
    }

    // ── 3. Try OpenAI Whisper if key exists ──
    if (openaiKey && openaiKey.startsWith("sk-")) {
      try {
        const apiFormData = new FormData();
        apiFormData.append("file", file, "audio.webm");
        apiFormData.append("model", "whisper-1");
        apiFormData.append("language", "en");

        const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openaiKey}`,
          },
          body: apiFormData,
        });

        if (response.ok) {
          const data = await response.json();
          if (data.text?.trim()) {
            return NextResponse.json({
              transcript: data.text.trim(),
              engine: "OpenAI Whisper",
            });
          }
        }
      } catch (err) {
        console.warn("OpenAI Whisper error:", err);
      }
    }

    // ── Diagnostic Fallback when keys are missing or invalid ──
    return NextResponse.json(
      {
        transcript: "",
        fallback: true,
        error:
          "Audio was captured, but no valid speech-to-text API key was found (Groq/Gemini). You can type your query in the search bar, or add a free GROQ_API_KEY / GEMINI_API_KEY in .env.",
      },
      { status: 422 }
    );
  } catch (error) {
    console.error("Transcribe API error:", error);
    return NextResponse.json(
      {
        error: "Failed to transcribe audio.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
