"use client";
import { useUI } from "@/store/ui";
import { formatCurrency } from "@/lib/utils";
import { DollarSign, ShoppingBag, Vault, Building2 } from "lucide-react";
import type { KpiData } from "@/lib/queries/dashboard";

export default function KpiCards({ kpi }: { kpi: KpiData }) {
  const { currency } = useUI();

  const cards = [
    { key: "inc",  label: "Total Income",   amount: kpi.income,   pct: kpi.incPct, up: (kpi.incPct ?? "+")[0] === "+", Icon: DollarSign },
    { key: "exp",  label: "Total Expenses", amount: kpi.expenses,  pct: kpi.expPct, up: (kpi.expPct ?? "-")[0] !== "+", Icon: ShoppingBag },
    { key: "sav",  label: "Total Savings",  amount: kpi.savings,   pct: null,        up: kpi.savings >= 0,               Icon: Vault },
    { key: "bal",  label: "Total Balance",  amount: kpi.balance,   pct: null,        up: kpi.balance >= 0,               Icon: Building2 },
  ];

  return (
    <div className="kpi-grid">
      {cards.map(c => {
        const Icon = c.Icon;
        return (
          <div key={c.key} className={`kpi ${c.key}`}>
            <div className="kpi-ico"><Icon size={18} strokeWidth={1.8} /></div>
            <div className="kpi-lbl">{c.label}</div>
            <div className="kpi-amt">{formatCurrency(c.amount, currency)}</div>
            <div className="kpi-meta">
              <span className="kpi-sub">This Month</span>
              {c.pct && <span className={`badge ${c.up ? "up" : "dn"}`}>{c.pct}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
