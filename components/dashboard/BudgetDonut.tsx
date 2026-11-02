"use client";
import { useUI } from "@/store/ui";
import { formatCurrency } from "@/lib/utils";
import type { CategorySlice } from "@/lib/queries/dashboard";

type Props = { slices: CategorySlice[]; total: number; monthLabel: string };

export default function BudgetDonut({ slices, total, monthLabel }: Props) {
  const { currency } = useUI();

  return (
    <div className="card">
      <div className="card-ttl">Budget Overview <span className="card-sub">{monthLabel}</span></div>
      <div className="donut-wrap">
        <div className="donut-rel">
          <svg width="148" height="148" viewBox="0 0 200 200" role="img" aria-label="Budget by category">
            {slices.length === 0 ? (
              <circle cx="100" cy="100" r="65" fill="none" stroke="var(--bdr2)" strokeWidth="28" />
            ) : slices.map((s) => (
              <circle
                key={s.label}
                cx="100" cy="100" r="65"
                fill="none"
                stroke={`var(${s.cVar})`}
                strokeWidth="28"
                strokeDasharray={s.dashArr}
                strokeDashoffset={s.offset}
                transform="rotate(-90 100 100)"
              />
            ))}
          </svg>
          <div className="donut-ctr">
            <div className="dc-amt" style={{ fontSize: formatCurrency(total, currency).length > 8 ? 9 : formatCurrency(total, currency).length > 6 ? 11 : 13 }}>
              {formatCurrency(total, currency)}
            </div>
            <div className="dc-lbl">Total Exp.</div>
          </div>
        </div>
        <div className="lgnd">
          {slices.length === 0 ? (
            <p style={{ color: "var(--t3)", fontSize: "0.8rem" }}>No expenses yet</p>
          ) : slices.map(s => (
            <div key={s.label} className="lg-row">
              <div className="lg-dot" style={{ background: `var(${s.cVar})` }} />
              <span className="lg-name">{s.label}</span>
              <span className="lg-pct">{s.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
