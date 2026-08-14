/**
 * Financial Calculators — Standard Indian Personal Finance Formulas
 */

export interface EMICalculation {
  principal: number;
  annualRatePct: number;
  tenureMonths: number;
  tenureYears: number;
  emi: number;
  totalPayment: number;
  totalInterest: number;
  currency: string;
}

export function calculateEMI(
  principal: number,
  annualRate: number,
  tenureMonths: number
): EMICalculation {
  if (annualRate <= 0) {
    const emi = principal / tenureMonths;
    return {
      principal,
      annualRatePct: annualRate,
      tenureMonths,
      tenureYears: Number((tenureMonths / 12).toFixed(1)),
      emi: Math.round(emi),
      totalPayment: Math.round(emi * tenureMonths),
      totalInterest: 0,
      currency: "INR",
    };
  }

  const r = annualRate / 12 / 100;
  const emi =
    (principal * r * Math.pow(1 + r, tenureMonths)) /
    (Math.pow(1 + r, tenureMonths) - 1);
  const totalPayment = emi * tenureMonths;
  const totalInterest = totalPayment - principal;

  return {
    principal: Math.round(principal),
    annualRatePct: annualRate,
    tenureMonths,
    tenureYears: Number((tenureMonths / 12).toFixed(1)),
    emi: Math.round(emi),
    totalPayment: Math.round(totalPayment),
    totalInterest: Math.round(totalInterest),
    currency: "INR",
  };
}

export interface SIPCalculation {
  monthlySip: number;
  annualRatePct: number;
  years: number;
  totalInvested: number;
  maturityValue: number;
  wealthGained: number;
  returnsPct: number;
  currency: string;
}

export function calculateSIPReturns(
  monthlyAmount: number,
  annualRate: number,
  years: number
): SIPCalculation {
  const r = annualRate / 12 / 100;
  const n = years * 12;
  let maturity = 0;

  if (r === 0) {
    maturity = monthlyAmount * n;
  } else {
    maturity = (monthlyAmount * (Math.pow(1 + r, n) - 1) * (1 + r)) / r;
  }

  const totalInvested = monthlyAmount * n;
  const wealthGained = maturity - totalInvested;

  return {
    monthlySip: Math.round(monthlyAmount),
    annualRatePct: annualRate,
    years,
    totalInvested: Math.round(totalInvested),
    maturityValue: Math.round(maturity),
    wealthGained: Math.round(wealthGained),
    returnsPct: totalInvested > 0 ? Number(((wealthGained / totalInvested) * 100).toFixed(1)) : 0,
    currency: "INR",
  };
}

export interface FDCalculation {
  principal: number;
  annualRatePct: number;
  tenureYears: number;
  compounding: string;
  maturityValue: number;
  interestEarned: number;
  tdsDeducted: number;
  netMaturity: number;
  currency: string;
}

export function calculateFDMaturity(
  principal: number,
  annualRate: number,
  years: number,
  compounding: "quarterly" | "monthly" | "annually" = "quarterly"
): FDCalculation {
  const freqMap: Record<string, number> = { monthly: 12, quarterly: 4, annually: 1 };
  const n = freqMap[compounding] || 4;
  const r = annualRate / 100;

  const maturity = principal * Math.pow(1 + r / n, n * years);
  const interest = maturity - principal;
  const tdsDeducted = interest > 40000 ? interest * 0.1 : 0;

  return {
    principal: Math.round(principal),
    annualRatePct: annualRate,
    tenureYears: years,
    compounding,
    maturityValue: Math.round(maturity),
    interestEarned: Math.round(interest),
    tdsDeducted: Math.round(tdsDeducted),
    netMaturity: Math.round(maturity - tdsDeducted),
    currency: "INR",
  };
}

export interface TaxCalculation {
  grossIncome: number;
  standardDeduction: number;
  taxableIncome: number;
  regime: "new" | "old";
  slabBreakdown: { slab: string; tax: number }[];
  taxBeforeRebate: number;
  section87aRebate: number;
  cess4Pct: number;
  totalTax: number;
  effectiveRatePct: number;
  monthlyTax: number;
  currency: string;
  note: string;
}

export function calculateIncomeTax(
  annualIncome: number,
  regime: "new" | "old" = "new"
): TaxCalculation {
  let slabs: [number, number][];
  let stdDed = 0;
  let rebateLimit = 0;

  if (regime === "new") {
    // New regime slabs FY 2024-25
    slabs = [
      [300000, 0],
      [300000, 0.05],
      [300000, 0.1],
      [300000, 0.15],
      [300000, 0.2],
      [Infinity, 0.3],
    ];
    stdDed = 75000;
    rebateLimit = 700000;
  } else {
    // Old regime slabs
    slabs = [
      [250000, 0],
      [250000, 0.05],
      [500000, 0.2],
      [Infinity, 0.3],
    ];
    stdDed = 50000;
    rebateLimit = 500000;
  }

  const taxable = Math.max(0, annualIncome - stdDed);
  let tax = 0;
  let remaining = taxable;
  const slabBreakdown: { slab: string; tax: number }[] = [];

  for (const [limit, rate] of slabs) {
    if (remaining <= 0) break;
    const taxableInSlab = Math.min(remaining, limit);
    const slabTax = taxableInSlab * rate;
    tax += slabTax;
    if (rate > 0 && taxableInSlab > 0) {
      slabBreakdown.push({
        slab: `₹${taxableInSlab.toLocaleString("en-IN")} @ ${(rate * 100).toFixed(0)}%`,
        tax: Math.round(slabTax),
      });
    }
    remaining -= taxableInSlab;
  }

  // Section 87A rebate
  let rebate = 0;
  if (taxable <= rebateLimit) {
    rebate = Math.min(tax, 25000);
    tax -= rebate;
  }

  const cess = tax * 0.04;
  const totalTax = tax + cess;

  return {
    grossIncome: annualIncome,
    standardDeduction: stdDed,
    taxableIncome: taxable,
    regime,
    slabBreakdown,
    taxBeforeRebate: Math.round(tax + rebate),
    section87aRebate: Math.round(rebate),
    cess4Pct: Math.round(cess),
    totalTax: Math.round(totalTax),
    effectiveRatePct:
      annualIncome > 0 ? Number(((totalTax / annualIncome) * 100).toFixed(2)) : 0,
    monthlyTax: Math.round(totalTax / 12),
    currency: "INR",
    note: `FY 2024-25 | Standard deduction ₹${stdDed.toLocaleString("en-IN")} applied`,
  };
}
