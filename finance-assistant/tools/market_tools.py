"""
Market data tools for the Investment Agent.

Primary: Real data from yfinance (NSE/BSE stocks, indices) + mfapi.in (MF NAV).
Fallback: Realistic mock data when network/yfinance unavailable.

Same tool signatures — Investment Agent's TOOLS/TOOL_MAP unchanged.
"""
import random
from datetime import datetime
from logs.logger import get_logger

_log = get_logger("market_tools")


def _try_real_api():
    try:
        from finance_apis.market_data import get_market_api
        return get_market_api()
    except Exception:
        return None


# ── Mock fallback data ────────────────────────────────────────────────────────

_MUTUAL_FUNDS = {
    "mirae asset large cap":      {"nav": 98.45,   "1y": 18.2, "3y": 14.6, "5y": 16.8, "cat": "Large Cap"},
    "axis bluechip":              {"nav": 52.30,   "1y": 15.4, "3y": 12.1, "5y": 14.3, "cat": "Large Cap"},
    "hdfc mid-cap opportunities": {"nav": 148.70,  "1y": 32.1, "3y": 21.4, "5y": 24.6, "cat": "Mid Cap"},
    "sbi small cap":              {"nav": 184.20,  "1y": 38.5, "3y": 25.8, "5y": 28.3, "cat": "Small Cap"},
    "parag parikh flexi cap":     {"nav": 76.90,   "1y": 22.3, "3y": 17.5, "5y": 19.8, "cat": "Flexi Cap"},
    "ppfas tax saver elss":       {"nav": 28.45,   "1y": 20.1, "3y": 16.4, "5y": 18.2, "cat": "ELSS"},
    "hdfc nifty 50 index":        {"nav": 184.60,  "1y": 26.2, "3y": 15.8, "5y": 17.1, "cat": "Index"},
    "icici prudential liquid":    {"nav": 348.90,  "1y":  7.4, "3y":  6.8, "5y":  6.5, "cat": "Liquid"},
}
_STOCKS = {
    "reliance":    {"price": 2850.40, "chg": 1.2,  "pe": 28.4},
    "tcs":         {"price": 4120.65, "chg": -0.4, "pe": 32.1},
    "infosys":     {"price": 1892.30, "chg": 0.8,  "pe": 27.6},
    "hdfc bank":   {"price": 1654.80, "chg": 0.3,  "pe": 19.2},
    "icici bank":  {"price": 1248.90, "chg": 1.6,  "pe": 18.4},
    "wipro":       {"price": 561.20,  "chg": -0.9, "pe": 24.8},
    "bajaj finance": {"price": 7890.50,"chg": 2.1,  "pe": 35.6},
    "itc":         {"price": 488.30,  "chg": 0.5,  "pe": 26.3},
    "asian paints": {"price": 2640.70,"chg": -1.2, "pe": 48.2},
    "maruti":      {"price": 12450.00,"chg": 0.9,  "pe": 29.1},
}

# ── Tool functions (real → fallback) ─────────────────────────────────────────

def get_market_overview() -> dict:
    """Get current Sensex and Nifty 50 levels with day change."""
    api = _try_real_api()
    if api:
        nifty  = api.get_index("nifty")
        sensex = api.get_index("sensex")
        if "error" not in nifty and "error" not in sensex:
            return {
                "date":     datetime.now().strftime("%Y-%m-%d %H:%M"),
                "nifty_50": {"value": nifty["price"], "change": nifty["change"],
                             "change_pct": nifty["pct_change"],
                             "52w_high": nifty.get("52w_high"), "52w_low": nifty.get("52w_low")},
                "sensex":   {"value": sensex["price"], "change": sensex["change"],
                             "change_pct": sensex["pct_change"]},
                "source": "Yahoo Finance / NSE (live data)",
            }
    # Mock fallback
    s_val = round(82500 * (1 + random.uniform(-0.01, 0.01)), 2)
    n_val = round(25100 * (1 + random.uniform(-0.01, 0.01)), 2)
    s_chg = round(random.uniform(-350, 350), 2)
    n_chg = round(random.uniform(-100, 100), 2)
    return {
        "date": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "sensex":   {"value": s_val, "change": s_chg, "change_pct": round(s_chg/s_val*100, 2)},
        "nifty_50": {"value": n_val, "change": n_chg, "change_pct": round(n_chg/n_val*100, 2)},
        "source": "Mock data (yfinance not installed or network unavailable)",
    }


def get_stock_price(symbol: str) -> dict:
    """Get current stock price for an Indian stock."""
    api = _try_real_api()
    if api:
        result = api.get_stock(symbol)
        if "error" not in result:
            _log.info(f"Real stock: {symbol} = ₹{result['price']}")
            return result
    # Mock fallback
    key = symbol.lower().strip()
    for sname, data in _STOCKS.items():
        if key in sname or sname in key:
            price = round(data["price"] * (1 + random.uniform(-0.005, 0.005)), 2)
            prev  = price / (1 + data["chg"] / 100)
            return {
                "stock": sname.title(), "price": price,
                "prev_close": round(prev, 2),
                "change": round(price - prev, 2), "change_pct": data["chg"],
                "pe_ratio": data["pe"], "exchange": "NSE/BSE",
                "as_of": datetime.now().strftime("%Y-%m-%d %H:%M"),
                "source": "Mock data",
            }
    return {"error": f"Stock '{symbol}' not found.", "tip": "Try: reliance, tcs, infosys, hdfc bank"}


def get_mutual_fund_info(fund_name: str) -> dict:
    """Get NAV and return data for a mutual fund."""
    api = _try_real_api()
    if api:
        search = api.search_mf(fund_name)
        if "error" not in search and search.get("results"):
            top      = search["results"][0]
            nav_data = api.get_mf_nav(top["code"])
            if "error" not in nav_data:
                _log.info(f"Real MF NAV: {fund_name} = {nav_data['nav']}")
                return nav_data
    # Mock fallback
    key = fund_name.lower().strip()
    for fname, data in _MUTUAL_FUNDS.items():
        if key in fname or fname in key or any(w in fname for w in key.split()):
            return {
                "fund": fname.title(),
                "nav": round(data["nav"] * (1 + random.uniform(-0.002, 0.002)), 4),
                "returns": {"1_year": data["1y"], "3_year": data["3y"], "5_year": data["5y"]},
                "category": data["cat"],
                "as_of": datetime.now().strftime("%Y-%m-%d"),
                "source": "Mock data",
            }
    return {"error": f"Fund '{fund_name}' not found.", "available_funds": list(_MUTUAL_FUNDS.keys())}


def get_top_mutual_funds(category: str = "all") -> dict:
    """Get top performing mutual funds, optionally filtered by category."""
    funds = [
        {"fund": n.title(), "category": d["cat"], "nav": d["nav"],
         "1y_return": d["1y"], "3y_return": d["3y"], "5y_return": d["5y"]}
        for n, d in _MUTUAL_FUNDS.items()
        if category.lower() == "all" or category.lower() in d["cat"].lower()
    ]
    return {
        "category_filter": category,
        "funds": sorted(funds, key=lambda x: x["1y_return"], reverse=True),
        "count": len(funds),
        "note": "Returns in %. Past performance is not indicative of future results.",
    }


def get_live_index(index_name: str = "nifty") -> dict:
    """Get live price for a specific index: nifty, sensex, or banknifty."""
    api = _try_real_api()
    if api:
        result = api.get_index(index_name)
        if "error" not in result:
            return result
    overview = get_market_overview()
    mapping  = {"nifty": "nifty_50", "sensex": "sensex", "banknifty": "nifty_50"}
    key      = mapping.get(index_name.lower(), "nifty_50")
    return {**overview.get(key, {}), "name": index_name.upper(), "source": overview.get("source", "")}


def get_currency_rate(pair: str = "USDINR") -> dict:
    """Get currency exchange rate."""
    api = _try_real_api()
    if api:
        result = api.get_currency(pair)
        if "error" not in result:
            return result
    _RATES = {"USDINR": 83.50, "EURINR": 90.20, "GBPINR": 105.40, "JPYINR": 0.56}
    rate = _RATES.get(pair.upper(), 83.50)
    return {"pair": pair.upper(), "rate": rate, "source": "Mock data"}


# ── OpenAI tool definitions ───────────────────────────────────────────────────

MARKET_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_market_overview",
            "description": "Get live Sensex and Nifty 50 index levels with change. Use for: 'market', 'Sensex', 'Nifty', 'stock market kya chal raha hai'.",
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_live_index",
            "description": "Get live price for a specific index: Nifty 50, Sensex, or Bank Nifty.",
            "parameters": {
                "type": "object",
                "properties": {
                    "index_name": {"type": "string", "description": "nifty | sensex | banknifty"},
                },
                "required": ["index_name"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_mutual_fund_info",
            "description": "Get current NAV and historical returns for a mutual fund. Use for fund name queries.",
            "parameters": {
                "type": "object",
                "properties": {
                    "fund_name": {"type": "string", "description": "Mutual fund name e.g. 'SBI Small Cap', 'Axis Bluechip'"},
                },
                "required": ["fund_name"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_stock_price",
            "description": "Get live NSE/BSE stock price. Use for: 'Reliance price', 'TCS stock', 'Infosys ka price'.",
            "parameters": {
                "type": "object",
                "properties": {
                    "symbol": {"type": "string", "description": "Stock name e.g. 'Reliance', 'TCS', 'HDFC Bank'"},
                },
                "required": ["symbol"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_top_mutual_funds",
            "description": "Get list of top-performing mutual funds filtered by category.",
            "parameters": {
                "type": "object",
                "properties": {
                    "category": {"type": "string", "description": "all | Large Cap | Mid Cap | Small Cap | ELSS | Index | Liquid"},
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_currency_rate",
            "description": "Get live currency exchange rate vs INR. Use for: 'dollar rate', 'USD to INR', 'euro rate'.",
            "parameters": {
                "type": "object",
                "properties": {
                    "pair": {"type": "string", "description": "USDINR | EURINR | GBPINR | JPYINR"},
                },
                "required": [],
            },
        },
    },
]

MARKET_TOOL_MAP = {
    "get_market_overview":  get_market_overview,
    "get_live_index":       get_live_index,
    "get_mutual_fund_info": get_mutual_fund_info,
    "get_stock_price":      get_stock_price,
    "get_top_mutual_funds": get_top_mutual_funds,
    "get_currency_rate":    get_currency_rate,
}
