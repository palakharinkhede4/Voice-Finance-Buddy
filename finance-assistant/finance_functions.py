from datetime import datetime, timedelta
from typing import Optional
import json

# ── Mock financial database ──────────────────────────────────────────────────

USER_PROFILE = {
    "name": "Rahul Sharma",
    "account_number": "XXXX-XXXX-1234",
    "phone": "+91-9876543210",
}

ACCOUNTS = {
    "savings": {"balance": 85420.50, "currency": "INR", "label": "Savings Account"},
    "checking": {"balance": 12340.00, "currency": "INR", "label": "Current Account"},
    "fd": {"balance": 200000.00, "currency": "INR", "label": "Fixed Deposit"},
}

# Generate realistic mock transactions for the last 30 days
def _generate_transactions():
    base_date = datetime.now()
    txns = []
    records = [
        # (days_ago, description, category, amount, account)
        (0, "Swiggy Order", "food", -450.00, "checking"),
        (0, "UPI to Priya", "transfer", -2000.00, "savings"),
        (1, "Amazon Purchase", "shopping", -1899.00, "checking"),
        (1, "Salary Credit", "income", 75000.00, "savings"),
        (2, "Zomato Order", "food", -320.00, "checking"),
        (2, "Metro Card Recharge", "transport", -500.00, "checking"),
        (3, "Electricity Bill", "utilities", -2400.00, "savings"),
        (3, "Coffee at Cafe Coffee Day", "food", -280.00, "checking"),
        (4, "Ola Cab", "transport", -180.00, "checking"),
        (4, "Flipkart Order", "shopping", -3499.00, "savings"),
        (5, "Movie Tickets PVR", "entertainment", -850.00, "checking"),
        (5, "Grocery - BigBasket", "grocery", -1200.00, "checking"),
        (6, "Petrol - HP Pump", "transport", -1000.00, "savings"),
        (7, "Netflix Subscription", "entertainment", -649.00, "savings"),
        (7, "Restaurant - Barbeque Nation", "food", -1800.00, "savings"),
        (8, "Pharmacy", "health", -650.00, "checking"),
        (8, "Gym Membership", "health", -1500.00, "savings"),
        (9, "Jio Recharge", "utilities", -299.00, "checking"),
        (10, "BookMyShow", "entertainment", -500.00, "checking"),
        (10, "Grocery - DMart", "grocery", -2300.00, "checking"),
        (12, "ATM Withdrawal", "cash", -3000.00, "savings"),
        (14, "Rent Payment", "housing", -18000.00, "savings"),
        (14, "Insurance Premium", "insurance", -5000.00, "savings"),
        (15, "Dividend Credit", "income", 1250.00, "savings"),
        (16, "Swiggy Order", "food", -380.00, "checking"),
        (17, "Rapido Bike", "transport", -65.00, "checking"),
        (18, "Online Course Udemy", "education", -499.00, "checking"),
        (20, "Grocery - Reliance Fresh", "grocery", -890.00, "checking"),
        (21, "UPI to Amit", "transfer", -1500.00, "savings"),
        (22, "Indigo Flight Ticket", "travel", -4200.00, "savings"),
        (25, "Salary Advance", "income", 10000.00, "savings"),
        (27, "Electricity Bill", "utilities", -2200.00, "savings"),
        (28, "Amazon Prime", "entertainment", -179.00, "checking"),
        (29, "Doctor Consultation", "health", -800.00, "checking"),
        (30, "Grocery - Spencer's", "grocery", -1100.00, "checking"),
    ]
    for days_ago, desc, cat, amt, acct in records:
        txns.append({
            "date": (base_date - timedelta(days=days_ago)).strftime("%Y-%m-%d"),
            "description": desc,
            "category": cat,
            "amount": amt,
            "account": acct,
            "type": "credit" if amt > 0 else "debit",
        })
    return txns

TRANSACTIONS = _generate_transactions()


# ── Tool functions called by the LLM agent ──────────────────────────────────

def get_account_balance(account: Optional[str] = None) -> dict:
    """Return balance for one or all accounts."""
    if account and account.lower() in ACCOUNTS:
        acct = ACCOUNTS[account.lower()]
        return {
            "account": acct["label"],
            "balance": acct["balance"],
            "currency": acct["currency"],
        }
    # return all accounts
    result = {}
    total = 0.0
    for key, acct in ACCOUNTS.items():
        result[acct["label"]] = {"balance": acct["balance"], "currency": acct["currency"]}
        total += acct["balance"]
    result["Total Balance"] = {"balance": total, "currency": "INR"}
    return result


def get_expenses(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    category: Optional[str] = None,
    limit: int = 10,
) -> dict:
    """Return filtered expense transactions."""
    today = datetime.now().date()

    if not start_date:
        start_date = (today - timedelta(days=7)).strftime("%Y-%m-%d")
    if not end_date:
        end_date = today.strftime("%Y-%m-%d")

    filtered = [
        t for t in TRANSACTIONS
        if start_date <= t["date"] <= end_date and t["amount"] < 0
    ]

    if category:
        filtered = [t for t in filtered if t["category"].lower() == category.lower()]

    filtered = sorted(filtered, key=lambda x: x["date"], reverse=True)[:limit]

    total_spent = sum(abs(t["amount"]) for t in filtered)
    return {
        "period": f"{start_date} to {end_date}",
        "transactions": filtered,
        "total_spent": total_spent,
        "count": len(filtered),
    }


def get_income_summary(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> dict:
    """Return income transactions in a period."""
    today = datetime.now().date()
    if not start_date:
        start_date = (today.replace(day=1)).strftime("%Y-%m-%d")
    if not end_date:
        end_date = today.strftime("%Y-%m-%d")

    credits = [
        t for t in TRANSACTIONS
        if start_date <= t["date"] <= end_date and t["amount"] > 0
    ]
    total_income = sum(t["amount"] for t in credits)
    return {
        "period": f"{start_date} to {end_date}",
        "transactions": credits,
        "total_income": total_income,
        "count": len(credits),
    }


def get_spending_by_category(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> dict:
    """Return spending grouped by category."""
    today = datetime.now().date()
    if not start_date:
        start_date = (today - timedelta(days=30)).strftime("%Y-%m-%d")
    if not end_date:
        end_date = today.strftime("%Y-%m-%d")

    filtered = [
        t for t in TRANSACTIONS
        if start_date <= t["date"] <= end_date and t["amount"] < 0
    ]

    by_cat: dict = {}
    for t in filtered:
        cat = t["category"].title()
        by_cat[cat] = by_cat.get(cat, 0) + abs(t["amount"])

    by_cat = dict(sorted(by_cat.items(), key=lambda x: x[1], reverse=True))
    return {
        "period": f"{start_date} to {end_date}",
        "spending_by_category": by_cat,
        "total_spent": sum(by_cat.values()),
    }


def get_recent_transactions(limit: int = 5, account: Optional[str] = None) -> dict:
    """Return the most recent transactions."""
    txns = TRANSACTIONS
    if account:
        txns = [t for t in txns if t["account"] == account.lower()]
    txns = sorted(txns, key=lambda x: x["date"], reverse=True)[:limit]
    return {"transactions": txns, "count": len(txns)}


# ── Tool definitions for OpenAI function calling ──────────────────────────────

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_account_balance",
            "description": "Get account balance. Use for queries like 'mera balance', 'kitna paisa hai', 'account balance'.",
            "parameters": {
                "type": "object",
                "properties": {
                    "account": {
                        "type": "string",
                        "enum": ["savings", "checking", "fd"],
                        "description": "Specific account type. Omit to get all accounts.",
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
            "description": "Get expense transactions. Use for queries like 'kitna kharcha kiya', 'expenses', 'spending'.",
            "parameters": {
                "type": "object",
                "properties": {
                    "start_date": {
                        "type": "string",
                        "description": "Start date in YYYY-MM-DD. Use today's date context.",
                    },
                    "end_date": {
                        "type": "string",
                        "description": "End date in YYYY-MM-DD.",
                    },
                    "category": {
                        "type": "string",
                        "description": "Category filter: food, shopping, transport, utilities, entertainment, grocery, health, housing, insurance, education, travel, cash, transfer.",
                    },
                    "limit": {"type": "integer", "description": "Max number of transactions to return."},
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_income_summary",
            "description": "Get income/salary credits. Use for queries like 'salary', 'income', 'kitna aaya'.",
            "parameters": {
                "type": "object",
                "properties": {
                    "start_date": {"type": "string"},
                    "end_date": {"type": "string"},
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_spending_by_category",
            "description": "Get a breakdown of spending by category. Use for queries like 'category wise spending', 'kahan kharcha kiya', 'breakdown'.",
            "parameters": {
                "type": "object",
                "properties": {
                    "start_date": {"type": "string"},
                    "end_date": {"type": "string"},
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_recent_transactions",
            "description": "Get recent transactions. Use for queries like 'recent transactions', 'last transactions', 'kya hua'.",
            "parameters": {
                "type": "object",
                "properties": {
                    "limit": {"type": "integer", "description": "Number of recent transactions."},
                    "account": {"type": "string", "enum": ["savings", "checking", "fd"]},
                },
                "required": [],
            },
        },
    },
]

TOOL_MAP = {
    "get_account_balance": get_account_balance,
    "get_expenses": get_expenses,
    "get_income_summary": get_income_summary,
    "get_spending_by_category": get_spending_by_category,
    "get_recent_transactions": get_recent_transactions,
}
