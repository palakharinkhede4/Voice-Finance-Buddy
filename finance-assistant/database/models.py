from dataclasses import dataclass, field
from typing import Optional


@dataclass
class Transaction:
    date: str
    description: str
    category: str
    amount: float
    account: str
    txn_type: str = ""

    def __post_init__(self):
        self.txn_type = "credit" if self.amount > 0 else "debit"

    def to_dict(self) -> dict:
        return {
            "date":        self.date,
            "description": self.description,
            "category":    self.category,
            "amount":      self.amount,
            "account":     self.account,
            "type":        self.txn_type,
        }


@dataclass
class Account:
    key: str
    label: str
    balance: float
    currency: str = "INR"
    account_type: str = "savings"

    def to_dict(self) -> dict:
        return {
            "key":      self.key,
            "label":    self.label,
            "balance":  self.balance,
            "currency": self.currency,
            "type":     self.account_type,
        }


@dataclass
class UserProfile:
    name: str
    account_number: str
    phone: str
    email: str = ""
    pan: str = "ABCDE1234F"
    annual_income: float = 900000.0
