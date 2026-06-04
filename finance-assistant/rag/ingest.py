"""
Financial knowledge base ingestion.
Loads from both hardcoded docs and files in data/docs/*.txt
"""
from pathlib import Path
from .vector_store import SimpleVectorStore
from logs.logger import get_logger

_log = get_logger("rag")
DOCS_DIR = Path(__file__).parent.parent / "data" / "docs"

KNOWLEDGE_BASE = [
    {
        "id": "tax_new_regime",
        "text": """Indian Income Tax New Regime FY 2024-25:
Slabs: Up to ₹3L — Nil; ₹3-6L — 5%; ₹6-9L — 10%; ₹9-12L — 15%; ₹12-15L — 20%; Above ₹15L — 30%.
Standard deduction ₹75,000. Section 87A rebate: taxable income ≤ ₹7L → full tax rebate (max ₹25,000).
Health & Education Cess: 4% on total tax. Surcharge: >₹50L income.""",
    },
    {
        "id": "tax_old_regime",
        "text": """Indian Income Tax Old Regime FY 2024-25:
Slabs: Up to ₹2.5L — Nil; ₹2.5-5L — 5%; ₹5-10L — 20%; Above ₹10L — 30%.
Standard deduction ₹50,000. Section 87A rebate up to ₹5L taxable income.
Key deductions: 80C (₹1.5L), 80D (health insurance ₹25K), 24(b) (home loan interest ₹2L),
HRA exemption, LTA. Choose old regime if total deductions exceed ₹3.75L.""",
    },
    {
        "id": "section_80c",
        "text": """Section 80C Tax Saving Investments (max ₹1,50,000/year):
1. ELSS Mutual Funds — 3-year lock-in, market-linked (~12-15% historical returns).
2. PPF — 7.1% p.a., 15-year lock-in, fully tax-free (EEE category).
3. NPS — additional ₹50,000 under 80CCD(1B) beyond 80C limit.
4. Life Insurance Premium.
5. NSC (National Savings Certificate) — 7.7% p.a., 5-year lock-in.
6. Tax-saving FD — 5-year lock-in, interest taxable.
7. Home loan principal repayment.
8. ULIP — market-linked insurance + investment.""",
    },
    {
        "id": "ppf_details",
        "text": """PPF (Public Provident Fund) Details:
Current interest rate: 7.1% per annum (compounded annually, reviewed quarterly by govt).
Tenure: 15 years (extendable in 5-year blocks). Min deposit ₹500/year, max ₹1,50,000/year.
Interest earned is fully tax-free. EEE category (Exempt-Exempt-Exempt).
Partial withdrawal allowed from 7th year. Loan facility from 3rd to 6th year.
Best for: risk-averse investors wanting guaranteed, tax-free returns over long term.""",
    },
    {
        "id": "sip_investing",
        "text": """SIP (Systematic Investment Plan) Key Facts:
Invest fixed amount in mutual funds monthly. Benefits from rupee cost averaging.
Historical average returns: Nifty 50 index ~12-14% CAGR over 10+ years.
ELSS SIP qualifies for 80C deduction (3-year lock-in per installment).
Types: Equity SIP (high risk, high return), Debt SIP (low risk), Hybrid SIP (balanced).
Recommended for: long-term wealth creation (5-10+ years). Start early for compounding benefit.
SIP calculator formula: Maturity = P × [(1+r)^n - 1] / r × (1+r), r=monthly return, n=months.""",
    },
    {
        "id": "fd_rates",
        "text": """Fixed Deposit (FD) Interest Rates India 2024:
SBI: 6.5-7.1% (general), 7.1-7.6% (senior citizen). HDFC Bank: 6.6-7.25%.
ICICI Bank: 6.7-7.2%. Axis Bank: 6.7-7.2%. Small Finance Banks: up to 9%.
TDS deducted at 10% if FD interest > ₹40,000/year (₹50,000 for senior citizens).
Submit Form 15G/15H to avoid TDS if income below taxable limit.
Premature withdrawal: penalty of 0.5-1% below applicable rate.""",
    },
    {
        "id": "mutual_fund_categories",
        "text": """Mutual Fund Categories in India:
Equity Funds: Large Cap (top 100), Mid Cap (101-250), Small Cap (251+), Flexi Cap (any).
Debt Funds: Liquid (up to 91 days), Short Duration, Corporate Bond, Gilt.
Hybrid Funds: Aggressive (65-80% equity), Conservative, Balanced Advantage (dynamic).
Index Funds: Track Nifty 50, Sensex at very low expense ratio (<0.2%).
ELSS: Tax-saving equity funds, 3-year lock-in, 80C benefit.
Direct plans cheaper than regular plans by 0.5-1% (expense ratio).""",
    },
    {
        "id": "emi_home_loan",
        "text": """Home Loan EMI and Tax Benefits:
SBI Home Loan rate: 8.4-9.15% p.a. (floating, linked to repo rate).
EMI formula: P×r×(1+r)^n / [(1+r)^n - 1], where r = monthly rate, n = months.
Tax benefits: Principal repayment up to ₹1.5L under Section 80C.
Interest payment up to ₹2L under Section 24(b) for self-occupied property.
Loan eligibility: typically 60-65% of gross monthly income as EMI.
Prepayment: No charges for floating rate loans (RBI guideline).""",
    },
    {
        "id": "budget_50_30_20",
        "text": """Personal Finance Budgeting Rules for Indians:
50-30-20 Rule: 50% needs (rent, groceries, utilities), 30% wants (entertainment, dining), 20% savings.
Emergency Fund: 3-6 months of monthly expenses in liquid form (savings account or liquid fund).
Savings priority: PPF/NPS first (tax-saving), then emergency fund, then investments.
Typical Indian expense ratios: Rent 25-35%, Food 15-20%, Transport 10%, Entertainment 5-10%.
Avoid: Lifestyle inflation — increase savings proportionally with salary hikes.""",
    },
    {
        "id": "nps_details",
        "text": """NPS (National Pension System) Details:
Extra ₹50,000 deduction under Section 80CCD(1B) — over and above ₹1.5L 80C limit.
On retirement: 60% lump sum (tax-free), 40% must buy annuity (taxable).
Two tiers: Tier 1 (pension, locked till 60), Tier 2 (flexible withdrawal).
Returns: market-linked — equity (E), corporate bonds (C), govt securities (G).
Suitable for: salaried employees wanting additional tax benefit beyond 80C.""",
    },
    {
        "id": "sensex_nifty_basics",
        "text": """Indian Stock Market Indices:
Sensex (BSE): 30 largest BSE-listed companies. Base 1978-79 = 100.
Nifty 50 (NSE): 50 largest NSE-listed companies. Base Nov 1995 = 1000.
Historical CAGR: ~12-14% over 20 years. Short-term very volatile.
P/E ratio: <18 cheap, 18-22 fair, >25 expensive (Nifty historical average ~22).
Invest via index funds/ETFs — lowest cost way to participate in market.
Don't time the market — SIP beats lump sum in volatile periods.""",
    },
    {
        "id": "credit_score_cibil",
        "text": """Credit Score in India (CIBIL):
Range: 300-900. Good credit: 750+. Fair: 650-749. Poor: below 650.
Factors: Payment history (35%), Credit utilization (30%), Credit age (15%), Mix (10%), Inquiries (10%).
Tips to improve: pay bills on time, keep utilization <30%, don't close old cards, avoid multiple applications.
Free CIBIL score: once per year at cibil.com, ₹550 for full report.
Home/personal loan eligibility: 750+ gets best interest rates.""",
    },
]


def build_knowledge_base(use_faiss: bool = False):
    """
    Build and return a pre-populated vector store.
    use_faiss=True: use FAISSVectorStore (sentence-transformers embeddings).
    use_faiss=False: fall back to TF-IDF SimpleVectorStore.
    Also loads data/docs/*.txt files.
    """
    if use_faiss:
        try:
            from .faiss_store import FAISSVectorStore
            store = FAISSVectorStore()
            _log.info("Building FAISS knowledge base …")
        except Exception as exc:
            _log.warning(f"FAISS init failed ({exc}), falling back to TF-IDF")
            store = SimpleVectorStore()
    else:
        store = SimpleVectorStore()

    # Load hardcoded knowledge base
    for doc in KNOWLEDGE_BASE:
        store.add(doc["id"], doc["text"])

    # Load any .txt files from data/docs/
    if DOCS_DIR.exists():
        for txt_file in DOCS_DIR.glob("*.txt"):
            try:
                text = txt_file.read_text(encoding="utf-8").strip()
                if text:
                    store.add(txt_file.stem, text)
            except Exception:
                pass

    store.build()
    return store
