import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Asset } from "@/types";
type SB = SupabaseClient<Database>;

export async function fetchAssets(supabase: SB, userId: string): Promise<Asset[]> {
  const { data, error } = await supabase
    .from("assets").select("*").eq("user_id", userId).order("created_at");
  if (error) throw error;
  return (data ?? []) as Asset[];
}

export type AssetInsert = Omit<Asset, "id" | "created_at">;

export async function insertAsset(supabase: SB, a: AssetInsert) {
  const { error } = await supabase.from("assets").insert(a);
  if (error) throw error;
}
export async function updateAsset(supabase: SB, id: string, a: Partial<AssetInsert>) {
  const { error } = await supabase.from("assets").update(a).eq("id", id);
  if (error) throw error;
}
export async function deleteAsset(supabase: SB, id: string) {
  const { error } = await supabase.from("assets").delete().eq("id", id);
  if (error) throw error;
}
