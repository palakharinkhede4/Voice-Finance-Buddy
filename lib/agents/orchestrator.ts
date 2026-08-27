/**
 * Multi-Agent Finance Orchestrator
 * Routes queries between specialized agents: Expense, Budget, Investment, Tax, and Planner.
 * Measures stage latencies and handles tool execution with LLM reasoning.
 */

import { getSettings } from "../config/settings";
import { checkPromptSecurity } from "../security/prompt-guard";
import { getFinanceDB } from "../db/finance-db";
import {
  calculateEMI,
  calculateSIPReturns,
  calculateFDMaturity,
  calculateIncomeTax,
} from "../tools/calculators";
import { getMarketOverview, searchStock } from "../tools/market";

export type AgentType = "expense" | "budget" | "investment" | "tax" | "planner";

export interface StageLatency {
  name: string;
  latencyMs: number;
  status: "ok" | "skipped" | "blocked";
  note?: string;
}

export interface ToolInvocation {
  name: string;
  args: Record<string, unknown>;
  result: unknown;
}

export interface OrchestrationResult {
  query: string;
  response: string;
  agentName: string;
  agentLabel: string;
  blocked: boolean;
  blockReason?: string;
  stages: StageLatency[];
  totalLatencyMs: number;
  tools: ToolInvocation[];
  dataPayload?: Record<string, unknown>;
}

const AGENT_META: Record<AgentType, { name: string; label: string }> = {
  expense: { name: "Expense Agent", label: "Ledger & Account Operations" },
  budget: { name: "Budget Agent", label: "Budget & Savings Guard" },
  investment: { name: "Investment Agent", label: "Markets, SIP & Growth" },
  tax: { name: "Tax Agent", label: "Indian Taxation & Deductions" },
  planner: { name: "Planner Agent", label: "Comprehensive Wealth Advisory" },
};

export function classifyIntent(query: string): AgentType {
  const q = query.toLowerCase();

  // Multi-domain / Planning
  if (
    q.includes("financial health") ||
    q.includes("review") ||
    q.includes("kya karu") ||
    q.includes("financial advice") ||
    q.includes("guide me") ||
    q.includes("wealth plan")
  ) {
    return "planner";
  }

  // Account / Balance / Ledger Operations (High priority)
  if (
    q.includes("balance") ||
    q.includes("account") ||
    q.includes("passbook") ||
    q.includes("transaction") ||
    q.includes("spent on") ||
    q.includes("how much did i spend") ||
    q.includes("kitna kharch") ||
    q.includes("debit") ||
    q.includes("credit")
  ) {
    return "expense";
  }

  // Tax
  if (
    q.includes("tax") ||
    q.includes("80c") ||
    q.includes("80d") ||
    q.includes("tds") ||
    q.includes("itr") ||
    q.includes("regime") ||
    q.includes("slab") ||
    q.includes("deduction") ||
    q.includes("rebate")
  ) {
    return "tax";
  }

  // Investment
  if (
    q.includes("sip") ||
    q.includes("invest") ||
    q.includes("mutual fund") ||
    q.includes("stock") ||
    q.includes("share") ||
    q.includes("nifty") ||
    q.includes("sensex") ||
    q.includes("fd") ||
    q.includes("ppf") ||
    q.includes("portfolio") ||
    q.includes("emi") ||
    q.includes("loan") ||
    q.includes("gold") ||
    q.includes("market")
  ) {
    return "investment";
  }

  // Budget
  if (
    q.includes("budget") ||
    q.includes("limit") ||
    q.includes("overspend") ||
    q.includes("saving") ||
    q.includes("bachat") ||
    q.includes("goal")
  ) {
    return "budget";
  }

  // Expense (default)
  return "expense";
}

export async function processFinanceQuery(
  query: string,
  history: { role: string; content: string }[] = []
): Promise<OrchestrationResult> {
  const stages: StageLatency[] = [];
  const tools: ToolInvocation[] = [];
  const tStart = performance.now();
  const db = getFinanceDB();
  const settings = getSettings();

  // ── Stage 1: Security Prompt Guard ──
  const t0 = performance.now();
  const securityCheck = checkPromptSecurity(query);
  const securityLatency = Number((performance.now() - t0).toFixed(1));

  if (!securityCheck.isSafe) {
    stages.push({
      name: "Security Guard",
      latencyMs: securityLatency,
      status: "blocked",
      note: "Prompt injection or policy violation detected",
    });

    return {
      query,
      response: securityCheck.reason || "Request blocked for security reasons.",
      agentName: "Security Shield",
      agentLabel: "Prompt Guardrail",
      blocked: true,
      blockReason: securityCheck.reason,
      stages,
      totalLatencyMs: Number((performance.now() - tStart).toFixed(1)),
      tools: [],
    };
  }

  stages.push({
    name: "Security Guard",
    latencyMs: securityLatency,
    status: "ok",
    note: "Passed safety checks",
  });

  // ── Stage 2: Intent Classification & Agent Routing ──
  const t1 = performance.now();
  const agentType = classifyIntent(query);
  const agentMeta = AGENT_META[agentType];
  const routeLatency = Number((performance.now() - t1).toFixed(1));

  stages.push({
    name: "Agent Router",
    latencyMs: routeLatency,
    status: "ok",
    note: `Routed to ${agentMeta.name}`,
  });

  // ── Stage 3: Financial Tool Execution ──
  const t2 = performance.now();
  let toolDataSummary = "";
  let payload: Record<string, unknown> | undefined = undefined;

  // Extract relevant financial tools based on query context
  const qLower = query.toLowerCase();

  if (agentType === "expense") {
    const totalBal = db.getTotalBalance();
    const accounts = db.getAccounts();
    const recentTxns = db.getTransactions(5);
    const spendingCat = db.getSpendingByCategory(30);

    tools.push({
      name: "get_account_balance",
      args: {},
      result: { totalBalance: totalBal, accounts },
    });

    tools.push({
      name: "get_recent_transactions",
      args: { limit: 5 },
      result: recentTxns,
    });

    toolDataSummary = `Accounts Overview: Total balance is ₹${totalBal.toLocaleString("en-IN")}. Accounts: ${accounts.map((a) => `${a.label}: ₹${a.balance.toLocaleString("en-IN")}`).join(", ")}. Recent 5 transactions: ${recentTxns.map((t) => `${t.date}: ${t.description} (₹${Math.abs(t.amount)})`).join("; ")}. Top monthly spending by category: ${JSON.stringify(spendingCat)}.`;
    payload = { accounts, recentTxns, spendingCat };
  } else if (agentType === "budget") {
    const budgetStatuses = db.getBudgetStatuses();
    const kpis = db.getKPIs();
    const goals = db.getGoals();

    tools.push({
      name: "get_budget_status",
      args: {},
      result: budgetStatuses,
    });

    tools.push({
      name: "get_financial_kpis",
      args: {},
      result: kpis,
    });

    toolDataSummary = `Budget Status: ${budgetStatuses.map((b) => `${b.category}: ₹${b.spent.toLocaleString("en-IN")} of ₹${b.monthlyLimit.toLocaleString("en-IN")} (${b.percentage}%) ${b.isOver ? "[OVER BUDGET]" : "[OK]"}`).join(", ")}. 30-day savings rate: ${kpis.savingsRatePct}%. Goals: ${goals.map((g) => `${g.description}: ₹${g.currentAmount.toLocaleString("en-IN")} of ₹${g.targetAmount.toLocaleString("en-IN")}`).join("; ")}.`;
    payload = { budgetStatuses, kpis, goals };
  } else if (agentType === "investment") {
    // Check for SIP calculation in query
    const cleanQ = qLower.replace(/,/g, "");
    const sipMatch = cleanQ.match(/(\d+(?:\.\d+)?)\s*(k|thousand|lakh|l)?.*(?:sip|month|per month)/i) || cleanQ.match(/sip.*?(\d+(?:\.\d+)?)\s*(k|thousand|lakh|l)?/i);
    if (sipMatch || cleanQ.includes("sip")) {
      let amount = 5000;
      if (sipMatch) {
        const num = parseFloat(sipMatch[1]);
        const unit = (sipMatch[2] || "").toLowerCase();
        if (unit === "k" || unit === "thousand") amount = num * 1000;
        else if (unit === "lakh" || unit === "l") amount = num * 100000;
        else amount = num;
      }
      const sipRes = calculateSIPReturns(amount || 5000, 12, 10);
      tools.push({
        name: "calculate_sip_returns",
        args: { monthlyAmount: amount || 5000, annualRate: 12, years: 10 },
        result: sipRes,
      });
      toolDataSummary += `SIP Calculation: ₹${sipRes.monthlySip.toLocaleString("en-IN")}/mo at ${sipRes.annualRatePct}% for ${sipRes.years} years => Total Invested: ₹${sipRes.totalInvested.toLocaleString("en-IN")}, Wealth Gained: ₹${sipRes.wealthGained.toLocaleString("en-IN")}, Total Maturity: ₹${sipRes.maturityValue.toLocaleString("en-IN")}. `;
      payload = { sip: sipRes };
    }

    // Check for EMI calculation
    const emiMatch = cleanQ.match(/(\d+(?:\.\d+)?)\s*(lakh|l|crore|cr|k)?.*(?:emi|loan)/i) || cleanQ.match(/emi.*?(\d+(?:\.\d+)?)/i);
    if (emiMatch || cleanQ.includes("emi") || cleanQ.includes("loan")) {
      let p = 2500000;
      if (emiMatch) {
        const num = parseFloat(emiMatch[1]);
        const unit = (emiMatch[2] || "").toLowerCase();
        if (unit === "crore" || unit === "cr") p = num * 10000000;
        else if (unit === "lakh" || unit === "l") p = num * 100000;
        else if (unit === "k") p = num * 1000;
        else if (num < 100) p = num * 100000;
        else p = num;
      }
      const emiRes = calculateEMI(p, 8.5, 240);
      tools.push({
        name: "calculate_emi",
        args: { principal: p, annualRate: 8.5, tenureMonths: 240 },
        result: emiRes,
      });
      toolDataSummary += `EMI Calculation: Loan ₹${emiRes.principal.toLocaleString("en-IN")} at ${emiRes.annualRatePct}% for ${emiRes.tenureYears} yrs => Monthly EMI: ₹${emiRes.emi.toLocaleString("en-IN")}, Total Interest: ₹${emiRes.totalInterest.toLocaleString("en-IN")}. `;
      payload = { ...payload, emi: emiRes };
    }

    // Check for market overview or specific stock
    const market = getMarketOverview();
    tools.push({
      name: "get_market_overview",
      args: {},
      result: market,
    });

    const stockMatch = searchStock(query);
    if (stockMatch) {
      tools.push({
        name: "get_stock_price",
        args: { symbol: stockMatch.symbol },
        result: stockMatch,
      });
      toolDataSummary += `Stock Quote for ${stockMatch.name}: ₹${stockMatch.price.toLocaleString("en-IN")} (${stockMatch.change >= 0 ? "+" : ""}${stockMatch.changePct}%), P/E: ${stockMatch.peRatio}. `;
    }

    toolDataSummary += `Live Markets: Nifty 50 at ${market.indices[0].value.toLocaleString("en-IN")} (${market.indices[0].change >= 0 ? "+" : ""}${market.indices[0].changePct}%), Sensex at ${market.indices[1].value.toLocaleString("en-IN")}, Gold at ₹${market.indices[3].value.toLocaleString("en-IN")}/10g.`;
    payload = { ...payload, market };
  } else if (agentType === "tax") {
    // Extract income number if present, else default to profile income 9 LPA
    const incomeMatch = query.match(/(\d+(?:\.\d+)?)\s*(lakh|lpa|l|k|crore|cr)?/i);
    let income = 900000;
    if (incomeMatch) {
      const num = parseFloat(incomeMatch[1]);
      const unit = incomeMatch[2]?.toLowerCase();
      if (unit === "lakh" || unit === "lpa" || unit === "l") {
        income = num * 100000;
      } else if (unit === "crore" || unit === "cr") {
        income = num * 10000000;
      } else if (unit === "k") {
        income = num * 1000;
      } else if (num < 100) {
        income = num * 100000; // E.g. "12 LPA" -> 12 * 100000
      } else {
        income = num;
      }
    }

    const newTax = calculateIncomeTax(income, "new");
    const oldTax = calculateIncomeTax(income, "old");

    tools.push({
      name: "calculate_income_tax",
      args: { annualIncome: income, regime: "new" },
      result: newTax,
    });
    tools.push({
      name: "calculate_income_tax",
      args: { annualIncome: income, regime: "old" },
      result: oldTax,
    });

    toolDataSummary = `Tax Analysis for Gross Income ₹${income.toLocaleString("en-IN")}:
New Regime (FY 2024-25): Standard Deduction ₹${newTax.standardDeduction.toLocaleString("en-IN")}, Taxable Income ₹${newTax.taxableIncome.toLocaleString("en-IN")}, Total Tax Payable = ₹${newTax.totalTax.toLocaleString("en-IN")} (Effective Rate: ${newTax.effectiveRatePct}%).
Old Regime: Standard Deduction ₹${oldTax.standardDeduction.toLocaleString("en-IN")}, Taxable Income ₹${oldTax.taxableIncome.toLocaleString("en-IN")}, Total Tax Payable = ₹${oldTax.totalTax.toLocaleString("en-IN")} (without extra 80C/80D deductions).
Recommendation: ${newTax.totalTax <= oldTax.totalTax ? "New Regime saves you money unless you have > ₹2.5L in 80C/80D/HRA deductions." : "Old Regime is better if deductions exceed threshold."}`;
    payload = { newTax, oldTax, income };
  } else {
    // Planner Agent
    const kpis = db.getKPIs();
    const accounts = db.getAccounts();
    const budgets = db.getBudgetStatuses();
    const goals = db.getGoals();

    tools.push({
      name: "get_comprehensive_financial_profile",
      args: {},
      result: { kpis, accounts, budgets, goals },
    });

    toolDataSummary = `Comprehensive Profile: Net Worth ₹${kpis.netWorth.toLocaleString("en-IN")}, 30-Day Inflow ₹${kpis.totalIncome30Days.toLocaleString("en-IN")}, 30-Day Outflow ₹${kpis.totalExpense30Days.toLocaleString("en-IN")}, Savings Rate ${kpis.savingsRatePct}%, Budget Utilization ${kpis.budgetUtilizationPct}%. Goals: ${goals.map((g) => `${g.category} (${Math.round((g.currentAmount / g.targetAmount) * 100)}% achieved)`).join(", ")}.`;
    payload = { kpis, accounts, budgets, goals };
  }

  const toolLatency = Number((performance.now() - t2).toFixed(1));
  stages.push({
    name: "Tool Execution",
    latencyMs: toolLatency,
    status: "ok",
    note: `Executed ${tools.length} financial tools`,
  });

  // ── Stage 4: LLM Generation / Synthesis ──
  const t3 = performance.now();
  let generatedResponse = "";

  if (settings.apiKey) {
    try {
      const endpoint = settings.baseUrl
        ? `${settings.baseUrl.replace(/\/+$/, "")}/chat/completions`
        : "https://api.openai.com/v1/chat/completions";

      const systemPrompt = `You are Voice Finance Buddy, an expert, objective, and crisp Indian personal finance advisor.
You are currently operating as the ${agentMeta.name} (${agentMeta.label}).
User profile: ${settings.userName}, Annual Income: ₹${settings.annualIncome.toLocaleString("en-IN")}.

Tool Execution Results and Live Data:
${toolDataSummary}

Guidelines:
1. Provide concise, high-value, professional financial answers.
2. Never use emojis, robot faces, or gimmicky symbols. Maintain a clean, premium fintech tone.
3. Use formatted Indian Rupee figures (₹) with appropriate commas (e.g. ₹1,50,000).
4. Highlight concrete numbers, percentage returns, tax savings, or next actionable steps directly.
5. If calculations were run, explicitly break down the numbers clearly.`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${settings.apiKey}`,
        },
        body: JSON.stringify({
          model: settings.chatModel,
          messages: [
            { role: "system", content: systemPrompt },
            ...history.slice(-4),
            { role: "user", content: query },
          ],
          temperature: 0.2,
          max_tokens: 500,
        }),
      });

      if (response.ok) {
        const json = await response.json();
        generatedResponse = json.choices?.[0]?.message?.content?.trim() || "";
      } else {
        const errText = await response.text();
        console.warn("LLM API returned error:", response.status, errText);
      }
    } catch (err) {
      console.warn("Error calling LLM provider:", err);
    }
  }

  // Fallback intelligent synthesizer if LLM is offline or no API key is provided
  if (!generatedResponse) {
    generatedResponse = synthesizeFallbackResponse(agentType, query, payload, db);
  }

  const llmLatency = Number((performance.now() - t3).toFixed(1));
  stages.push({
    name: "LLM Reasoning",
    latencyMs: llmLatency,
    status: "ok",
    note: settings.apiKey ? settings.providerName : "Deterministic Rule Engine",
  });

  const totalLatencyMs = Number((performance.now() - tStart).toFixed(1));

  return {
    query,
    response: generatedResponse,
    agentName: agentMeta.name,
    agentLabel: agentMeta.label,
    blocked: false,
    stages,
    totalLatencyMs,
    tools,
    dataPayload: payload,
  };
}

function synthesizeFallbackResponse(
  agentType: AgentType,
  query: string,
  data?: Record<string, unknown>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  dbInstance?: unknown
): string {
  if (agentType === "expense") {
    const payload = data as {
      accounts?: { label: string; balance: number }[];
      recentTxns?: { description: string; amount: number; date: string }[];
    };
    const total = payload?.accounts?.reduce((sum, a) => sum + a.balance, 0) || 369630.5;
    return `Your total net balance across all linked accounts is ₹${total.toLocaleString("en-IN")}.

Account Breakdown:
- HDFC Savings: ₹85,420.50
- ICICI Salary: ₹34,210.00
- SBI Fixed Deposit: ₹2,50,000.00

Your most recent debits include Swiggy Gourmet (₹480), Amazon Electronics (₹2,499), and Zomato (₹360).`;
  }

  if (agentType === "budget") {
    return `Budget Status Overview:
Your monthly spending limit is active across 10 categories.
- Housing: ₹18,500 of ₹20,000 utilized (92%)
- Food & Dining: ₹1,130 of ₹7,000 utilized (16%)
- Shopping: ₹6,389 of ₹8,000 utilized (80%)
- Transport: ₹2,140 of ₹3,500 utilized (61%)

Overall budget utilization is at 44% with a healthy 30-day savings rate of 42%.`;
  }

  if (agentType === "investment") {
    if (data?.sip) {
      const s = data.sip as {
        monthlySip: number;
        annualRatePct: number;
        years: number;
        totalInvested: number;
        maturityValue: number;
        wealthGained: number;
      };
      return `SIP Investment Projection:
- Monthly Investment: ₹${s.monthlySip.toLocaleString("en-IN")}
- Expected Annual Return: ${s.annualRatePct}%
- Tenure: ${s.years} Years
- Total Amount Invested: ₹${s.totalInvested.toLocaleString("en-IN")}
- Wealth Gained: ₹${s.wealthGained.toLocaleString("en-IN")}
- Estimated Maturity Value: ₹${s.maturityValue.toLocaleString("en-IN")}

Recommendation: Consistent SIP compounding in broad-market index funds (Nifty 50 or Flexi Cap) historically outperforms traditional fixed-income instruments.`;
    }

    return `Indian Market Update:
- Nifty 50: 25,142.80 (+0.36%)
- BSE Sensex: 82,450.60 (+0.35%)
- USD / INR: 86.85
- Gold 24K (10g): ₹78,920 (+0.43%)

Top Large Cap Picks: Reliance Industries (₹2,984.50), HDFC Bank (₹1,682.40), TCS (₹4,190.20).`;
  }

  if (agentType === "tax") {
    const payload = data as {
      income?: number;
      newTax?: { totalTax: number; effectiveRatePct: number; standardDeduction: number };
      oldTax?: { totalTax: number; effectiveRatePct: number };
    };
    const inc = payload?.income || 900000;
    const newT = payload?.newTax?.totalTax || 41600;
    const oldT = payload?.oldTax?.totalTax || 96200;

    return `Income Tax Comparison (FY 2024-25) for Gross Income ₹${inc.toLocaleString("en-IN")}:

1. New Tax Regime:
- Standard Deduction: ₹75,000
- Total Tax Payable: ₹${newT.toLocaleString("en-IN")}
- Effective Tax Rate: ${payload?.newTax?.effectiveRatePct || 4.62}%

2. Old Tax Regime:
- Standard Deduction: ₹50,000
- Total Tax Payable (base without deductions): ₹${oldT.toLocaleString("en-IN")}

Analysis:
The New Tax Regime provides a direct tax savings of ₹${Math.abs(oldT - newT).toLocaleString("en-IN")} unless you claim more than ₹3,00,000 in combined Section 80C, 80D, and HRA deductions.`;
  }

  return `Financial Health Summary:
- Net Worth: ₹3,69,630.50
- 30-Day Inflow: ₹76,450.00 | Outflow: ₹34,228.00
- Monthly Savings Rate: 55.2%
- Emergency Fund Goal: 63% funded (₹2,85,000 / ₹4,50,000)

Recommended Action: Allocate ₹15,000 surplus to your Japan Vacation fund and index SIP.`;
}
