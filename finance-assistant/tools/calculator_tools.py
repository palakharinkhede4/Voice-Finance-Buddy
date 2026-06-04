"""
Financial calculator tools: EMI, SIP, FD, compound interest, PPF, tax savings.
All calculations are standard Indian personal finance formulas.
"""
import math


# ── Calculator functions ──────────────────────────────────────────────────────

def calculate_emi(principal: float, annual_rate: float, tenure_months: int) -> dict:
    """
    Calculate EMI (Equated Monthly Instalment) for a loan.
    principal: loan amount in INR
    annual_rate: annual interest rate in % (e.g. 8.5 for 8.5%)
    tenure_months: loan duration in months
    """
    if annual_rate <= 0:
        emi = principal / tenure_months
        return {
            "principal": principal,
            "annual_rate_pct": annual_rate,
            "tenure_months": tenure_months,
            "emi": round(emi, 2),
            "total_payment": round(emi * tenure_months, 2),
            "total_interest": 0,
        }

    r = annual_rate / 12 / 100
    emi = principal * r * (1 + r) ** tenure_months / ((1 + r) ** tenure_months - 1)
    total_payment  = emi * tenure_months
    total_interest = total_payment - principal

    return {
        "principal":       round(principal, 2),
        "annual_rate_pct": annual_rate,
        "tenure_months":   tenure_months,
        "tenure_years":    round(tenure_months / 12, 1),
        "emi":             round(emi, 2),
        "total_payment":   round(total_payment, 2),
        "total_interest":  round(total_interest, 2),
        "currency":        "INR",
    }


def calculate_sip_returns(monthly_amount: float, annual_rate: float, years: int) -> dict:
    """
    Calculate SIP (Systematic Investment Plan) maturity value.
    monthly_amount: amount invested per month in INR
    annual_rate: expected annual return in % (e.g. 12 for 12%)
    years: investment duration in years
    """
    r = annual_rate / 12 / 100
    n = years * 12
    if r == 0:
        maturity = monthly_amount * n
    else:
        maturity = monthly_amount * ((1 + r) ** n - 1) / r * (1 + r)

    invested       = monthly_amount * n
    wealth_gained  = maturity - invested

    return {
        "monthly_sip":       round(monthly_amount, 2),
        "annual_rate_pct":   annual_rate,
        "years":             years,
        "total_invested":    round(invested, 2),
        "maturity_value":    round(maturity, 2),
        "wealth_gained":     round(wealth_gained, 2),
        "returns_pct":       round(wealth_gained / invested * 100, 1) if invested else 0,
        "currency":          "INR",
    }


def calculate_fd_maturity(principal: float, annual_rate: float, years: float, compounding: str = "quarterly") -> dict:
    """
    Calculate Fixed Deposit maturity amount.
    principal: FD amount in INR
    annual_rate: annual interest rate in %
    years: tenure in years (can be decimal e.g. 1.5)
    compounding: 'quarterly' (default), 'monthly', 'annually'
    """
    freq_map = {"monthly": 12, "quarterly": 4, "annually": 1, "half-yearly": 2}
    n = freq_map.get(compounding.lower(), 4)
    r = annual_rate / 100

    maturity      = principal * (1 + r / n) ** (n * years)
    interest      = maturity - principal
    tds_deducted  = interest * 0.10 if interest > 40000 else 0.0

    return {
        "principal":      round(principal, 2),
        "annual_rate_pct": annual_rate,
        "tenure_years":   years,
        "compounding":    compounding,
        "maturity_value": round(maturity, 2),
        "interest_earned": round(interest, 2),
        "tds_deducted":   round(tds_deducted, 2),
        "net_maturity":   round(maturity - tds_deducted, 2),
        "note":           "TDS of 10% deducted if interest > ₹40,000/year",
        "currency":       "INR",
    }


def calculate_ppf_maturity(annual_investment: float, years: int = 15) -> dict:
    """
    Calculate PPF (Public Provident Fund) maturity.
    annual_investment: amount deposited per year (max ₹1,50,000)
    years: PPF tenure (min 15 years)
    """
    annual_investment = min(annual_investment, 150000)
    rate  = 0.071  # Current PPF rate 7.1%
    years = max(years, 15)

    maturity     = 0.0
    total_invest = annual_investment * years
    for y in range(1, years + 1):
        maturity += annual_investment * (1 + rate) ** (years - y + 1)

    return {
        "annual_investment":   round(annual_investment, 2),
        "tenure_years":        years,
        "current_rate_pct":    7.1,
        "total_invested":      round(total_invest, 2),
        "maturity_value":      round(maturity, 2),
        "interest_earned":     round(maturity - total_invest, 2),
        "tax_benefit_80c":     round(min(annual_investment, 150000), 2),
        "note":                "PPF interest is fully tax-free (EEE category)",
        "currency":            "INR",
    }


def calculate_income_tax(annual_income: float, regime: str = "new") -> dict:
    """
    Calculate Indian income tax for FY 2024-25.
    annual_income: gross annual income in INR
    regime: 'new' (default) or 'old'
    """
    if regime.lower() == "new":
        # New regime slabs FY 2024-25
        slabs   = [(300000, 0), (300000, 0.05), (300000, 0.10),
                   (300000, 0.15), (300000, 0.20), (float("inf"), 0.30)]
        std_ded = 75000
        taxable = max(0, annual_income - std_ded)
        rebate_limit = 700000
    else:
        # Old regime slabs FY 2024-25
        slabs   = [(250000, 0), (250000, 0.05), (500000, 0.20), (float("inf"), 0.30)]
        std_ded = 50000
        taxable = max(0, annual_income - std_ded)
        rebate_limit = 500000

    # Compute tax slab-wise
    tax  = 0.0
    rem  = taxable
    slab_detail = []
    for slab_limit, rate in slabs:
        if rem <= 0:
            break
        taxed = min(rem, slab_limit)
        slab_tax = taxed * rate
        tax += slab_tax
        if rate > 0:
            slab_detail.append({"slab": f"₹{taxed:,.0f} @ {int(rate*100)}%", "tax": round(slab_tax, 2)})
        rem -= taxed

    # Section 87A rebate
    if taxable <= rebate_limit:
        rebate = min(tax, 25000)
        tax   -= rebate
    else:
        rebate = 0

    surcharge = 0.0
    if annual_income > 5000000:
        surcharge = tax * 0.10
    cess = (tax + surcharge) * 0.04
    total_tax = tax + surcharge + cess

    return {
        "gross_income":      round(annual_income, 2),
        "standard_deduction": std_ded,
        "taxable_income":    round(taxable, 2),
        "regime":            regime,
        "slab_breakdown":    slab_detail,
        "tax_before_rebate": round(tax + rebate, 2),
        "section_87a_rebate": round(rebate, 2),
        "surcharge":         round(surcharge, 2),
        "cess_4pct":         round(cess, 2),
        "total_tax":         round(total_tax, 2),
        "effective_rate_pct": round(total_tax / annual_income * 100, 2) if annual_income else 0,
        "monthly_tax":       round(total_tax / 12, 2),
        "currency":          "INR",
        "note":              f"FY 2024-25 | Section 87A rebate applies if taxable ≤ ₹{rebate_limit:,.0f}",
    }


# ── OpenAI tool definitions ───────────────────────────────────────────────────

CALCULATOR_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "calculate_emi",
            "description": "Calculate EMI for home loan, car loan, or personal loan. Use for: 'EMI kitna hoga', 'loan EMI', 'monthly instalment'.",
            "parameters": {
                "type": "object",
                "properties": {
                    "principal":      {"type": "number", "description": "Loan amount in INR."},
                    "annual_rate":    {"type": "number", "description": "Annual interest rate in % (e.g. 8.5)."},
                    "tenure_months":  {"type": "integer", "description": "Loan tenure in months (e.g. 240 for 20 years)."},
                },
                "required": ["principal", "annual_rate", "tenure_months"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "calculate_sip_returns",
            "description": "Calculate SIP (Systematic Investment Plan) maturity value. Use for: 'SIP returns', 'mutual fund SIP', 'monthly investment returns'.",
            "parameters": {
                "type": "object",
                "properties": {
                    "monthly_amount": {"type": "number", "description": "Monthly SIP amount in INR."},
                    "annual_rate":    {"type": "number", "description": "Expected annual return % (e.g. 12)."},
                    "years":          {"type": "integer", "description": "Investment duration in years."},
                },
                "required": ["monthly_amount", "annual_rate", "years"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "calculate_fd_maturity",
            "description": "Calculate Fixed Deposit (FD) maturity amount with TDS. Use for: 'FD maturity', 'fixed deposit returns', 'FD calculator'.",
            "parameters": {
                "type": "object",
                "properties": {
                    "principal":    {"type": "number",  "description": "FD deposit amount in INR."},
                    "annual_rate":  {"type": "number",  "description": "Annual interest rate % (e.g. 7.5)."},
                    "years":        {"type": "number",  "description": "Tenure in years (e.g. 2.5)."},
                    "compounding":  {"type": "string",  "description": "Compounding: quarterly (default), monthly, annually."},
                },
                "required": ["principal", "annual_rate", "years"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "calculate_ppf_maturity",
            "description": "Calculate PPF maturity value and tax savings. Use for: 'PPF', 'public provident fund', 'PPF calculator'.",
            "parameters": {
                "type": "object",
                "properties": {
                    "annual_investment": {"type": "number",  "description": "Annual PPF deposit in INR (max ₹1,50,000)."},
                    "years":             {"type": "integer", "description": "Tenure in years (min 15)."},
                },
                "required": ["annual_investment"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "calculate_income_tax",
            "description": "Calculate Indian income tax for FY 2024-25 under old or new regime. Use for: 'tax kitna lagega', 'income tax', 'tax calculation', '80C'.",
            "parameters": {
                "type": "object",
                "properties": {
                    "annual_income": {"type": "number", "description": "Gross annual income in INR."},
                    "regime":        {"type": "string", "description": "'new' or 'old' tax regime."},
                },
                "required": ["annual_income"],
            },
        },
    },
]

CALCULATOR_TOOL_MAP = {
    "calculate_emi":           calculate_emi,
    "calculate_sip_returns":   calculate_sip_returns,
    "calculate_fd_maturity":   calculate_fd_maturity,
    "calculate_ppf_maturity":  calculate_ppf_maturity,
    "calculate_income_tax":    calculate_income_tax,
}
