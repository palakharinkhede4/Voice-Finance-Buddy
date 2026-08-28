"use client";

import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

interface SpendingChartsProps {
  spendingByCategory?: Record<string, number>;
  dailyTrend?: { date: string; amount: number }[];
}

const CATEGORY_COLORS: Record<string, string> = {
  housing: "#6366F1",
  shopping: "#EC4899",
  travel: "#3B82F6",
  food: "#F59E0B",
  grocery: "#10B981",
  transport: "#06B6D4",
  utilities: "#8B5CF6",
  health: "#EF4444",
  entertainment: "#F97316",
  education: "#14B8A6",
  transfer: "#64748B",
};

export const SpendingCharts: React.FC<SpendingChartsProps> = ({
  spendingByCategory = {},
  dailyTrend = [],
}) => {
  const pieData = Object.entries(spendingByCategory)
    .filter(([, val]) => val > 0)
    .map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      key: name.toLowerCase(),
      value,
    }))
    .sort((a, b) => b.value - a.value);

  const totalSpent = pieData.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
      {/* Donut Chart */}
      <div className="theme-card rounded-2xl p-5 lg:col-span-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Spending by Category
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">Last 30 days distribution</p>
          </div>
          <span className="rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-zinc-900 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-zinc-300">
            Total: ₹{totalSpent.toLocaleString("en-IN")}
          </span>
        </div>

        <div className="relative mt-4 h-56 w-full">
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={88}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry) => (
                    <Cell
                      key={`cell-${entry.name}`}
                      fill={CATEGORY_COLORS[entry.key] || "#64748B"}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [
                    `₹${value.toLocaleString("en-IN")}`,
                    "Spent",
                  ]}
                  contentStyle={{
                    backgroundColor: "#11131A",
                    borderColor: "rgba(255, 255, 255, 0.1)",
                    borderRadius: "10px",
                    fontSize: "12px",
                    color: "#F8FAFC",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-slate-400">
              No expense data recorded
            </div>
          )}

          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-[10px] uppercase tracking-wider text-slate-400">
              Categories
            </span>
            <span className="text-base font-bold text-slate-900 dark:text-white">
              {pieData.length}
            </span>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          {pieData.slice(0, 6).map((item) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 overflow-hidden">
                <span
                  className="h-2 w-2 flex-shrink-0 rounded-full"
                  style={{
                    backgroundColor: CATEGORY_COLORS[item.key] || "#64748B",
                  }}
                />
                <span className="truncate text-slate-600 dark:text-zinc-300">{item.name}</span>
              </div>
              <span className="font-mono text-slate-500 dark:text-zinc-400">
                ₹{item.value.toLocaleString("en-IN")}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Spending Trend Area Chart */}
      <div className="theme-card rounded-2xl p-5 lg:col-span-7">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Daily Spending Trend
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">Day-by-day expense breakdown</p>
          </div>
        </div>

        <div className="mt-4 h-60 w-full">
          {dailyTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={dailyTrend}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(148, 163, 184, 0.15)"
                />
                <XAxis
                  dataKey="date"
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip
                  formatter={(value: number) => [
                    `₹${value.toLocaleString("en-IN")}`,
                    "Expenses",
                  ]}
                  contentStyle={{
                    backgroundColor: "#11131A",
                    borderColor: "rgba(255, 255, 255, 0.1)",
                    borderRadius: "10px",
                    fontSize: "12px",
                    color: "#F8FAFC",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#6366F1"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#spendGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-slate-400">
              No trend data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
