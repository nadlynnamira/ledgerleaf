import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Budget, Category } from "@/types";

type SB = SupabaseClient<Database>;

export type BudgetRow = Budget & {
  categories: Pick<Category, "name" | "color" | "icon" | "type"> | null;
};

export async function fetchBudgets(
  supabase: SB,
  userId: string,
  month: number,
  year: number,
): Promise<BudgetRow[]> {
  const { data, error } = await supabase
    .from("budgets")
    .select("*, categories(name, color, icon, type)")
    .eq("user_id", userId)
    .eq("month", month)
    .eq("year", year)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as BudgetRow[];
}

export async function fetchCategorySpending(
  supabase: SB,
  userId: string,
  month: number,
  year: number,
): Promise<Record<string, number>> {
  const daysInMonth = new Date(year, month, 0).getDate();
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const end   = `${year}-${String(month).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;

  const { data, error } = await supabase
    .from("transactions")
    .select("category_id, amount")
    .eq("user_id", userId)
    .eq("type", "expense")
    .gte("date", start)
    .lte("date", end)
    .not("category_id", "is", null);
  if (error) throw error;

  const map: Record<string, number> = {};
  for (const tx of data ?? []) {
    if (tx.category_id) map[tx.category_id] = (map[tx.category_id] ?? 0) + tx.amount;
  }
  return map;
}

export async function fetchExpenseCategories(supabase: SB, userId: string): Promise<Category[]> {
  const { data } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", userId)
    .eq("type", "expense")
    .order("name");
  return (data ?? []) as Category[];
}

export type BudgetInsert = { user_id: string; category_id: string; amount: number; month: number; year: number };

export async function upsertBudget(supabase: SB, payload: BudgetInsert) {
  const { error } = await supabase.from("budgets").upsert(payload, {
    onConflict: "user_id,category_id,month,year",
  });
  if (error) throw error;
}

export async function deleteBudget(supabase: SB, id: string) {
  const { error } = await supabase.from("budgets").delete().eq("id", id);
  if (error) throw error;
}
