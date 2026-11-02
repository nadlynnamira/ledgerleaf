"use server";
import { createClient } from "@/lib/supabase/server";

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const seg = (n: number) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `LEAF-${seg(4)}-${seg(4)}-${seg(4)}`;
}

export async function generateLicenseCode(): Promise<{ code?: string; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== process.env.ADMIN_EMAIL) return { error: "Unauthorized" };

  let code = generateCode();
  // retry up to 5 times in the unlikely event of collision
  for (let i = 0; i < 5; i++) {
    const { error } = await supabase.from("license_keys").insert({ code });
    if (!error) return { code };
    code = generateCode();
  }
  return { error: "Failed to generate unique code. Try again." };
}

export async function redeemLicenseCode(inputCode: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const trimmed = inputCode.trim().toUpperCase();
  const { data: key } = await supabase
    .from("license_keys")
    .select("id, is_used")
    .eq("code", trimmed)
    .single();

  if (!key) return { error: "Invalid activation code. Please check and try again." };
  if (key.is_used) return { error: "This code has already been used." };

  // Mark the code as used
  const { error: updateErr } = await supabase
    .from("license_keys")
    .update({ is_used: true, used_by_user_id: user.id, used_at: new Date().toISOString() })
    .eq("id", key.id);
  if (updateErr) return { error: updateErr.message };

  // Mark user as activated in their metadata
  await supabase.auth.updateUser({ data: { is_activated: true, activation_code: trimmed } });

  return {};
}

export async function getUserActivationCode(userId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("license_keys")
    .select("code")
    .eq("used_by_user_id", userId)
    .single();
  return data?.code ?? null;
}

export async function getAllLicenseKeys() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== process.env.ADMIN_EMAIL) return [];
  const { data } = await supabase
    .from("license_keys")
    .select("*")
    .order("created_at", { ascending: false });
  return data ?? [];
}
