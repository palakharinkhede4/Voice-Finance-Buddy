import { NextRequest, NextResponse } from "next/server";

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

    let lastProviderError = "";

    // ── 1. Try Google Gemini Multimodal Audio STT (Fastest & Best for Multilingual) ──
    if (geminiKey && geminiKey.length > 5) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const base64Audio = Buffer.from(arrayBuffer).toString("base64");
        // Gemini requires clean MIME type without parameters (e.g. "audio/webm", not "audio/webm;codecs=opus")
        const rawMime = file.type || "audio/webm";
        const cleanMime = rawMime.split(";")[0].trim() || "audio/webm";

        // Try gemini-2.0-flash, then fallback to gemini-1.5-flash
        const modelsToTry = ["gemini-2.0-flash", "gemini-1.5-flash"];
        for (const model of modelsToTry) {
          const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [
                  {
                    parts: [
                      {
                        text: "You are a speech-to-text transcriber for a personal finance app. Transcribe the spoken audio verbatim in English or Hindi/Hinglish. Output ONLY the transcribed query text, nothing else.",
                      },
                      {
                        inline_data: {
                          mime_type: cleanMime,
                          data: base64Audio,
                        },
                      },
                    ],
                  },
                ],
                generationConfig: {
                  temperature: 0.0,
                  maxOutputTokens: 200,
                },
              }),
            }
          );

          if (geminiRes.ok) {
            const geminiData = await geminiRes.json();
            const transcript =
              geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
            if (transcript) {
              return NextResponse.json({
                transcript,
                engine: `Google Gemini (${model}) Audio`,
              });
            }
          } else {
            const errText = await geminiRes.text();
            console.warn(`Gemini (${model}) returned status ${geminiRes.status}:`, errText);
            lastProviderError = `Gemini API (${geminiRes.status}): ${errText.slice(0, 150)}`;
          }
        }
      } catch (err) {
        console.warn("Gemini audio transcription error:", err);
        lastProviderError = `Gemini connection error: ${err instanceof Error ? err.message : String(err)}`;
      }
    }

    // ── 2. Try Groq Whisper if key exists ──
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
          const errText = await response.text();
          console.warn("Groq Whisper failed with status:", response.status, errText);
          lastProviderError = `Groq Whisper (${response.status}): ${errText.slice(0, 150)}`;
        }
      } catch (err) {
        console.warn("Groq Whisper error:", err);
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
        } else {
          const errText = await response.text();
          console.warn("OpenAI Whisper failed with status:", response.status, errText);
          lastProviderError = `OpenAI Whisper (${response.status}): ${errText.slice(0, 150)}`;
        }
      } catch (err) {
        console.warn("OpenAI Whisper error:", err);
      }
    }

    // ── Diagnostic Fallback when keys are missing or failed ──
    const hasAnyKey = Boolean(geminiKey || groqKey || openaiKey);

    return NextResponse.json(
      {
        transcript: "",
        fallback: true,
        error: hasAnyKey
          ? `Audio recorded, but the configured AI STT service returned an error: ${lastProviderError || "Authentication / Model Error"}. If you just added the key in Vercel, please REDEPLOY your project in Vercel for the new environment variable to take effect.`
          : "Audio recorded, but no GEMINI_API_KEY or GROQ_API_KEY is active. If you just added the key in Vercel, please click 'Redeploy' in Vercel to activate it.",
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
