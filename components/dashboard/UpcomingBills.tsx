"use client";
import { useUI } from "@/store/ui";
import { formatCurrency } from "@/lib/utils";
import type { BillRow } from "@/lib/queries/dashboard";

type Props = { bills: BillRow[]; monthLabel: string };

function dueBadge(days: number) {
  if (days < 0) return { label: `${Math.abs(days)}d overdue`, cls: "chip overdue" };
  if (days === 0) return { label: "Today", cls: "chip today" };
  if (days === 1) return { label: "Tomorrow", cls: "chip up" };
  if (days <= 7) return { label: `In ${days} days`, cls: "chip up" };
  return { label: `In ${days} days`, cls: "chip ok" };
}

function freqLabel(f: string) {
  if (f === "one-time") return "One-time";
  return f.charAt(0).toUpperCase() + f.slice(1);
}

export default function UpcomingBills({ bills }: Props) {
  const { currency } = useUI();

  return (
    <div className="card">
      <div className="card-ttl">Upcoming Payments</div>
      {bills.length === 0 ? (
        <p style={{ color: "var(--t3)", fontSize: "0.85rem", padding: "1rem 0" }}>No upcoming bills or debts.</p>
      ) : (
        <table className="bt">
          <thead>
            <tr><th>Name</th><th>Type</th><th>Amount</th><th>Due</th></tr>
          </thead>
          <tbody>
            {bills.map(b => {
              const badge = dueBadge(b.daysUntilDue);
              return (
                <tr key={b.id}>
                  <td className="bn">{b.icon ? `${b.icon} ${b.name}` : b.name}</td>
                  <td className="bd" style={{ color: "var(--t3)", fontSize: 12 }}>
                    {b.kind === "debt" ? <span style={{ color: "var(--rd)", fontWeight: 500 }}>Debt</span> : freqLabel(b.frequency)}
                  </td>
                  <td className="ba">{formatCurrency(b.amount, currency)}</td>
                  <td><span className={badge.cls}>{badge.label}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
