import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardShell from "./DashboardShell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const userName = user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "User";
  const userEmail = user.email ?? "";
  const avatarUrl = user.user_metadata?.avatar_url ?? "";
  const isAdmin = userEmail === process.env.ADMIN_EMAIL;

  return (
    <DashboardShell userName={userName} userEmail={userEmail} userId={user.id} avatarUrl={avatarUrl} isAdmin={isAdmin}>
      {children}
    </DashboardShell>
  );
}
