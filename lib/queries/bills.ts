import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Bill } from "@/types";

type SB = SupabaseClient<Database>;

export async function fetchBills(supabase: SB, userId: string): Promise<Bill[]> {
  const { data, error } = await supabase
    .from("bills")
    .select("*")
    .eq("user_id", userId)
    .order("due_day");
  if (error) throw error;
  return (data ?? []) as Bill[];
}

export type BillInsert = {
  user_id: string;
  name: string;
  amount: number;
  due_day: number;
  frequency: "weekly" | "monthly" | "quarterly" | "yearly";
  category_id?: string | null;
  account_id?: string | null;
  is_active?: boolean;
  icon?: string | null;
  color?: string | null;
  notes?: string | null;
};

export async function insertBill(supabase: SB, bill: BillInsert) {
  const { error } = await supabase.from("bills").insert(bill);
  if (error) throw error;
}

export async function updateBill(supabase: SB, id: string, bill: Partial<BillInsert>) {
  const { error } = await supabase.from("bills").update(bill).eq("id", id);
  if (error) throw error;
}

export async function deleteBill(supabase: SB, id: string) {
  const { error } = await supabase.from("bills").delete().eq("id", id);
  if (error) throw error;
}

export function getNextDueDate(dueDay: number, frequency: Bill["frequency"]): Date {
  const today = new Date();
  const now = today.getDate();
  let next = new Date(today.getFullYear(), today.getMonth(), dueDay);

  if (frequency === "monthly") {
    if (next <= today) next.setMonth(next.getMonth() + 1);
  } else if (frequency === "weekly") {
    next = new Date();
    next.setDate(today.getDate() + (7 - today.getDay() + dueDay) % 7 || 7);
  } else if (frequency === "quarterly") {
    if (next <= today) next.setMonth(next.getMonth() + 3);
  } else if (frequency === "yearly") {
    if (next <= today) next.setFullYear(next.getFullYear() + 1);
  }
  return next;
}

export function getDaysUntilDue(dueDay: number, frequency: Bill["frequency"]): number {
  const next = getNextDueDate(dueDay, frequency);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  next.setHours(0, 0, 0, 0);
  return Math.round((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}
