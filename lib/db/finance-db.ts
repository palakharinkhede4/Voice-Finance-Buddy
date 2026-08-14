/**
 * Finance Repository & Data Layer
 * Single source of truth for accounts, categorized transactions, budget limits, and goals.
 */

export interface Account {
  key: string;
  label: string;
  balance: number;
  currency: string;
  accountType: "savings" | "current" | "fd";
}

export interface Transaction {
  id: number;
  date: string;
  description: string;
  category: string;
  amount: number; // positive = credit (income), negative = debit (expense)
  account: string;
  type: "credit" | "debit";
}

export interface BudgetLimit {
  category: string;
  monthlyLimit: number;
  spent: number;
  percentage: number;
  isOver: boolean;
}

export interface Goal {
  id: number;
  category: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
}

export interface FinancialKPIs {
  netWorth: number;
  totalIncome30Days: number;
  totalExpense30Days: number;
  savingsRatePct: number;
  budgetUtilizationPct: number;
  topExpenseCategory: {
    category: string;
    amount: number;
  };
}

// Initial state
const INITIAL_ACCOUNTS: Account[] = [
  { key: "savings", label: "HDFC Savings", balance: 85420.5, currency: "INR", accountType: "savings" },
  { key: "checking", label: "ICICI Salary", balance: 34210.0, currency: "INR", accountType: "current" },
  { key: "fd", label: "SBI Fixed Deposit", balance: 250000.0, currency: "INR", accountType: "fd" },
];

const INITIAL_BUDGETS: Record<string, number> = {
  food: 7000,
  grocery: 6000,
  transport: 3500,
  entertainment: 3000,
  shopping: 8000,
  utilities: 5000,
  health: 4000,
  housing: 20000,
  education: 2000,
  travel: 10000,
};

const INITIAL_GOALS: Goal[] = [
  {
    id: 1,
    category: "Emergency Fund",
    description: "6 Months Reserve in Liquid Funds",
    targetAmount: 450000,
    currentAmount: 285000,
    deadline: "2025-12-31",
  },
  {
    id: 2,
    category: "Japan Vacation",
    description: "Autumn Holiday Savings",
    targetAmount: 200000,
    currentAmount: 110000,
    deadline: "2025-10-15",
  },
];

// Helper to generate dates
const getDateDaysAgo = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split("T")[0];
};

const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: 1, date: getDateDaysAgo(0), description: "Swiggy Gourmet", category: "food", amount: -480, account: "checking", type: "debit" },
  { id: 2, date: getDateDaysAgo(0), description: "UPI to Rahul", category: "transfer", amount: -1500, account: "savings", type: "debit" },
  { id: 3, date: getDateDaysAgo(1), description: "Amazon Electronics", category: "shopping", amount: -2499, account: "checking", type: "debit" },
  { id: 4, date: getDateDaysAgo(1), description: "Monthly Salary Credit", category: "income", amount: 75000, account: "savings", type: "credit" },
  { id: 5, date: getDateDaysAgo(2), description: "Zomato Delivery", category: "food", amount: -360, account: "checking", type: "debit" },
  { id: 6, date: getDateDaysAgo(2), description: "Metro Smart Card Recharge", category: "transport", amount: -500, account: "checking", type: "debit" },
  { id: 7, date: getDateDaysAgo(3), description: "Electricity Bill (BSES)", category: "utilities", amount: -2150, account: "savings", type: "debit" },
  { id: 8, date: getDateDaysAgo(3), description: "Blue Tokai Coffee", category: "food", amount: -290, account: "checking", type: "debit" },
  { id: 9, date: getDateDaysAgo(4), description: "Uber Ride", category: "transport", amount: -240, account: "checking", type: "debit" },
  { id: 10, date: getDateDaysAgo(4), description: "Zara Apparel", category: "shopping", amount: -3890, account: "savings", type: "debit" },
  { id: 11, date: getDateDaysAgo(5), description: "PVR Cinemas IMAX", category: "entertainment", amount: -920, account: "checking", type: "debit" },
  { id: 12, date: getDateDaysAgo(5), description: "BigBasket Organic", category: "grocery", amount: -1850, account: "checking", type: "debit" },
  { id: 13, date: getDateDaysAgo(6), description: "Fuel - Shell Petrol", category: "transport", amount: -1400, account: "savings", type: "debit" },
  { id: 14, date: getDateDaysAgo(7), description: "Netflix Premium", category: "entertainment", amount: -649, account: "savings", type: "debit" },
  { id: 15, date: getDateDaysAgo(8), description: "Cult.fit Gym Quarterly", category: "health", amount: -2500, account: "savings", type: "debit" },
  { id: 16, date: getDateDaysAgo(9), description: "Airtel Fiber Broadband", category: "utilities", amount: -1199, account: "checking", type: "debit" },
  { id: 17, date: getDateDaysAgo(10), description: "Nature's Basket", category: "grocery", amount: -2100, account: "checking", type: "debit" },
  { id: 18, date: getDateDaysAgo(14), description: "Apartment Rent", category: "housing", amount: -18500, account: "savings", type: "debit" },
  { id: 19, date: getDateDaysAgo(15), description: "Mutual Fund Dividend", category: "income", amount: 1450, account: "savings", type: "credit" },
  { id: 20, date: getDateDaysAgo(18), description: "Coursera AI Specialization", category: "education", amount: -1299, account: "checking", type: "debit" },
  { id: 21, date: getDateDaysAgo(22), description: "IndiGo Flight to Mumbai", category: "travel", amount: -4800, account: "savings", type: "debit" },
];

class FinanceDB {
  private accounts: Account[] = [...INITIAL_ACCOUNTS];
  private transactions: Transaction[] = [...INITIAL_TRANSACTIONS];
  private budgets: Record<string, number> = { ...INITIAL_BUDGETS };
  private goals: Goal[] = [...INITIAL_GOALS];
  private nextTxnId = 30;

  public getAccounts(): Account[] {
    return this.accounts;
  }

  public getTotalBalance(): number {
    return this.accounts.reduce((sum, a) => sum + a.balance, 0);
  }

  public getTransactions(limit = 50, category?: string, account?: string): Transaction[] {
    let list = [...this.transactions];
    if (category) {
      list = list.filter((t) => t.category.toLowerCase() === category.toLowerCase());
    }
    if (account) {
      list = list.filter((t) => t.account.toLowerCase() === account.toLowerCase());
    }
    return list.slice(0, limit);
  }

  public addTransaction(params: {
    description: string;
    category: string;
    amount: number;
    account?: string;
    date?: string;
  }): Transaction {
    const isCredit = params.amount > 0;
    const acctKey = params.account || "savings";
    const txn: Transaction = {
      id: this.nextTxnId++,
      date: params.date || new Date().toISOString().split("T")[0],
      description: params.description,
      category: params.category.toLowerCase(),
      amount: params.amount,
      account: acctKey,
      type: isCredit ? "credit" : "debit",
    };

    this.transactions.unshift(txn);

    // Update account balance
    const targetAcct = this.accounts.find((a) => a.key === acctKey);
    if (targetAcct) {
      targetAcct.balance += params.amount;
    }

    return txn;
  }

  public getSpendingByCategory(days = 30): Record<string, number> {
    const cutoff = getDateDaysAgo(days);
    const categoryTotals: Record<string, number> = {};

    this.transactions
      .filter((t) => t.type === "debit" && t.date >= cutoff)
      .forEach((t) => {
        const cat = t.category.toLowerCase();
        categoryTotals[cat] = (categoryTotals[cat] || 0) + Math.abs(t.amount);
      });

    return categoryTotals;
  }

  public getDailySpendingTrend(days = 14): { date: string; amount: number }[] {
    const result: { date: string; amount: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const dateStr = getDateDaysAgo(i);
      const dayTotal = this.transactions
        .filter((t) => t.type === "debit" && t.date === dateStr)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      result.push({
        date: new Date(dateStr).toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
        amount: dayTotal,
      });
    }
    return result;
  }

  public getBudgetStatuses(): BudgetLimit[] {
    const spending = this.getSpendingByCategory(30);
    return Object.entries(this.budgets).map(([category, monthlyLimit]) => {
      const spent = spending[category] || 0;
      const percentage = Math.round((spent / monthlyLimit) * 100);
      return {
        category,
        monthlyLimit,
        spent,
        percentage,
        isOver: spent > monthlyLimit,
      };
    });
  }

  public getGoals(): Goal[] {
    return this.goals;
  }

  public getKPIs(): FinancialKPIs {
    const netWorth = this.getTotalBalance();
    const spendingByCategory = this.getSpendingByCategory(30);
    const totalExpense30Days = Object.values(spendingByCategory).reduce((sum, val) => sum + val, 0);

    const cutoff = getDateDaysAgo(30);
    const totalIncome30Days = this.transactions
      .filter((t) => t.type === "credit" && t.date >= cutoff)
      .reduce((sum, t) => sum + t.amount, 0);

    const savingsRatePct =
      totalIncome30Days > 0
        ? Math.max(0, Math.round(((totalIncome30Days - totalExpense30Days) / totalIncome30Days) * 100))
        : 0;

    const totalBudgetLimit = Object.values(this.budgets).reduce((sum, val) => sum + val, 0);
    const budgetUtilizationPct = Math.round((totalExpense30Days / totalBudgetLimit) * 100);

    let topCategory = { category: "housing", amount: 0 };
    for (const [cat, amt] of Object.entries(spendingByCategory)) {
      if (amt > topCategory.amount) {
        topCategory = { category: cat, amount: amt };
      }
    }

    return {
      netWorth,
      totalIncome30Days,
      totalExpense30Days,
      savingsRatePct,
      budgetUtilizationPct,
      topExpenseCategory: topCategory,
    };
  }
}

// Global singleton instance for in-memory serverless cache
declare global {
  // eslint-disable-next-line no-var
  var __finance_db: FinanceDB | undefined;
}

export function getFinanceDB(): FinanceDB {
  if (!globalThis.__finance_db) {
    globalThis.__finance_db = new FinanceDB();
  }
  return globalThis.__finance_db;
}
