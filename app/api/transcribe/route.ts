import { NextRequest, NextResponse } from "next/server";
import { getSettings } from "@/lib/config/settings";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as Blob | null;

    if (!file) {
      return NextResponse.json(
        { error: "Audio file is required." },
        { status: 400 }
      );
    }

    const settings = getSettings();

    // If Groq or OpenAI API key is present, use Whisper API
    if (settings.apiKey) {
      const isGroq = Boolean(process.env.GROQ_API_KEY);
      const whisperEndpoint = isGroq
        ? "https://api.groq.com/openai/v1/audio/transcriptions"
        : "https://api.openai.com/v1/audio/transcriptions";

      const apiFormData = new FormData();
      apiFormData.append("file", file, "audio.webm");
      apiFormData.append("model", isGroq ? "whisper-large-v3-turbo" : "whisper-1");
      apiFormData.append("language", "en");

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
      }
    }

    // Fallback: If no backend Whisper key is set, client can use browser Web Speech API
    return NextResponse.json({
      transcript: "",
      fallback: true,
      message: "Browser Web Speech API used as fallback",
    });
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
