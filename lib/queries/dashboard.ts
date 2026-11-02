import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, SavingsGoal } from "@/types";
import { fetchBills, getDaysUntilDue } from "@/lib/queries/bills";

const C = 408.41; // 2π × r=65
const COLOR_VARS = ["--c1", "--c2", "--c3", "--c4", "--c5", "--c6"];

export type KpiData = {
  income: number;
  expenses: number;
  savings: number;
  balance: number;
  incPct: string | null;
  expPct: string | null;
};

export type CategorySlice = {
  label: string;
  amount: number;
  pct: number;
  dashArr: string;
  offset: string;
  cVar: string;
};

export type WeekPoint = { label: string; amount: number };

export type BillRow = {
  id: string;
  name: string;
  amount: number;
  icon: string | null;
  frequency: string;
  daysUntilDue: number;
  kind: "bill" | "debt";
};

export type DashboardData = {
  kpi: KpiData;
  slices: CategorySlice[];
  weeks: WeekPoint[];
  bills: BillRow[];
  savingsGoals: SavingsGoal[];
  monthLabel: string;
};

function pctChange(curr: number, prev: number): string | null {
  if (prev === 0) return null;
  const diff = ((curr - prev) / prev) * 100;
  return (diff >= 0 ? "+" : "") + diff.toFixed(0) + "%";
}

export async function getDashboardData(
  supabase: SupabaseClient<Database>,
  userId: string,
  year: number,
  month: number
): Promise<DashboardData> {
  const pad = (n: number) => String(n).padStart(2, "0");
  const lastDay = new Date(year, month, 0).getDate();
  const from = `${year}-${pad(month)}-01`;
  const to = `${year}-${pad(month)}-${lastDay}`;

  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const prevLastDay = new Date(prevYear, prevMonth, 0).getDate();
  const prevFrom = `${prevYear}-${pad(prevMonth)}-01`;
  const prevTo = `${prevYear}-${pad(prevMonth)}-${prevLastDay}`;

  // 4-week window for spending trend (always last 28 days)
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - 27);
  const trendFrom = weekStart.toISOString().slice(0, 10);
  const trendTo = today.toISOString().slice(0, 10);

  const [
    { data: txns },
    { data: prevTxns },
    { data: accounts },
    { data: trendTxns },
    allBills,
    { data: savingsGoalsRaw },
    { data: debtsRaw },
  ] = await Promise.all([
    supabase
      .from("transactions")
      .select("amount, type, date, categories(name)")
      .eq("user_id", userId)
      .gte("date", from)
      .lte("date", to),
    supabase
      .from("transactions")
      .select("amount, type")
      .eq("user_id", userId)
      .gte("date", prevFrom)
      .lte("date", prevTo),
    supabase.from("accounts").select("balance").eq("user_id", userId),
    supabase
      .from("transactions")
      .select("amount, date")
      .eq("user_id", userId)
      .eq("type", "expense")
      .gte("date", trendFrom)
      .lte("date", trendTo),
    fetchBills(supabase as SupabaseClient<Database>, userId),
    supabase
      .from("savings_goals")
      .select("*")
      .eq("user_id", userId)
      .eq("is_achieved", false)
      .order("created_at")
      .limit(4),
    supabase
      .from("debts")
      .select("id, name, balance, due_date, type")
      .eq("user_id", userId)
      .eq("is_paid", false)
      .eq("type", "debt")
      .not("due_date", "is", null),
  ]);

  // KPIs
  const income = (txns ?? []).filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expenses = (txns ?? []).filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const savings = income - expenses;
  const balance = (accounts ?? []).reduce((s, a) => s + a.balance, 0);
  const prevIncome = (prevTxns ?? []).filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const prevExpenses = (prevTxns ?? []).filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  const kpi: KpiData = {
    income,
    expenses,
    savings,
    balance,
    incPct: pctChange(income, prevIncome),
    expPct: pctChange(expenses, prevExpenses),
  };

  // Category breakdown (donut)
  const catMap = new Map<string, number>();
  for (const t of txns ?? []) {
    if (t.type !== "expense") continue;
    const name = (t.categories as { name: string } | null)?.name ?? "Other";
    catMap.set(name, (catMap.get(name) ?? 0) + t.amount);
  }
  const catEntries = Array.from(catMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const catTotal = catEntries.reduce((s, [, v]) => s + v, 0) || 1;
  let cumArc = 0;
  const slices: CategorySlice[] = catEntries.map(([label, amount], i) => {
    const pct = amount / catTotal;
    const arc = pct * C;
    const dashArr = `${arc.toFixed(2)} ${(C - arc).toFixed(2)}`;
    const offset = (-cumArc).toFixed(2);
    cumArc += arc;
    return { label, amount, pct: Math.round(pct * 100), dashArr, offset, cVar: COLOR_VARS[i] ?? "--c6" };
  });

  // Weekly spending trend (4 weeks × 7 days)
  const weeks: WeekPoint[] = Array.from({ length: 4 }, (_, i) => {
    const wEnd = new Date(today);
    wEnd.setDate(today.getDate() - (3 - i) * 7);
    const wStart = new Date(wEnd);
    wStart.setDate(wEnd.getDate() - 6);
    const wFromStr = wStart.toISOString().slice(0, 10);
    const wToStr = wEnd.toISOString().slice(0, 10);
    const total = (trendTxns ?? [])
      .filter((t) => t.date >= wFromStr && t.date <= wToStr)
      .reduce((s, t) => s + t.amount, 0);
    return { label: `Week ${i + 1}`, amount: total };
  });

  // Upcoming bills + debts — merged and sorted by nearest due date
  const billRows: BillRow[] = (allBills ?? [])
    .filter((b) => b.is_active)
    .map((b) => ({
      id: b.id,
      name: b.name,
      amount: b.amount,
      icon: b.icon ?? null,
      frequency: b.frequency,
      daysUntilDue: getDaysUntilDue(b.due_day, b.frequency),
      kind: "bill" as const,
    }));

  const debtRows: BillRow[] = (debtsRaw ?? [])
    .map((d) => {
      const daysLeft = Math.ceil((new Date(d.due_date).getTime() - today.getTime()) / 86400000);
      return {
        id: d.id,
        name: d.name,
        amount: d.balance,
        icon: d.type === "loan" ? "🤝" : "💳",
        frequency: "one-time",
        daysUntilDue: daysLeft,
        kind: "debt" as const,
      };
    });

  const bills: BillRow[] = [...billRows, ...debtRows]
    .sort((a, b) => a.daysUntilDue - b.daysUntilDue)
    .slice(0, 8);

  const monthLabel = new Date(year, month - 1).toLocaleString("en-US", { month: "long", year: "numeric" });

  const savingsGoals = (savingsGoalsRaw ?? []) as SavingsGoal[];

  return { kpi, slices, weeks, bills, savingsGoals, monthLabel };
}
