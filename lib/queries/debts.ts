import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Debt } from "@/types";
type SB = SupabaseClient<Database>;

export async function fetchDebts(supabase: SB, userId: string): Promise<Debt[]> {
  const { data, error } = await supabase
    .from("debts").select("*").eq("user_id", userId).order("created_at");
  if (error) throw error;
  return (data ?? []) as Debt[];
}

export type DebtInsert = Omit<Debt, "id" | "created_at">;

export async function insertDebt(supabase: SB, d: DebtInsert) {
  const { error } = await supabase.from("debts").insert(d);
  if (error) throw error;
}
export async function updateDebt(supabase: SB, id: string, d: Partial<DebtInsert>) {
  const { error } = await supabase.from("debts").update(d).eq("id", id);
  if (error) throw error;
}
export async function deleteDebt(supabase: SB, id: string) {
  const { error } = await supabase.from("debts").delete().eq("id", id);
  if (error) throw error;
}
