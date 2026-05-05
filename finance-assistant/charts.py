"""
Chart generation for the ArthBot spending dashboard.
All functions return Plotly figures ready for st.plotly_chart().
"""

from datetime import datetime, timedelta
from collections import defaultdict
import plotly.graph_objects as go
import plotly.express as px
from finance_functions import TRANSACTIONS, ACCOUNTS

# ── Colour palette ────────────────────────────────────────────────────────────

CATEGORY_COLORS = {
    "Food":          "#FF6B6B",
    "Shopping":      "#4ECDC4",
    "Transport":     "#45B7D1",
    "Utilities":     "#96CEB4",
    "Entertainment": "#FFEAA7",
    "Grocery":       "#DDA0DD",
    "Health":        "#98D8C8",
    "Housing":       "#F7DC6F",
    "Insurance":     "#AEB6BF",
    "Education":     "#85C1E9",
    "Travel":        "#F8C471",
    "Cash":          "#D7DBDD",
    "Transfer":      "#BB8FCE",
    "Income":        "#58D68D",
}

CHART_BG    = "rgba(0,0,0,0)"
GRID_COLOR  = "rgba(255,255,255,0.08)"
FONT_COLOR  = "#FAFAFA"
ACCENT      = "#6C63FF"


def _base_layout(title: str) -> dict:
    return dict(
        title=dict(text=title, font=dict(color=FONT_COLOR, size=15), x=0.02),
        paper_bgcolor=CHART_BG,
        plot_bgcolor=CHART_BG,
        font=dict(color=FONT_COLOR, family="sans-serif"),
        margin=dict(l=16, r=16, t=48, b=16),
        showlegend=True,
        legend=dict(
            font=dict(color=FONT_COLOR, size=11),
            bgcolor="rgba(0,0,0,0)",
        ),
    )


# ── 1. Pie chart — spending by category (last 30 days) ───────────────────────

def pie_chart_by_category(days: int = 30) -> go.Figure:
    cutoff = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")
    by_cat: dict = defaultdict(float)
    for t in TRANSACTIONS:
        if t["date"] >= cutoff and t["amount"] < 0:
            cat = t["category"].title()
            by_cat[cat] += abs(t["amount"])

    labels = list(by_cat.keys())
    values = list(by_cat.values())
    colors = [CATEGORY_COLORS.get(l, "#888") for l in labels]

    fig = go.Figure(go.Pie(
        labels=labels,
        values=values,
        hole=0.45,
        marker=dict(colors=colors, line=dict(color="#1A1D2E", width=2)),
        textinfo="label+percent",
        textfont=dict(size=11, color=FONT_COLOR),
        hovertemplate="<b>%{label}</b><br>₹%{value:,.0f}<br>%{percent}<extra></extra>",
    ))

    fig.update_layout(
        **_base_layout(f"Spending by Category — Last {days} days"),
        annotations=[dict(
            text=f"₹{sum(values):,.0f}",
            x=0.5, y=0.5,
            font=dict(size=16, color=FONT_COLOR, family="sans-serif"),
            showarrow=False,
        )],
    )
    return fig


# ── 2. Horizontal bar chart — top spending categories ────────────────────────

def bar_chart_by_category(days: int = 30) -> go.Figure:
    cutoff = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")
    by_cat: dict = defaultdict(float)
    for t in TRANSACTIONS:
        if t["date"] >= cutoff and t["amount"] < 0:
            cat = t["category"].title()
            by_cat[cat] += abs(t["amount"])

    sorted_cats = sorted(by_cat.items(), key=lambda x: x[1])
    categories  = [c for c, _ in sorted_cats]
    amounts     = [a for _, a in sorted_cats]
    colors      = [CATEGORY_COLORS.get(c, "#888") for c in categories]

    fig = go.Figure(go.Bar(
        x=amounts,
        y=categories,
        orientation="h",
        marker=dict(
            color=colors,
            line=dict(width=0),
        ),
        text=[f"₹{a:,.0f}" for a in amounts],
        textposition="outside",
        textfont=dict(size=10, color=FONT_COLOR),
        hovertemplate="<b>%{y}</b><br>₹%{x:,.0f}<extra></extra>",
    ))

    fig.update_layout(
        **_base_layout(f"Category Breakdown — Last {days} days"),
        xaxis=dict(
            showgrid=True, gridcolor=GRID_COLOR,
            tickformat=",.0f", tickprefix="₹",
            color=FONT_COLOR, showline=False,
        ),
        yaxis=dict(color=FONT_COLOR, showgrid=False),
        bargap=0.3,
    )
    return fig


# ── 3. Line chart — daily spending trend (last 30 days) ──────────────────────

def line_chart_daily_spending(days: int = 30) -> go.Figure:
    today  = datetime.now().date()
    cutoff = today - timedelta(days=days - 1)

    # Build daily totals dict
    daily: dict = defaultdict(float)
    for t in TRANSACTIONS:
        t_date = datetime.strptime(t["date"], "%Y-%m-%d").date()
        if t_date >= cutoff and t["amount"] < 0:
            daily[t["date"]] += abs(t["amount"])

    # Fill in every day (even zeros)
    date_list   = [(cutoff + timedelta(days=i)) for i in range(days)]
    date_strs   = [d.strftime("%Y-%m-%d") for d in date_list]
    spend_vals  = [daily.get(d, 0.0) for d in date_strs]

    # 7-day rolling average
    rolling: list = []
    for i in range(len(spend_vals)):
        window = spend_vals[max(0, i - 6): i + 1]
        rolling.append(sum(window) / len(window))

    fig = go.Figure()

    # Area fill under bars
    fig.add_trace(go.Bar(
        x=date_strs,
        y=spend_vals,
        name="Daily Spend",
        marker=dict(color=ACCENT, opacity=0.45),
        hovertemplate="<b>%{x}</b><br>₹%{y:,.0f}<extra></extra>",
    ))

    # Rolling average line
    fig.add_trace(go.Scatter(
        x=date_strs,
        y=rolling,
        name="7-day avg",
        mode="lines",
        line=dict(color="#FF6B6B", width=2.5, dash="solid"),
        hovertemplate="<b>%{x}</b><br>Avg ₹%{y:,.0f}<extra></extra>",
    ))

    fig.update_layout(
        **_base_layout(f"Daily Spending — Last {days} days"),
        xaxis=dict(
            showgrid=False, tickangle=-35,
            color=FONT_COLOR, tickformat="%d %b",
        ),
        yaxis=dict(
            showgrid=True, gridcolor=GRID_COLOR,
            tickformat=",.0f", tickprefix="₹",
            color=FONT_COLOR,
        ),
        barmode="overlay",
        hovermode="x unified",
    )
    return fig


# ── 4. Summary KPI numbers ────────────────────────────────────────────────────

def get_kpis() -> dict:
    today      = datetime.now().date()
    month_start = today.replace(day=1).strftime("%Y-%m-%d")
    week_start  = (today - timedelta(days=6)).strftime("%Y-%m-%d")
    today_str   = today.strftime("%Y-%m-%d")

    total_balance = sum(a["balance"] for a in ACCOUNTS.values())

    month_spend = sum(
        abs(t["amount"]) for t in TRANSACTIONS
        if t["date"] >= month_start and t["amount"] < 0
    )
    month_income = sum(
        t["amount"] for t in TRANSACTIONS
        if t["date"] >= month_start and t["amount"] > 0
    )
    week_spend = sum(
        abs(t["amount"]) for t in TRANSACTIONS
        if t["date"] >= week_start and t["amount"] < 0
    )
    today_spend = sum(
        abs(t["amount"]) for t in TRANSACTIONS
        if t["date"] == today_str and t["amount"] < 0
    )

    savings_rate = ((month_income - month_spend) / month_income * 100) if month_income else 0

    return {
        "total_balance":  total_balance,
        "month_spend":    month_spend,
        "month_income":   month_income,
        "week_spend":     week_spend,
        "today_spend":    today_spend,
        "savings_rate":   savings_rate,
    }
