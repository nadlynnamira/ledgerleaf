import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Transaction, Category, Account } from "@/types";

type SB = SupabaseClient<Database>;

export type TxRow = Transaction & { categories: { name: string; color: string | null } | null; accounts: { name: string } | null };

export async function fetchTransactions(supabase: SB, userId: string): Promise<TxRow[]> {
  const { data, error } = await supabase
    .from("transactions")
    .select("*, categories(name, color), accounts(name)")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as TxRow[];
}

export async function fetchCategories(supabase: SB, userId: string): Promise<Category[]> {
  const { data } = await supabase.from("categories").select("*").eq("user_id", userId).order("name");
  return (data ?? []) as Category[];
}

export async function fetchAccounts(supabase: SB, userId: string): Promise<Account[]> {
  const { data } = await supabase.from("accounts").select("*").eq("user_id", userId).order("name");
  return (data ?? []) as Account[];
}

export type TxInsert = {
  user_id: string;
  account_id: string;
  category_id: string | null;
  type: "income" | "expense";
  amount: number;
  description: string;
  date: string;
  notes: string | null;
  is_recurring: boolean;
};

export async function insertTransaction(supabase: SB, tx: TxInsert) {
  const { error } = await supabase.from("transactions").insert(tx);
  if (error) throw error;
}

export async function updateTransaction(supabase: SB, id: string, tx: Partial<TxInsert>) {
  const { error } = await supabase.from("transactions").update(tx).eq("id", id);
  if (error) throw error;
}

export async function deleteTransaction(supabase: SB, id: string) {
  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) throw error;
}
