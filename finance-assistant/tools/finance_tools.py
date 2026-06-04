"""
Core personal finance tools backed by the in-memory database.
These are registered as OpenAI function-calling tools.
"""
from datetime import datetime, timedelta
from typing import Optional
from database.db import get_db


# ── Tool functions ────────────────────────────────────────────────────────────

def get_account_balance(account: Optional[str] = None) -> dict:
    """Return balance for one or all accounts."""
    db = get_db()
    if account:
        acct = db.get_account(account)
        if acct:
            return {"account": acct.label, "balance": acct.balance, "currency": "INR"}
        return {"error": f"Account '{account}' not found. Valid: savings, checking, fd"}
    result = {a.label: {"balance": a.balance, "currency": "INR"} for a in db.get_all_accounts()}
    result["Total Balance"] = {"balance": db.get_total_balance(), "currency": "INR"}
    return result


def get_expenses(
    start_date: Optional[str] = None,
    end_date:   Optional[str] = None,
    category:   Optional[str] = None,
    limit:      int = 10,
) -> dict:
    """Return filtered expense transactions."""
    db    = get_db()
    today = datetime.now().date()
    sd    = start_date or (today - timedelta(days=7)).strftime("%Y-%m-%d")
    ed    = end_date   or today.strftime("%Y-%m-%d")

    txns = db.get_transactions(sd, ed, category=category, txn_type="debit", limit=limit)
    total = sum(abs(t.amount) for t in txns)
    return {
        "period":       f"{sd} to {ed}",
        "transactions": [t.to_dict() for t in txns],
        "total_spent":  total,
        "count":        len(txns),
    }


def get_income_summary(
    start_date: Optional[str] = None,
    end_date:   Optional[str] = None,
) -> dict:
    """Return income/credit transactions in a period."""
    db    = get_db()
    today = datetime.now().date()
    sd    = start_date or today.replace(day=1).strftime("%Y-%m-%d")
    ed    = end_date   or today.strftime("%Y-%m-%d")

    txns         = db.get_transactions(sd, ed, txn_type="credit")
    total_income = sum(t.amount for t in txns)
    return {
        "period":       f"{sd} to {ed}",
        "transactions": [t.to_dict() for t in txns],
        "total_income": total_income,
        "count":        len(txns),
    }


def get_spending_by_category(
    start_date: Optional[str] = None,
    end_date:   Optional[str] = None,
) -> dict:
    """Return spending grouped by category."""
    db    = get_db()
    today = datetime.now().date()
    sd    = start_date or (today - timedelta(days=30)).strftime("%Y-%m-%d")
    ed    = end_date   or today.strftime("%Y-%m-%d")

    by_cat = db.get_spending_by_category(sd, ed)
    return {
        "period":               f"{sd} to {ed}",
        "spending_by_category": by_cat,
        "total_spent":          sum(by_cat.values()),
    }


def get_recent_transactions(limit: int = 5, account: Optional[str] = None) -> dict:
    """Return the most recent transactions."""
    db   = get_db()
    txns = db.get_transactions(account=account, limit=limit)
    return {"transactions": [t.to_dict() for t in txns], "count": len(txns)}


def get_budget_status() -> dict:
    """Return budget vs actual spending for the current month."""
    db     = get_db()
    status = db.get_budget_status()
    over   = [s for s in status if s["over"]]
    return {
        "month":          datetime.now().strftime("%B %Y"),
        "categories":     status,
        "over_budget":    over,
        "alert_count":    len(over),
    }


# ── OpenAI tool definitions ───────────────────────────────────────────────────

FINANCE_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_account_balance",
            "description": "Get account balance. Use for: 'mera balance', 'kitna paisa hai', 'account balance', 'savings mein kitna hai'.",
            "parameters": {
                "type": "object",
                "properties": {
                    "account": {
                        "type": "string",
                        "enum": ["savings", "checking", "fd"],
                        "description": "Specific account. Omit to get all accounts.",
                    }
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_expenses",
            "description": "Get expense transactions. Use for: 'kharcha', 'expenses', 'spending', 'kitna kharcha kiya'.",
            "parameters": {
                "type": "object",
                "properties": {
                    "start_date": {"type": "string", "description": "Start date YYYY-MM-DD."},
                    "end_date":   {"type": "string", "description": "End date YYYY-MM-DD."},
                    "category": {
                        "type": "string",
                        "description": "Category: food, shopping, transport, utilities, entertainment, grocery, health, housing, insurance, education, travel, cash, transfer.",
                    },
                    "limit": {"type": "integer", "description": "Max transactions to return (default 10)."},
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_income_summary",
            "description": "Get income/salary credits. Use for: 'salary', 'income', 'kitna aaya', 'earnings'.",
            "parameters": {
                "type": "object",
                "properties": {
                    "start_date": {"type": "string"},
                    "end_date":   {"type": "string"},
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_spending_by_category",
            "description": "Get spending breakdown by category. Use for: 'category wise', 'kahan kharcha kiya', 'breakdown', 'category analysis'.",
            "parameters": {
                "type": "object",
                "properties": {
                    "start_date": {"type": "string"},
                    "end_date":   {"type": "string"},
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_recent_transactions",
            "description": "Get the most recent transactions. Use for: 'recent', 'last transactions', 'kya hua', 'latest'.",
            "parameters": {
                "type": "object",
                "properties": {
                    "limit":   {"type": "integer", "description": "Number of recent transactions."},
                    "account": {"type": "string", "enum": ["savings", "checking", "fd"]},
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_budget_status",
            "description": "Check budget vs actual spending for each category this month. Use for: 'budget', 'over budget', 'kitna bacha', 'limit exceeded'.",
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
]

FINANCE_TOOL_MAP = {
    "get_account_balance":    get_account_balance,
    "get_expenses":           get_expenses,
    "get_income_summary":     get_income_summary,
    "get_spending_by_category": get_spending_by_category,
    "get_recent_transactions": get_recent_transactions,
    "get_budget_status":      get_budget_status,
}
