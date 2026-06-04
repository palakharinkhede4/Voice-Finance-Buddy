"""
SQLite-backed finance database.
Auto-creates schema and seeds sample data on first run.
Single source of truth for all financial data.
"""
import sqlite3
import json
from pathlib import Path
from datetime import datetime, timedelta
from typing import Optional, List, Dict
from .models import Transaction, Account, UserProfile

DB_DIR  = Path(__file__).parent.parent / "data"
DB_PATH = DB_DIR / "arthbot.db"

_instance: Optional["SQLiteDB"] = None


def get_db() -> "SQLiteDB":
    global _instance
    if _instance is None:
        _instance = SQLiteDB()
    return _instance


class SQLiteDB:
    def __init__(self):
        DB_DIR.mkdir(parents=True, exist_ok=True)
        self.conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
        self.conn.row_factory = sqlite3.Row
        self.conn.execute("PRAGMA journal_mode=WAL")
        self._init_schema()
        self._seed_if_empty()

    # ── Schema ────────────────────────────────────────────────────────────────

    def _init_schema(self) -> None:
        self.conn.executescript("""
            CREATE TABLE IF NOT EXISTS users (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                name        TEXT    NOT NULL,
                account_num TEXT    NOT NULL,
                phone       TEXT,
                email       TEXT,
                pan         TEXT,
                annual_income REAL  DEFAULT 900000
            );

            CREATE TABLE IF NOT EXISTS accounts (
                key         TEXT PRIMARY KEY,
                label       TEXT NOT NULL,
                balance     REAL NOT NULL DEFAULT 0,
                currency    TEXT NOT NULL DEFAULT 'INR',
                account_type TEXT NOT NULL DEFAULT 'savings'
            );

            CREATE TABLE IF NOT EXISTS transactions (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                date        TEXT    NOT NULL,
                description TEXT    NOT NULL,
                category    TEXT    NOT NULL,
                amount      REAL    NOT NULL,
                account     TEXT    NOT NULL,
                txn_type    TEXT    GENERATED ALWAYS AS (
                                CASE WHEN amount > 0 THEN 'credit' ELSE 'debit' END
                            ) STORED
            );

            CREATE INDEX IF NOT EXISTS idx_txn_date ON transactions(date);
            CREATE INDEX IF NOT EXISTS idx_txn_cat  ON transactions(category);

            CREATE TABLE IF NOT EXISTS goals (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                category    TEXT NOT NULL,
                description TEXT NOT NULL,
                target_amount REAL,
                current_amount REAL DEFAULT 0,
                deadline    TEXT,
                created_at  TEXT NOT NULL DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS conversation_memory (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id  TEXT NOT NULL,
                role        TEXT NOT NULL,
                content     TEXT NOT NULL,
                agent       TEXT,
                timestamp   TEXT NOT NULL DEFAULT (datetime('now'))
            );

            CREATE INDEX IF NOT EXISTS idx_mem_session ON conversation_memory(session_id);

            CREATE TABLE IF NOT EXISTS budget_limits (
                category    TEXT PRIMARY KEY,
                monthly_limit REAL NOT NULL,
                updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS user_preferences (
                key         TEXT PRIMARY KEY,
                value       TEXT NOT NULL,
                updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
            );
        """)
        self.conn.commit()

    # ── Seeding ───────────────────────────────────────────────────────────────

    def _seed_if_empty(self) -> None:
        cur = self.conn.execute("SELECT COUNT(*) FROM users")
        if cur.fetchone()[0] > 0:
            return  # Already seeded

        # Seed user
        self.conn.execute("""
            INSERT INTO users (name, account_num, phone, email, pan, annual_income)
            VALUES (?, ?, ?, ?, ?, ?)
        """, ("Rahul Sharma", "XXXX-XXXX-1234", "+91-9876543210",
              "rahul.sharma@email.com", "ABCDE1234F", 900000.0))

        # Seed accounts
        accounts_data = [
            ("savings",  "Savings Account",  85420.50,  "INR", "savings"),
            ("checking", "Current Account",  12340.00,  "INR", "current"),
            ("fd",       "Fixed Deposit",    200000.00, "INR", "fd"),
        ]
        self.conn.executemany(
            "INSERT INTO accounts (key, label, balance, currency, account_type) VALUES (?,?,?,?,?)",
            accounts_data,
        )

        # Seed transactions
        base = datetime.now()
        records = [
            (0,  "Swiggy Order",             "food",          -450.00,   "checking"),
            (0,  "UPI to Priya",             "transfer",      -2000.00,  "savings"),
            (1,  "Amazon Purchase",          "shopping",      -1899.00,  "checking"),
            (1,  "Salary Credit",            "income",        75000.00,  "savings"),
            (2,  "Zomato Order",             "food",          -320.00,   "checking"),
            (2,  "Metro Card Recharge",      "transport",     -500.00,   "checking"),
            (3,  "Electricity Bill",         "utilities",     -2400.00,  "savings"),
            (3,  "Coffee — Cafe Coffee Day", "food",          -280.00,   "checking"),
            (4,  "Ola Cab",                  "transport",     -180.00,   "checking"),
            (4,  "Flipkart Order",           "shopping",      -3499.00,  "savings"),
            (5,  "Movie Tickets PVR",        "entertainment", -850.00,   "checking"),
            (5,  "Grocery — BigBasket",      "grocery",       -1200.00,  "checking"),
            (6,  "Petrol — HP Pump",         "transport",     -1000.00,  "savings"),
            (7,  "Netflix Subscription",     "entertainment", -649.00,   "savings"),
            (7,  "Barbeque Nation",          "food",          -1800.00,  "savings"),
            (8,  "Pharmacy",                 "health",        -650.00,   "checking"),
            (8,  "Gym Membership",           "health",        -1500.00,  "savings"),
            (9,  "Jio Recharge",             "utilities",     -299.00,   "checking"),
            (10, "BookMyShow",               "entertainment", -500.00,   "checking"),
            (10, "Grocery — DMart",          "grocery",       -2300.00,  "checking"),
            (12, "ATM Withdrawal",           "cash",          -3000.00,  "savings"),
            (14, "Rent Payment",             "housing",       -18000.00, "savings"),
            (14, "Insurance Premium",        "insurance",     -5000.00,  "savings"),
            (15, "Dividend Credit",          "income",        1250.00,   "savings"),
            (16, "Swiggy Order",             "food",          -380.00,   "checking"),
            (17, "Rapido Bike",              "transport",     -65.00,    "checking"),
            (18, "Online Course — Udemy",    "education",     -499.00,   "checking"),
            (20, "Grocery — Reliance Fresh", "grocery",       -890.00,   "checking"),
            (21, "UPI to Amit",             "transfer",      -1500.00,  "savings"),
            (22, "IndiGo Flight Ticket",     "travel",        -4200.00,  "savings"),
            (25, "Salary Advance",           "income",        10000.00,  "savings"),
            (27, "Electricity Bill",         "utilities",     -2200.00,  "savings"),
            (28, "Amazon Prime",             "entertainment", -179.00,   "checking"),
            (29, "Doctor Consultation",      "health",        -800.00,   "checking"),
            (30, "Grocery — Spencer's",      "grocery",       -1100.00,  "checking"),
        ]
        self.conn.executemany(
            "INSERT INTO transactions (date, description, category, amount, account) VALUES (?,?,?,?,?)",
            [
                ((base - timedelta(days=d)).strftime("%Y-%m-%d"), desc, cat, amt, acct)
                for d, desc, cat, amt, acct in records
            ],
        )

        # Seed budget limits
        budgets = [
            ("food", 5000), ("grocery", 6000), ("transport", 3000),
            ("entertainment", 3000), ("shopping", 8000), ("utilities", 5000),
            ("health", 4000), ("housing", 20000), ("education", 2000), ("travel", 10000),
        ]
        self.conn.executemany(
            "INSERT INTO budget_limits (category, monthly_limit) VALUES (?,?)", budgets
        )

        # Seed a sample goal
        self.conn.execute("""
            INSERT INTO goals (category, description, target_amount, deadline)
            VALUES (?, ?, ?, ?)
        """, ("emergency_fund", "Build 6-month emergency fund", 450000, "2025-12-31"))

        self.conn.commit()

    # ── User ──────────────────────────────────────────────────────────────────

    @property
    def user(self) -> UserProfile:
        row = self.conn.execute("SELECT * FROM users LIMIT 1").fetchone()
        if row:
            return UserProfile(
                name=row["name"], account_number=row["account_num"],
                phone=row["phone"] or "", email=row["email"] or "",
                pan=row["pan"] or "", annual_income=row["annual_income"] or 900000,
            )
        return UserProfile("Guest", "N/A", "", "")

    # ── Accounts ──────────────────────────────────────────────────────────────

    def get_account(self, key: str) -> Optional[Account]:
        row = self.conn.execute(
            "SELECT * FROM accounts WHERE key = ?", (key.lower(),)
        ).fetchone()
        return Account(row["key"], row["label"], row["balance"],
                       row["currency"], row["account_type"]) if row else None

    def get_all_accounts(self) -> List[Account]:
        rows = self.conn.execute("SELECT * FROM accounts").fetchall()
        return [Account(r["key"], r["label"], r["balance"], r["currency"], r["account_type"])
                for r in rows]

    def get_total_balance(self) -> float:
        row = self.conn.execute("SELECT SUM(balance) as total FROM accounts").fetchone()
        return row["total"] or 0.0

    # ── Transactions ──────────────────────────────────────────────────────────

    def get_transactions(
        self,
        start_date: Optional[str] = None,
        end_date:   Optional[str] = None,
        category:   Optional[str] = None,
        account:    Optional[str] = None,
        txn_type:   Optional[str] = None,
        limit:      int = 50,
    ) -> List[Transaction]:
        today = datetime.now().date()
        sd = start_date or (today - timedelta(days=30)).strftime("%Y-%m-%d")
        ed = end_date   or today.strftime("%Y-%m-%d")

        sql    = "SELECT * FROM transactions WHERE date BETWEEN ? AND ?"
        params: list = [sd, ed]

        if category:
            sql += " AND LOWER(category) = ?"
            params.append(category.lower())
        if account:
            sql += " AND LOWER(account) = ?"
            params.append(account.lower())
        if txn_type == "credit":
            sql += " AND amount > 0"
        elif txn_type == "debit":
            sql += " AND amount < 0"

        sql += " ORDER BY date DESC LIMIT ?"
        params.append(limit)

        rows = self.conn.execute(sql, params).fetchall()
        return [Transaction(r["date"], r["description"], r["category"],
                            r["amount"], r["account"]) for r in rows]

    def get_spending_by_category(
        self,
        start_date: Optional[str] = None,
        end_date:   Optional[str] = None,
    ) -> Dict[str, float]:
        today = datetime.now().date()
        sd = start_date or (today - timedelta(days=30)).strftime("%Y-%m-%d")
        ed = end_date   or today.strftime("%Y-%m-%d")

        rows = self.conn.execute("""
            SELECT category, SUM(ABS(amount)) as total
            FROM transactions
            WHERE date BETWEEN ? AND ? AND amount < 0
            GROUP BY category
            ORDER BY total DESC
        """, (sd, ed)).fetchall()

        return {r["category"].title(): r["total"] for r in rows}

    def get_budget_status(self) -> List[dict]:
        today       = datetime.now().date()
        month_start = today.replace(day=1).strftime("%Y-%m-%d")
        today_str   = today.strftime("%Y-%m-%d")
        by_cat      = self.get_spending_by_category(month_start, today_str)

        rows = self.conn.execute(
            "SELECT category, monthly_limit FROM budget_limits"
        ).fetchall()

        status = []
        for row in rows:
            cat   = row["category"]
            limit = row["monthly_limit"]
            spent = by_cat.get(cat.title(), 0.0)
            pct   = (spent / limit * 100) if limit else 0
            status.append({
                "category":  cat.title(),
                "budget":    limit,
                "spent":     spent,
                "remaining": max(0, limit - spent),
                "pct_used":  round(pct, 1),
                "over":      spent > limit,
            })
        return sorted(status, key=lambda x: x["pct_used"], reverse=True)

    # ── Goals ─────────────────────────────────────────────────────────────────

    def get_goals(self) -> List[dict]:
        rows = self.conn.execute("SELECT * FROM goals ORDER BY created_at DESC").fetchall()
        return [dict(r) for r in rows]

    def add_goal(self, category: str, description: str,
                 target_amount: float, deadline: Optional[str] = None) -> None:
        self.conn.execute(
            "INSERT INTO goals (category, description, target_amount, deadline) VALUES (?,?,?,?)",
            (category, description, target_amount, deadline),
        )
        self.conn.commit()

    # ── Conversation Memory (SQLite) ──────────────────────────────────────────

    def save_conversation(self, session_id: str, role: str,
                          content: str, agent: str = "") -> None:
        self.conn.execute(
            "INSERT INTO conversation_memory (session_id, role, content, agent) VALUES (?,?,?,?)",
            (session_id, role, content, agent),
        )
        self.conn.commit()

    def get_conversation_history(self, session_id: str, limit: int = 40) -> List[dict]:
        rows = self.conn.execute("""
            SELECT role, content, agent, timestamp FROM conversation_memory
            WHERE session_id = ? ORDER BY id DESC LIMIT ?
        """, (session_id, limit)).fetchall()
        return [dict(r) for r in reversed(rows)]

    # ── Preferences ───────────────────────────────────────────────────────────

    def set_preference(self, key: str, value: str) -> None:
        self.conn.execute(
            "INSERT OR REPLACE INTO user_preferences (key, value) VALUES (?,?)",
            (key, value),
        )
        self.conn.commit()

    def get_preference(self, key: str, default: str = "") -> str:
        row = self.conn.execute(
            "SELECT value FROM user_preferences WHERE key = ?", (key,)
        ).fetchone()
        return row["value"] if row else default
