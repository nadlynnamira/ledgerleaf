"use client";
import Link from "next/link";
import { useUI } from "@/store/ui";
import { formatCurrency } from "@/lib/utils";
import type { SavingsGoal } from "@/types";

export default function SavingsGoals({ goals }: { goals: SavingsGoal[] }) {
  const { currency } = useUI();

  return (
    <div className="card">
      <div className="card-ttl">
        Savings Goals
        <Link href="/savings" className="card-link">View all</Link>
      </div>
      {goals.length === 0 ? (
        <div style={{ padding: "1.5rem 0", textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🎯</div>
          <p style={{ color: "var(--t3)", fontSize: 13 }}>No active savings goals yet.</p>
          <Link href="/savings" style={{ fontSize: 12, color: "var(--p)", fontWeight: 700 }}>+ Add your first goal</Link>
        </div>
      ) : (
        goals.map(g => {
          const pct = g.target_amount > 0 ? Math.min((g.saved_amount / g.target_amount) * 100, 100) : 0;
          const clr = g.color ?? "var(--p)";
          return (
            <div key={g.id} className="goal">
              <div className="goal-hd">
                <span className="goal-name">{g.icon ?? "🎯"} {g.name}</span>
                <span className="goal-amts">
                  {formatCurrency(g.saved_amount, currency)} / {formatCurrency(g.target_amount, currency)}
                </span>
              </div>
              <div className="goal-track">
                <div className="goal-fill" style={{ width: `${pct}%`, background: clr }} />
              </div>
              <div className="goal-ft">
                <span className="goal-pct">{Math.round(pct)}%</span>
                <span className="goal-rem">{formatCurrency(g.target_amount - g.saved_amount, currency)} left</span>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
