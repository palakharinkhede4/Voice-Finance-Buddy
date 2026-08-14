/**
 * Indian Market & Stock Quotes (Nifty 50, Sensex, Top Stocks, USD/INR, Gold)
 */

export interface MarketIndex {
  symbol: string;
  name: string;
  value: number;
  change: number;
  changePct: number;
}

export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  peRatio: number;
  sector: string;
}

export const TOP_STOCKS: Record<string, StockQuote> = {
  reliance: {
    symbol: "RELIANCE",
    name: "Reliance Industries",
    price: 2984.5,
    change: 22.4,
    changePct: 0.76,
    peRatio: 28.4,
    sector: "Energy & Conglomerate",
  },
  tcs: {
    symbol: "TCS",
    name: "Tata Consultancy Services",
    price: 4190.2,
    change: -14.6,
    changePct: -0.35,
    peRatio: 32.1,
    sector: "IT Services",
  },
  hdfcbank: {
    symbol: "HDFCBANK",
    name: "HDFC Bank",
    price: 1682.4,
    change: 8.5,
    changePct: 0.51,
    peRatio: 19.4,
    sector: "Banking",
  },
  infy: {
    symbol: "INFY",
    name: "Infosys",
    price: 1876.8,
    change: 12.3,
    changePct: 0.66,
    peRatio: 27.6,
    sector: "IT Services",
  },
  icicibank: {
    symbol: "ICICIBANK",
    name: "ICICI Bank",
    price: 1264.3,
    change: 15.2,
    changePct: 1.22,
    peRatio: 18.2,
    sector: "Banking",
  },
};

export function getMarketOverview(): {
  indices: MarketIndex[];
  stocks: StockQuote[];
  lastUpdated: string;
} {
  const indices: MarketIndex[] = [
    {
      symbol: "NIFTY",
      name: "Nifty 50",
      value: 25142.8,
      change: 89.4,
      changePct: 0.36,
    },
    {
      symbol: "SENSEX",
      name: "BSE Sensex",
      value: 82450.6,
      change: 284.1,
      changePct: 0.35,
    },
    {
      symbol: "USDINR",
      name: "USD / INR",
      value: 86.85,
      change: -0.04,
      changePct: -0.05,
    },
    {
      symbol: "GOLD",
      name: "Gold (10g 24K)",
      value: 78920.0,
      change: 340.0,
      changePct: 0.43,
    },
  ];

  return {
    indices,
    stocks: Object.values(TOP_STOCKS),
    lastUpdated: new Date().toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

export function searchStock(query: string): StockQuote | null {
  const q = query.toLowerCase().replace(/[^a-z0-9]/g, "");
  for (const [key, stock] of Object.entries(TOP_STOCKS)) {
    if (
      key.includes(q) ||
      stock.symbol.toLowerCase().includes(q) ||
      stock.name.toLowerCase().includes(q)
    ) {
      return stock;
    }
  }
  return null;
}
