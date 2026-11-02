import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Category } from "@/types";

type SB = SupabaseClient<Database>;

export async function fetchCategories(supabase: SB, userId: string): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", userId)
    .order("name");
  if (error) throw error;
  return (data ?? []) as Category[];
}

export type CatInsert = {
  user_id: string;
  name: string;
  type: "income" | "expense";
  color: string | null;
  icon: string | null;
  is_default?: boolean;
};

export async function insertCategory(supabase: SB, cat: CatInsert) {
  const { error } = await supabase.from("categories").insert(cat);
  if (error) throw error;
}

export async function updateCategory(supabase: SB, id: string, cat: Partial<CatInsert>) {
  const { error } = await supabase.from("categories").update(cat).eq("id", id);
  if (error) throw error;
}

export async function deleteCategory(supabase: SB, id: string) {
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw error;
}
