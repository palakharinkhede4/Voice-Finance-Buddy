"""
Real Finance APIs — Stage 6 tool data layer.

Sources:
  • yfinance   — NSE/BSE stocks, indices (^NSEI, ^BSESN), currency, ETFs
  • mfapi.in   — Mutual fund NAV (free, no auth required)
  • RBI / FBIL — Government bond yields (via static cache + yfinance)

All functions are cache-friendly (TTL-stamped in-memory cache) and
return structured dicts so they can be serialised as tool results.
"""
from __future__ import annotations

import time
import threading
from typing import Any, Optional
from datetime import datetime

from logs.logger import get_logger

_log = get_logger("market_data")

# ── Simple TTL cache ──────────────────────────────────────────────────────────

_CACHE: dict[str, tuple[float, Any]] = {}
_CACHE_LOCK = threading.Lock()
_TTL_SECONDS = 300   # 5-minute cache (market data)
_MF_TTL      = 3600  # 1-hour for MF NAV (updated once daily)


def _cached(key: str, ttl: float = _TTL_SECONDS) -> Optional[Any]:
    with _CACHE_LOCK:
        if key in _CACHE:
            ts, val = _CACHE[key]
            if time.time() - ts < ttl:
                return val
    return None


def _store(key: str, val: Any) -> None:
    with _CACHE_LOCK:
        _CACHE[key] = (time.time(), val)


# ── yfinance import guard ─────────────────────────────────────────────────────

def _yf():
    try:
        import yfinance as yf
        return yf
    except ImportError:
        return None


# ── NSE/BSE Symbol helpers ────────────────────────────────────────────────────

_SYMBOL_MAP = {
    # Indices
    "nifty":   "^NSEI",  "nifty50": "^NSEI",
    "sensex":  "^BSESN", "bse":     "^BSESN",
    "banknifty": "^NSEBANK",
    # Top stocks
    "reliance": "RELIANCE.NS", "tcs": "TCS.NS",
    "infosys":  "INFY.NS",     "wipro": "WIPRO.NS",
    "hdfc":     "HDFCBANK.NS", "icici": "ICICIBANK.NS",
    "sbi":      "SBIN.NS",     "axis":  "AXISBANK.NS",
    "bajaj":    "BAJFINANCE.NS","kotak": "KOTAKBANK.NS",
    "ltimindtree": "LTIM.NS",  "hcl": "HCLTECH.NS",
    "tatamotors": "TATAMOTORS.NS", "maruti": "MARUTI.NS",
    "itc":      "ITC.NS",      "asian": "ASIANPAINT.NS",
    # Currency
    "usdinr": "USDINR=X",  "eurinr": "EURINR=X",
    # Commodities
    "gold":   "GC=F",      "silver": "SI=F", "crude": "CL=F",
}

def _resolve_symbol(name: str) -> str:
    """Map common names to yfinance tickers."""
    key = name.lower().replace(" ", "")
    return _SYMBOL_MAP.get(key, name.upper())


# ── Core API class ────────────────────────────────────────────────────────────

class MarketDataAPI:
    """
    Unified interface to real market data.
    All methods return dicts suitable for tool-call responses.
    Falls back to informative error dicts if network/library unavailable.
    """

    # ── Indices ───────────────────────────────────────────────────────────────

    def get_index(self, name: str = "nifty") -> dict:
        """
        Get live index value for Nifty 50, Sensex, or Bank Nifty.
        name: 'nifty' | 'sensex' | 'banknifty'
        """
        symbol = _resolve_symbol(name)
        key    = f"index:{symbol}"
        cached = _cached(key)
        if cached:
            return cached

        yf = _yf()
        if not yf:
            return {"error": "yfinance not installed", "symbol": symbol}

        try:
            ticker = yf.Ticker(symbol)
            hist   = ticker.history(period="2d", interval="1d")
            info   = ticker.info

            if hist.empty:
                return {"error": f"No data for {symbol}", "symbol": symbol}

            last_close = float(hist["Close"].iloc[-1])
            prev_close = float(hist["Close"].iloc[-2]) if len(hist) >= 2 else last_close
            change     = last_close - prev_close
            pct_change = (change / prev_close * 100) if prev_close else 0

            result = {
                "symbol":      symbol,
                "name":        name.upper(),
                "price":       round(last_close, 2),
                "change":      round(change, 2),
                "pct_change":  round(pct_change, 2),
                "prev_close":  round(prev_close, 2),
                "52w_high":    info.get("fiftyTwoWeekHigh"),
                "52w_low":     info.get("fiftyTwoWeekLow"),
                "pe_ratio":    info.get("trailingPE"),
                "as_of":       datetime.now().strftime("%Y-%m-%d %H:%M"),
                "source":      "Yahoo Finance / NSE",
            }
            _store(key, result)
            _log.info(f"Index fetched: {symbol} = {last_close}")
            return result

        except Exception as exc:
            _log.error(f"Index fetch error: {symbol} — {exc}")
            return {"error": str(exc), "symbol": symbol}

    # ── Stocks ────────────────────────────────────────────────────────────────

    def get_stock(self, ticker: str) -> dict:
        """
        Get live stock quote for an NSE-listed company.
        ticker: 'RELIANCE', 'TCS', 'INFY', etc. (.NS appended automatically)
        """
        symbol = _resolve_symbol(ticker)
        if not symbol.endswith(".NS") and "=" not in symbol and "^" not in symbol:
            symbol += ".NS"

        key    = f"stock:{symbol}"
        cached = _cached(key)
        if cached:
            return cached

        yf = _yf()
        if not yf:
            return {"error": "yfinance not installed"}

        try:
            t    = yf.Ticker(symbol)
            info = t.info
            hist = t.history(period="2d", interval="1d")

            if hist.empty:
                return {"error": f"No data for {symbol}", "symbol": symbol}

            price      = float(hist["Close"].iloc[-1])
            prev_close = float(hist["Close"].iloc[-2]) if len(hist) >= 2 else price
            change     = price - prev_close
            pct_change = (change / prev_close * 100) if prev_close else 0

            result = {
                "symbol":       symbol,
                "name":         info.get("longName") or info.get("shortName") or ticker.upper(),
                "price":        round(price, 2),
                "change":       round(change, 2),
                "pct_change":   round(pct_change, 2),
                "prev_close":   round(prev_close, 2),
                "volume":       info.get("volume"),
                "mkt_cap_cr":   round(info.get("marketCap", 0) / 1e7, 0) if info.get("marketCap") else None,
                "pe_ratio":     info.get("trailingPE"),
                "eps":          info.get("trailingEps"),
                "52w_high":     info.get("fiftyTwoWeekHigh"),
                "52w_low":      info.get("fiftyTwoWeekLow"),
                "sector":       info.get("sector"),
                "as_of":        datetime.now().strftime("%Y-%m-%d %H:%M"),
                "source":       "Yahoo Finance / NSE",
            }
            _store(key, result)
            _log.info(f"Stock fetched: {symbol} = {price}")
            return result

        except Exception as exc:
            _log.error(f"Stock fetch error: {symbol} — {exc}")
            return {"error": str(exc), "symbol": symbol}

    # ── Mutual Fund NAV ───────────────────────────────────────────────────────

    def get_mf_nav(self, scheme_code: int) -> dict:
        """
        Fetch current NAV for an AMFI mutual fund scheme.
        scheme_code: AMFI scheme code (e.g. 120503 = Axis Bluechip Fund - Direct)
        Uses mfapi.in — free, no API key needed.
        """
        key    = f"mf:{scheme_code}"
        cached = _cached(key, _MF_TTL)
        if cached:
            return cached

        try:
            import requests
            resp = requests.get(
                f"https://api.mfapi.in/mf/{scheme_code}",
                timeout=5,
            )
            resp.raise_for_status()
            data = resp.json()
            meta = data.get("meta", {})
            nav_list = data.get("data", [])
            if not nav_list:
                return {"error": "No NAV data found", "scheme_code": scheme_code}

            latest = nav_list[0]
            prev   = nav_list[1] if len(nav_list) > 1 else latest
            nav    = float(latest.get("nav", 0))
            prev_nav = float(prev.get("nav", nav))
            change = nav - prev_nav

            result = {
                "scheme_code": scheme_code,
                "scheme_name": meta.get("scheme_name", "Unknown"),
                "fund_house":  meta.get("fund_house",  "Unknown"),
                "scheme_type": meta.get("scheme_type", "Unknown"),
                "nav":         round(nav, 4),
                "change":      round(change, 4),
                "pct_change":  round((change / prev_nav * 100) if prev_nav else 0, 2),
                "nav_date":    latest.get("date", ""),
                "source":      "mfapi.in / AMFI",
            }
            _store(key, result)
            _log.info(f"MF NAV fetched: {scheme_code} = {nav}")
            return result

        except Exception as exc:
            _log.error(f"MF NAV error: {scheme_code} — {exc}")
            return {"error": str(exc), "scheme_code": scheme_code}

    # ── Search MF by name ─────────────────────────────────────────────────────

    def search_mf(self, query: str) -> dict:
        """
        Search for mutual fund schemes by name.
        Returns top matches with scheme codes.
        """
        try:
            import requests
            resp = requests.get("https://api.mfapi.in/mf/search",
                                params={"q": query}, timeout=5)
            resp.raise_for_status()
            results = resp.json()[:5]  # top 5
            return {
                "query":   query,
                "results": [{"code": r["schemeCode"], "name": r["schemeName"]}
                            for r in results],
                "source":  "mfapi.in",
            }
        except Exception as exc:
            return {"error": str(exc), "query": query}

    # ── Currency rates ────────────────────────────────────────────────────────

    def get_currency(self, pair: str = "USDINR") -> dict:
        """
        Get currency exchange rate.
        pair: 'USDINR', 'EURINR', 'GBPINR', 'JPYINR'
        """
        yf_symbol = pair.upper() + "=X" if "=" not in pair.upper() else pair.upper()
        key       = f"fx:{yf_symbol}"
        cached    = _cached(key, 600)  # 10-min cache for FX
        if cached:
            return cached

        yf = _yf()
        if not yf:
            return {"error": "yfinance not installed"}

        try:
            t    = yf.Ticker(yf_symbol)
            hist = t.history(period="2d", interval="1d")
            if hist.empty:
                return {"error": f"No FX data for {pair}"}

            rate      = float(hist["Close"].iloc[-1])
            prev_rate = float(hist["Close"].iloc[-2]) if len(hist) >= 2 else rate
            change    = rate - prev_rate

            result = {
                "pair":       pair.upper(),
                "rate":       round(rate, 4),
                "change":     round(change, 4),
                "pct_change": round((change / prev_rate * 100) if prev_rate else 0, 3),
                "as_of":      datetime.now().strftime("%Y-%m-%d %H:%M"),
                "source":     "Yahoo Finance",
            }
            _store(key, result)
            return result

        except Exception as exc:
            return {"error": str(exc), "pair": pair}

    # ── Portfolio summary (live) ──────────────────────────────────────────────

    def get_portfolio_prices(self, holdings: list[dict]) -> dict:
        """
        Fetch live prices for a list of holdings.
        holdings: [{"ticker": "RELIANCE", "units": 10, "avg_cost": 2500}, ...]
        Returns portfolio with current value and P&L.
        """
        yf = _yf()
        if not yf:
            return {"error": "yfinance not installed", "holdings": []}

        enriched = []
        total_invested = 0.0
        total_current  = 0.0

        for h in holdings:
            ticker    = _resolve_symbol(h.get("ticker", ""))
            if not ticker.endswith(".NS"):
                ticker += ".NS"
            units     = h.get("units", 0)
            avg_cost  = h.get("avg_cost", 0)
            invested  = units * avg_cost
            total_invested += invested

            try:
                t     = yf.Ticker(ticker)
                hist  = t.history(period="1d")
                price = float(hist["Close"].iloc[-1]) if not hist.empty else avg_cost
            except Exception:
                price = avg_cost

            current   = units * price
            pnl       = current - invested
            pnl_pct   = (pnl / invested * 100) if invested else 0
            total_current += current

            enriched.append({
                "ticker":   ticker,
                "units":    units,
                "avg_cost": avg_cost,
                "price":    round(price, 2),
                "invested": round(invested, 2),
                "current":  round(current, 2),
                "pnl":      round(pnl, 2),
                "pnl_pct":  round(pnl_pct, 2),
            })

        total_pnl     = total_current - total_invested
        total_pnl_pct = (total_pnl / total_invested * 100) if total_invested else 0

        return {
            "holdings":         enriched,
            "total_invested":   round(total_invested, 2),
            "total_current":    round(total_current, 2),
            "total_pnl":        round(total_pnl, 2),
            "total_pnl_pct":    round(total_pnl_pct, 2),
            "as_of":            datetime.now().strftime("%Y-%m-%d %H:%M"),
        }


# ── Singleton ─────────────────────────────────────────────────────────────────

_api: Optional[MarketDataAPI] = None


def get_market_api() -> MarketDataAPI:
    global _api
    if _api is None:
        _api = MarketDataAPI()
    return _api
