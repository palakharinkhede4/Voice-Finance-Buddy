"use client";

import React, { useState } from "react";
import {
  calculateEMI,
  calculateSIPReturns,
  calculateFDMaturity,
  calculateIncomeTax,
} from "@/lib/tools/calculators";
import { Calculator, TrendingUp, Building, Receipt } from "lucide-react";

export const CalculatorsView: React.FC = () => {
  const [activeCalc, setActiveCalc] = useState<"sip" | "emi" | "fd" | "tax">("sip");

  // SIP State
  const [sipAmount, setSipAmount] = useState(10000);
  const [sipRate, setSipRate] = useState(12);
  const [sipYears, setSipYears] = useState(10);

  // EMI State
  const [emiPrincipal, setEmiPrincipal] = useState(3000000);
  const [emiRate, setEmiRate] = useState(8.5);
  const [emiYears, setEmiYears] = useState(20);

  // FD State
  const [fdPrincipal, setFdPrincipal] = useState(200000);
  const [fdRate, setFdRate] = useState(7.2);
  const [fdYears, setFdYears] = useState(3);

  // Tax State
  const [taxIncome, setTaxIncome] = useState(1200000);
  const [taxRegime, setTaxRegime] = useState<"new" | "old">("new");

  const sipResult = calculateSIPReturns(sipAmount, sipRate, sipYears);
  const emiResult = calculateEMI(emiPrincipal, emiRate, emiYears * 12);
  const fdResult = calculateFDMaturity(fdPrincipal, fdRate, fdYears);
  const taxResult = calculateIncomeTax(taxIncome, taxRegime);

  return (
    <div className="space-y-5">
      {/* Calculator Mode Selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: "sip", label: "SIP Growth Calculator", icon: TrendingUp },
          { id: "emi", label: "Loan EMI Calculator", icon: Building },
          { id: "fd", label: "Fixed Deposit (FD)", icon: Calculator },
          { id: "tax", label: "Income Tax FY 24-25", icon: Receipt },
        ].map((c) => {
          const Icon = c.icon;
          const isActive = activeCalc === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setActiveCalc(c.id as "sip" | "emi" | "fd" | "tax")}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                isActive
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "theme-card text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{c.label}</span>
            </button>
          );
        })}
      </div>

      {/* SIP Calculator */}
      {activeCalc === "sip" && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="theme-card rounded-2xl p-5 lg:col-span-6">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">SIP Investment Parameters</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">Systematic Wealth Accumulation</p>

            <div className="mt-5 space-y-4">
              <div>
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-700 dark:text-zinc-300">Monthly SIP Amount</span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400">₹{sipAmount.toLocaleString("en-IN")}</span>
                </div>
                <input
                  type="range"
                  min={500}
                  max={100000}
                  step={500}
                  value={sipAmount}
                  onChange={(e) => setSipAmount(Number(e.target.value))}
                  className="mt-2 w-full accent-indigo-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-700 dark:text-zinc-300">Expected Annual Return (%)</span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400">{sipRate}%</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={25}
                  step={0.5}
                  value={sipRate}
                  onChange={(e) => setSipRate(Number(e.target.value))}
                  className="mt-2 w-full accent-indigo-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-700 dark:text-zinc-300">Time Horizon (Years)</span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400">{sipYears} Years</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={30}
                  step={1}
                  value={sipYears}
                  onChange={(e) => setSipYears(Number(e.target.value))}
                  className="mt-2 w-full accent-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="theme-card flex flex-col justify-between rounded-2xl p-5 lg:col-span-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Projected SIP Value</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">Compound growth breakdown</p>

              <div className="mt-5 space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] pb-2.5 text-xs">
                  <span className="text-slate-500 dark:text-zinc-400">Total Invested</span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-white">
                    ₹{sipResult.totalInvested.toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] pb-2.5 text-xs">
                  <span className="text-slate-500 dark:text-zinc-400">Est. Wealth Gained</span>
                  <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                    +₹{sipResult.wealthGained.toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="font-semibold text-slate-700 dark:text-zinc-300">Total Maturity Value</span>
                  <span className="font-mono text-xl font-bold text-indigo-600 dark:text-indigo-400">
                    ₹{sipResult.maturityValue.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3 text-xs text-indigo-700 dark:text-indigo-300">
              Wealth Gain Ratio: <strong>{sipResult.returnsPct}%</strong> on principal across {sipYears} years.
            </div>
          </div>
        </div>
      )}

      {/* Loan EMI Calculator */}
      {activeCalc === "emi" && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="theme-card rounded-2xl p-5 lg:col-span-6">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Loan Parameters</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">Home, Auto, or Personal Loan EMI</p>

            <div className="mt-5 space-y-4">
              <div>
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-700 dark:text-zinc-300">Loan Amount</span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400">₹{emiPrincipal.toLocaleString("en-IN")}</span>
                </div>
                <input
                  type="range"
                  min={100000}
                  max={20000000}
                  step={100000}
                  value={emiPrincipal}
                  onChange={(e) => setEmiPrincipal(Number(e.target.value))}
                  className="mt-2 w-full accent-indigo-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-700 dark:text-zinc-300">Interest Rate (%)</span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400">{emiRate}% p.a.</span>
                </div>
                <input
                  type="range"
                  min={6}
                  max={18}
                  step={0.1}
                  value={emiRate}
                  onChange={(e) => setEmiRate(Number(e.target.value))}
                  className="mt-2 w-full accent-indigo-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-700 dark:text-zinc-300">Tenure (Years)</span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400">{emiYears} Years ({emiYears * 12} mos)</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={30}
                  step={1}
                  value={emiYears}
                  onChange={(e) => setEmiYears(Number(e.target.value))}
                  className="mt-2 w-full accent-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="theme-card flex flex-col justify-between rounded-2xl p-5 lg:col-span-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Monthly Repayment</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">Instalment and interest breakdown</p>

              <div className="mt-5 space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] pb-2.5 text-xs">
                  <span className="text-slate-500 dark:text-zinc-400">Monthly EMI</span>
                  <span className="font-mono text-xl font-bold text-indigo-600 dark:text-indigo-400">
                    ₹{emiResult.emi.toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] pb-2.5 text-xs">
                  <span className="text-slate-500 dark:text-zinc-400">Principal Amount</span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-white">
                    ₹{emiResult.principal.toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] pb-2.5 text-xs">
                  <span className="text-slate-500 dark:text-zinc-400">Total Interest Payable</span>
                  <span className="font-mono font-semibold text-rose-600 dark:text-rose-400">
                    ₹{emiResult.totalInterest.toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="font-semibold text-slate-700 dark:text-zinc-300">Total Payment</span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-white">
                    ₹{emiResult.totalPayment.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-zinc-900/60 p-3 text-xs text-slate-600 dark:text-zinc-300">
              Interest constitutes <strong>{Math.round((emiResult.totalInterest / emiResult.totalPayment) * 100)}%</strong> of total loan repayment.
            </div>
          </div>
        </div>
      )}

      {/* FD Calculator */}
      {activeCalc === "fd" && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="theme-card rounded-2xl p-5 lg:col-span-6">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Fixed Deposit Setup</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">Guaranteed Return with Quarterly Compounding</p>

            <div className="mt-5 space-y-4">
              <div>
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-700 dark:text-zinc-300">Deposit Amount</span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400">₹{fdPrincipal.toLocaleString("en-IN")}</span>
                </div>
                <input
                  type="range"
                  min={10000}
                  max={5000000}
                  step={10000}
                  value={fdPrincipal}
                  onChange={(e) => setFdPrincipal(Number(e.target.value))}
                  className="mt-2 w-full accent-indigo-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-700 dark:text-zinc-300">Interest Rate (%)</span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400">{fdRate}% p.a.</span>
                </div>
                <input
                  type="range"
                  min={4}
                  max={10}
                  step={0.1}
                  value={fdRate}
                  onChange={(e) => setFdRate(Number(e.target.value))}
                  className="mt-2 w-full accent-indigo-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-700 dark:text-zinc-300">Tenure (Years)</span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400">{fdYears} Years</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={0.5}
                  value={fdYears}
                  onChange={(e) => setFdYears(Number(e.target.value))}
                  className="mt-2 w-full accent-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="theme-card flex flex-col justify-between rounded-2xl p-5 lg:col-span-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Maturity Breakdown</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">Gross interest & net post-TDS amount</p>

              <div className="mt-5 space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] pb-2.5 text-xs">
                  <span className="text-slate-500 dark:text-zinc-400">Principal</span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-white">
                    ₹{fdResult.principal.toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] pb-2.5 text-xs">
                  <span className="text-slate-500 dark:text-zinc-400">Interest Earned</span>
                  <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                    +₹{fdResult.interestEarned.toLocaleString("en-IN")}
                  </span>
                </div>

                {fdResult.tdsDeducted > 0 && (
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] pb-2.5 text-xs">
                    <span className="text-slate-500 dark:text-zinc-400">TDS Deducted (10%)</span>
                    <span className="font-mono font-semibold text-rose-600 dark:text-rose-400">
                      -₹{fdResult.tdsDeducted.toLocaleString("en-IN")}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="font-semibold text-slate-700 dark:text-zinc-300">Net Maturity Value</span>
                  <span className="font-mono text-xl font-bold text-indigo-600 dark:text-indigo-400">
                    ₹{fdResult.netMaturity.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-zinc-900/60 p-3 text-xs text-slate-600 dark:text-zinc-300">
              Interest compounded quarterly. TDS applicable if annual interest exceeds ₹40,000.
            </div>
          </div>
        </div>
      )}

      {/* Income Tax Calculator */}
      {activeCalc === "tax" && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="theme-card rounded-2xl p-5 lg:col-span-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Gross Annual Salary</h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">Indian Income Tax FY 2024-25</p>
              </div>
              <div className="flex items-center rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-100 dark:bg-zinc-900 p-1 text-xs">
                <button
                  onClick={() => setTaxRegime("new")}
                  className={`rounded-md px-2.5 py-1 font-medium transition ${
                    taxRegime === "new" ? "bg-indigo-600 text-white" : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  New Regime
                </button>
                <button
                  onClick={() => setTaxRegime("old")}
                  className={`rounded-md px-2.5 py-1 font-medium transition ${
                    taxRegime === "old" ? "bg-indigo-600 text-white" : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Old Regime
                </button>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-700 dark:text-zinc-300">Gross Income (CTC)</span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400">₹{taxIncome.toLocaleString("en-IN")}</span>
                </div>
                <input
                  type="range"
                  min={300000}
                  max={5000000}
                  step={50000}
                  value={taxIncome}
                  onChange={(e) => setTaxIncome(Number(e.target.value))}
                  className="mt-2 w-full accent-indigo-500"
                />
              </div>

              <div className="mt-3.5 rounded-xl border border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-zinc-900/60 p-3.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                  Tax Slab Computation
                </span>
                <div className="mt-2 space-y-1 text-xs">
                  {taxResult.slabBreakdown.map((s, idx) => (
                    <div key={idx} className="flex justify-between font-mono text-slate-700 dark:text-zinc-300">
                      <span>{s.slab}</span>
                      <span>₹{s.tax.toLocaleString("en-IN")}</span>
                    </div>
                  ))}
                  {taxResult.slabBreakdown.length === 0 && (
                    <div className="text-emerald-600 dark:text-emerald-400 font-medium">
                      Zero base tax (within standard deduction threshold)
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="theme-card flex flex-col justify-between rounded-2xl p-5 lg:col-span-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Tax Liability Summary</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">{taxResult.note}</p>

              <div className="mt-5 space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] pb-2.5 text-xs">
                  <span className="text-slate-500 dark:text-zinc-400">Standard Deduction</span>
                  <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                    -₹{taxResult.standardDeduction.toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] pb-2.5 text-xs">
                  <span className="text-slate-500 dark:text-zinc-400">Taxable Income</span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-white">
                    ₹{taxResult.taxableIncome.toLocaleString("en-IN")}
                  </span>
                </div>

                {taxResult.section87aRebate > 0 && (
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] pb-2.5 text-xs">
                    <span className="text-slate-500 dark:text-zinc-400">Section 87A Rebate</span>
                    <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                      -₹{taxResult.section87aRebate.toLocaleString("en-IN")}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] pb-2.5 text-xs">
                  <span className="text-slate-500 dark:text-zinc-400">Health & Education Cess (4%)</span>
                  <span className="font-mono font-semibold text-slate-700 dark:text-zinc-300">
                    +₹{taxResult.cess4Pct.toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 text-xs">
                  <div>
                    <div className="font-semibold text-slate-700 dark:text-zinc-300">Total Tax Payable</div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      Monthly: ₹{taxResult.monthlyTax.toLocaleString("en-IN")}
                    </div>
                  </div>
                  <span className="font-mono text-xl font-bold text-indigo-600 dark:text-indigo-400">
                    ₹{taxResult.totalTax.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3 text-xs text-indigo-700 dark:text-indigo-300">
              Effective Tax Rate: <strong>{taxResult.effectiveRatePct}%</strong> of gross salary.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
