"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUI } from "@/store/ui";
import { formatCurrency, getPastMonths } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const MONTHS = getPastMonths(13);
const PIE_COLORS = ["#16a34a","#0d9488","#2563eb","#7c3aed","#db2777","#ea580c","#ca8a04","#64748b"];

type MonthlyRow = { month: string; income: number; expenses: number; savings: number };
type CatRow = { name: string; amount: number };

function parseYM(value: string) {
  const [y, m] = value.split("-").map(Number);
  return { year: y, month: m };
}

export default function ReportsPage({ userId }: { userId: string }) {
  const { currency } = useUI();
  const supabase = createClient();

  const [endMonth, setEndMonth] = useState(MONTHS[0]?.value ?? "");
  const [monthOpen, setMonthOpen] = useState(false);
  const [monthly, setMonthly] = useState<MonthlyRow[]>([]);
  const [catData, setCatData] = useState<CatRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { year, month } = parseYM(endMonth);

    // Build last 6 months range
    const ranges: { label: string; from: string; to: string }[] = [];
    for (let i = 5; i >= 0; i--) {
      let m = month - i; let y = year;
      if (m <= 0) { m += 12; y -= 1; }
      const pad = (n: number) => String(n).padStart(2, "0");
      const lastDay = new Date(y, m, 0).getDate();
      ranges.push({ label: new Date(y, m - 1).toLocaleString("en-US", { month: "short" }), from: `${y}-${pad(m)}-01`, to: `${y}-${pad(m)}-${lastDay}` });
    }

    const { data: txns } = await supabase
      .from("transactions")
      .select("amount, type, date, categories(name)")
      .eq("user_id", userId)
      .gte("date", ranges[0].from)
      .lte("date", ranges[5].to);

    const rows: MonthlyRow[] = ranges.map(r => {
      const slice = (txns ?? []).filter(t => t.date >= r.from && t.date <= r.to);
      const income   = slice.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
      const expenses = slice.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
      return { month: r.label, income, expenses, savings: income - expenses };
    });
    setMonthly(rows);

    // Category breakdown for selected month
    const pad = (n: number) => String(n).padStart(2, "0");
    const lastDay = new Date(year, month, 0).getDate();
    const from = `${year}-${pad(month)}-01`;
    const to = `${year}-${pad(month)}-${lastDay}`;
    const monthTxns = (txns ?? []).filter(t => t.date >= from && t.date <= to && t.type === "expense");
    const catMap = new Map<string, number>();
    for (const t of monthTxns) {
      const name = (t.categories as { name: string } | null)?.name ?? "Other";
      catMap.set(name, (catMap.get(name) ?? 0) + t.amount);
    }
    setCatData(Array.from(catMap.entries()).sort((a, b) => b[1] - a[1]).map(([name, amount]) => ({ name, amount })));
    setLoading(false);
  }, [userId, endMonth]);

  useEffect(() => { load(); }, [load]);

  const selectedLabel = MONTHS.find(m => m.value === endMonth)?.label ?? "";
  const latestRow = monthly[monthly.length - 1];
  const totalIncome = monthly.reduce((s, r) => s + r.income, 0);
  const totalExp = monthly.reduce((s, r) => s + r.expenses, 0);
  const totalSav = totalIncome - totalExp;

  return (
    <div>
      <div className="pg-hdr">
        <div>
          <h2 className="pg-h2">Reports</h2>
          <p className="pg-sub">6-month overview ending {selectedLabel}</p>
        </div>
        <div className="bgt-month-wrap">
          <select className="bgt-month-sel" value={endMonth} onChange={e => setEndMonth(e.target.value)}>
            {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <ChevronDown size={12} className="bgt-month-chev" />
        </div>
      </div>

      {/* KPI strip */}
      <div className="rpt-kpis">
        {[
          { label: "6-mo Income", val: totalIncome, clr: "var(--gr)" },
          { label: "6-mo Expenses", val: totalExp, clr: "var(--rd)" },
          { label: "6-mo Savings", val: totalSav, clr: totalSav >= 0 ? "var(--gr)" : "var(--rd)" },
          { label: `${selectedLabel} Income`, val: latestRow?.income ?? 0, clr: "var(--p)" },
          { label: `${selectedLabel} Expenses`, val: latestRow?.expenses ?? 0, clr: "var(--p)" },
        ].map(k => (
          <div key={k.label} className="rpt-kpi">
            <span className="rpt-kpi-lbl">{k.label}</span>
            <span className="rpt-kpi-val" style={{ color: k.clr }}>{formatCurrency(k.val, currency)}</span>
          </div>
        ))}
      </div>

      {loading ? (
        <p style={{ color: "var(--t3)", fontSize: 13, padding: "2rem 0" }}>Loading…</p>
      ) : (
        <div className="rpt-grid">
          {/* Bar chart */}
          <div className="rpt-card">
            <div className="rpt-card-ttl">Income vs Expenses</div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthly} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barCategoryGap="28%">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--bdr)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--t3)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "var(--t3)" }} axisLine={false} tickLine={false}
                  tickFormatter={v => formatCurrency(v, currency).replace(/\.00$/, "")} width={64} />
                <Tooltip
                  contentStyle={{ background: "var(--card)", border: "1.5px solid var(--bdr)", borderRadius: 10, fontSize: 12 }}
                  formatter={(v: number) => formatCurrency(v, currency)}
                />
                <Bar dataKey="income" name="Income" fill="var(--gr)" radius={[4,4,0,0]} />
                <Bar dataKey="expenses" name="Expenses" fill="var(--rd)" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Savings trend */}
          <div className="rpt-card">
            <div className="rpt-card-ttl">Net Savings by Month</div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthly} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--bdr)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--t3)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "var(--t3)" }} axisLine={false} tickLine={false}
                  tickFormatter={v => formatCurrency(v, currency).replace(/\.00$/, "")} width={64} />
                <Tooltip
                  contentStyle={{ background: "var(--card)", border: "1.5px solid var(--bdr)", borderRadius: 10, fontSize: 12 }}
                  formatter={(v: number) => formatCurrency(v, currency)}
                />
                <Bar dataKey="savings" name="Savings" radius={[4,4,0,0]}
                  fill="var(--p)"
                  label={false}
                >
                  {monthly.map((entry, i) => (
                    <Cell key={i} fill={entry.savings >= 0 ? "var(--gr)" : "var(--rd)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie chart */}
          <div className="rpt-card">
            <div className="rpt-card-ttl">Spending by Category — {selectedLabel}</div>
            {catData.length === 0 ? (
              <div className="acc-empty" style={{ padding: "2rem 0" }}>
                <div className="acc-empty-ico">📭</div>
                <p className="acc-empty-sub">No expense transactions for {selectedLabel}.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <PieChart margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                  <Pie data={catData} dataKey="amount" nameKey="name" cx="50%" cy="50%"
                    outerRadius={90} innerRadius={50} paddingAngle={3}
                    label={({ name, percent }: { name: string; percent: number }) => `${name} ${Math.round(percent * 100)}%`}
                    labelLine={true}
                  >
                    {catData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: "var(--card)", border: "1.5px solid var(--bdr)", borderRadius: 10, fontSize: 12 }}
                    formatter={(v: number) => formatCurrency(v, currency)}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Table breakdown */}
          <div className="rpt-card">
            <div className="rpt-card-ttl">Category Breakdown — {selectedLabel}</div>
            {catData.length === 0 ? (
              <p style={{ color: "var(--t3)", fontSize: 13, padding: "1rem 0" }}>No data.</p>
            ) : (
              <div className="rpt-table">
                {catData.map((c, i) => {
                  const total = catData.reduce((s, x) => s + x.amount, 0);
                  const pct = Math.round((c.amount / total) * 100);
                  return (
                    <div key={c.name} className="rpt-row">
                      <div className="rpt-cat-dot" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="rpt-cat-name">{c.name}</span>
                      <div className="rpt-bar-wrap">
                        <div className="rpt-bar" style={{ width: `${pct}%`, background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      </div>
                      <span className="rpt-cat-pct">{pct}%</span>
                      <span className="rpt-cat-amt">{formatCurrency(c.amount, currency)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
