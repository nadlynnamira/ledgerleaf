import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, SavingsGoal } from "@/types";

type SB = SupabaseClient<Database>;

export async function fetchSavingsGoals(supabase: SB, userId: string): Promise<SavingsGoal[]> {
  const { data, error } = await supabase
    .from("savings_goals")
    .select("*")
    .eq("user_id", userId)
    .order("created_at");
  if (error) throw error;
  return (data ?? []) as SavingsGoal[];
}

export type GoalInsert = {
  user_id: string;
  name: string;
  target_amount: number;
  saved_amount: number;
  icon?: string | null;
  color?: string | null;
  deadline?: string | null;
  notes?: string | null;
  is_achieved?: boolean;
};

export async function insertGoal(supabase: SB, goal: GoalInsert) {
  const { error } = await supabase.from("savings_goals").insert(goal);
  if (error) throw error;
}

export async function updateGoal(supabase: SB, id: string, goal: Partial<GoalInsert>) {
  const { error } = await supabase.from("savings_goals").update(goal).eq("id", id);
  if (error) throw error;
}

export async function deleteGoal(supabase: SB, id: string) {
  const { error } = await supabase.from("savings_goals").delete().eq("id", id);
  if (error) throw error;
}
