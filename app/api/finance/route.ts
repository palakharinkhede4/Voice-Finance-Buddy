import { NextRequest, NextResponse } from "next/server";
import { getFinanceDB } from "@/lib/db/finance-db";
import { getMarketOverview } from "@/lib/tools/market";
import { getSettings } from "@/lib/config/settings";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "all";
    const db = getFinanceDB();
    const settings = getSettings();

    if (type === "kpis") {
      return NextResponse.json(db.getKPIs());
    }

    if (type === "transactions") {
      const category = searchParams.get("category") || undefined;
      const account = searchParams.get("account") || undefined;
      const limit = parseInt(searchParams.get("limit") || "50", 10);
      return NextResponse.json(db.getTransactions(limit, category, account));
    }

    if (type === "budgets") {
      return NextResponse.json(db.getBudgetStatuses());
    }

    if (type === "market") {
      return NextResponse.json(getMarketOverview());
    }

    // Default: return full dashboard payload
    return NextResponse.json({
      kpis: db.getKPIs(),
      accounts: db.getAccounts(),
      transactions: db.getTransactions(30),
      spendingByCategory: db.getSpendingByCategory(30),
      dailyTrend: db.getDailySpendingTrend(14),
      budgets: db.getBudgetStatuses(),
      goals: db.getGoals(),
      market: getMarketOverview(),
      user: {
        name: settings.userName,
        accountNumber: settings.accountNumber,
        provider: settings.providerName,
      },
    });
  } catch (error) {
    console.error("Finance API GET error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve financial data." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { description, category, amount, account, date } = body;

    if (!description || !category || amount === undefined) {
      return NextResponse.json(
        { error: "Description, category, and amount are required." },
        { status: 400 }
      );
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) {
      return NextResponse.json(
        { error: "Amount must be a valid number." },
        { status: 400 }
      );
    }

    const db = getFinanceDB();
    const txn = db.addTransaction({
      description: description.trim(),
      category: category.trim(),
      amount: numAmount,
      account,
      date,
    });

    return NextResponse.json({
      success: true,
      transaction: txn,
      kpis: db.getKPIs(),
      budgets: db.getBudgetStatuses(),
    });
  } catch (error) {
    console.error("Finance API POST error:", error);
    return NextResponse.json(
      { error: "Failed to record transaction." },
      { status: 500 }
    );
  }
}
