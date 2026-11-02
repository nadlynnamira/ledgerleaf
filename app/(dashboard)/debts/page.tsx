import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DebtsPage from "@/components/debts/DebtsPage";

export default async function DebtsRoute() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return <DebtsPage userId={user.id} />;
}
