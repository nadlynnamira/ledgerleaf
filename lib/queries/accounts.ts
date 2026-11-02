import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Account } from "@/types";

type SB = SupabaseClient<Database>;

export async function fetchAccounts(supabase: SB, userId: string): Promise<Account[]> {
  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Account[];
}

export type AccInsert = {
  user_id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  color: string | null;
};

export async function insertAccount(supabase: SB, acc: AccInsert) {
  const { error } = await supabase.from("accounts").insert(acc);
  if (error) throw error;
}

export async function updateAccount(supabase: SB, id: string, acc: Partial<AccInsert>) {
  const { error } = await supabase.from("accounts").update(acc).eq("id", id);
  if (error) throw error;
}

export async function deleteAccount(supabase: SB, id: string) {
  const { error } = await supabase.from("accounts").delete().eq("id", id);
  if (error) throw error;
}
