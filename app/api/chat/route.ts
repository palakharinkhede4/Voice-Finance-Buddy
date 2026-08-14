import { NextRequest, NextResponse } from "next/server";
import { processFinanceQuery } from "@/lib/agents/orchestrator";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const query = body.query?.trim() || "";
    const history = body.history || [];

    if (!query) {
      return NextResponse.json(
        { error: "Query is required." },
        { status: 400 }
      );
    }

    const result = await processFinanceQuery(query, history);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error occurred while processing query.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
