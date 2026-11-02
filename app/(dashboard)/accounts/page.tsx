import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AccountsPage from "@/components/accounts/AccountsPage";

export default async function AccountsRoute() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return <AccountsPage userId={user.id} />;
}
