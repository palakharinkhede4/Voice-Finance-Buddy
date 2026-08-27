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

    const settings = getSettings();

    // If Groq or OpenAI API key is present, attempt Whisper API
    if (settings.apiKey && (process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY)) {
      const isGroq = Boolean(process.env.GROQ_API_KEY);
      const whisperEndpoint = isGroq
        ? "https://api.groq.com/openai/v1/audio/transcriptions"
        : "https://api.openai.com/v1/audio/transcriptions";

      const apiFormData = new FormData();
      apiFormData.append("file", file, "audio.webm");
      apiFormData.append("model", isGroq ? "whisper-large-v3-turbo" : "whisper-1");
      apiFormData.append("language", "en");

      try {
        const response = await fetch(whisperEndpoint, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${settings.apiKey}`,
          },
          body: apiFormData,
        });

        if (response.ok) {
          const data = await response.json();
          return NextResponse.json({
            transcript: data.text?.trim() || "",
            engine: isGroq ? "Groq Whisper Large v3" : "OpenAI Whisper",
          });
        } else {
          const errText = await response.text();
          console.warn("Whisper API returned non-ok status:", response.status, errText);
          return NextResponse.json(
            {
              transcript: "",
              error: `Whisper API failed (${response.status}). Please use Google Chrome/Edge native speech recognition or type your question.`,
            },
            { status: 422 }
          );
        }
      } catch (whisperErr) {
        console.warn("Whisper API network error:", whisperErr);
        return NextResponse.json(
          {
            transcript: "",
            error: "Failed to connect to Whisper API server. Please use browser speech recognition or type your query.",
          },
          { status: 502 }
        );
      }
    }

    // If no backend Whisper key is configured
    return NextResponse.json(
      {
        transcript: "",
        fallback: true,
        error: "No Whisper STT API key configured. Browser Speech Recognition (Web Speech API) is active.",
      },
      { status: 400 }
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
