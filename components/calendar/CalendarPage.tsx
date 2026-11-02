"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUI } from "@/store/ui";
import { formatCurrency } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Bill } from "@/types";
import { fetchBills, getDaysUntilDue } from "@/lib/queries/bills";

type Transaction = { id: string; date: string; description: string; amount: number; type: string };
type SavingsGoal = { id: string; name: string; deadline: string | null };
type Debt = { id: string; name: string; balance: number; due_date: string; type: string };

type DayEvent = {
  type: "transaction" | "bill" | "savings" | "debt";
  label: string;
  amount?: number;
  txType?: string;
  debtType?: "debt" | "loan";
  color?: string;
};

export default function CalendarPage({ userId }: { userId: string }) {
  const { currency } = useUI();
  const supabase = createClient();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-indexed
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<{ date: string; events: DayEvent[] } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const pad = (n: number) => String(n).padStart(2, "0");
    const firstDay = `${year}-${pad(month + 1)}-01`;
    const lastDay = new Date(year, month + 1, 0);
    const lastDate = `${year}-${pad(month + 1)}-${pad(lastDay.getDate())}`;

    const [{ data: txns }, billsData, { data: goalsData }, { data: debtsData }] = await Promise.all([
      supabase.from("transactions").select("id,date,description,amount,type")
        .eq("user_id", userId).gte("date", firstDay).lte("date", lastDate),
      fetchBills(supabase, userId),
      supabase.from("savings_goals").select("id,name,deadline").eq("user_id", userId).not("deadline", "is", null),
      supabase.from("debts").select("id,name,balance,due_date,type").eq("user_id", userId).eq("is_paid", false).not("due_date", "is", null),
    ]);
    setTransactions((txns ?? []) as Transaction[]);
    setBills(billsData.filter(b => b.is_active));
    setGoals((goalsData ?? []) as SavingsGoal[]);
    setDebts((debtsData ?? []) as Debt[]);
    setLoading(false);
  }, [userId, year, month]);

  useEffect(() => { load(); }, [load]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = new Date(year, month, 1).getDay(); // 0=Sun

  function getEventsForDay(day: number): DayEvent[] {
    const pad = (n: number) => String(n).padStart(2, "0");
    const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`;
    const events: DayEvent[] = [];

    for (const t of transactions) {
      if (t.date === dateStr) {
        events.push({ type: "transaction", label: t.description, amount: t.amount, txType: t.type });
      }
    }

    for (const b of bills) {
      const nextDue = getDayInMonth(b.due_day, year, month);
      if (nextDue === day) {
        events.push({ type: "bill", label: b.name, amount: b.amount, color: b.color ?? undefined });
      }
    }

    for (const g of goals) {
      if (g.deadline && g.deadline.startsWith(dateStr.substring(0, 7))) {
        const deadlineDay = parseInt(g.deadline.split("-")[2]);
        if (deadlineDay === day) {
          events.push({ type: "savings", label: g.name });
        }
      }
    }

    for (const d of debts) {
      if (d.due_date === dateStr) {
        events.push({ type: "debt", label: d.name, amount: d.balance, debtType: d.type as "debt" | "loan" });
      }
    }

    return events;
  }

  function getDayInMonth(dueDay: number, y: number, m: number): number {
    const lastDay = new Date(y, m + 1, 0).getDate();
    return Math.min(dueDay, lastDay);
  }

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  const monthName = new Date(year, month).toLocaleString("en-US", { month: "long" });
  const isToday = (day: number) => day === now.getDate() && month === now.getMonth() && year === now.getFullYear();

  function openDay(day: number) {
    const pad = (n: number) => String(n).padStart(2, "0");
    const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`;
    setSelected({ date: dateStr, events: getEventsForDay(day) });
  }

  return (
    <div>
      <div className="pg-hdr">
        <div>
          <h2 className="pg-h2">Calendar</h2>
          <p className="pg-sub">Transactions, bills due, and savings deadlines</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button className="cal-nav-btn" onClick={prevMonth} aria-label="Previous month"><ChevronLeft size={16} /></button>
          <span style={{ fontWeight: 600, fontSize: 15, minWidth: 130, textAlign: "center" }}>{monthName} {year}</span>
          <button className="cal-nav-btn" onClick={nextMonth} aria-label="Next month"><ChevronRight size={16} /></button>
        </div>
      </div>

      {loading ? (
        <p style={{ color: "var(--t3)", fontSize: 13 }}>Loading…</p>
      ) : (
        <>
          <div className="cal-grid">
            {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
              <div key={d} className="cal-dow">{d}</div>
            ))}
            {Array.from({ length: firstWeekday }).map((_, i) => (
              <div key={`e${i}`} className="cal-day empty" />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
              const events = getEventsForDay(day);
              const hasIncome = events.some(e => e.txType === "income");
              const hasExpense = events.some(e => e.txType === "expense");
              const hasBill = events.some(e => e.type === "bill");
              const hasSavings = events.some(e => e.type === "savings");
              const hasDebt = events.some(e => e.type === "debt");
              return (
                <div key={day} className={`cal-day${isToday(day) ? " today" : ""}${events.length > 0 ? " has-events" : ""}`}
                  onClick={() => events.length > 0 && openDay(day)}>
                  <span className="cal-day-num">{day}</span>
                  <div className="cal-dots">
                    {hasIncome && <span className="cal-dot income" />}
                    {hasExpense && <span className="cal-dot expense" />}
                    {hasBill && <span className="cal-dot bill" />}
                    {hasSavings && <span className="cal-dot savings" />}
                    {hasDebt && <span className="cal-dot debt" />}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="cal-legend">
            <span><span className="cal-dot income" /> Income</span>
            <span><span className="cal-dot expense" /> Expense</span>
            <span><span className="cal-dot bill" /> Bill due</span>
            <span><span className="cal-dot savings" /> Goal deadline</span>
            <span><span className="cal-dot debt" /> Debt due</span>
          </div>
        </>
      )}

      {selected && (
        <div className="modal-bg" onClick={e => { if (e.target === e.currentTarget) setSelected(null); }}>
          <div className="modal" style={{ maxWidth: 380 }}>
            <div className="modal-hdr">
              <h3>{new Date(selected.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</h3>
              <button className="modal-close" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "4px 0 8px" }}>
              {selected.events.length === 0 ? (
                <p style={{ color: "var(--t3)", fontSize: 13 }}>No events.</p>
              ) : selected.events.map((ev, i) => (
                <div key={i} className={`cal-ev-row ${ev.type}`}>
                  <span className="cal-ev-ico">
                    {ev.type === "transaction" ? (ev.txType === "income" ? "💰" : "💸") : ev.type === "bill" ? "📅" : ev.type === "debt" ? (ev.debtType === "loan" ? "🤝" : "💳") : "🎯"}
                  </span>
                  <span className="cal-ev-lbl">{ev.label}</span>
                  {ev.amount != null && (
                    <span className="cal-ev-amt" style={{
                      color: ev.txType === "income" ? "var(--gr)"
                        : ev.debtType === "loan" ? "var(--gr)"
                        : ev.type === "bill" || ev.type === "debt" ? "var(--rd)"
                        : "var(--t2)"
                    }}>
                      {ev.txType === "income" || ev.debtType === "loan" ? "+" : "−"}
                      {formatCurrency(ev.amount, currency)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
