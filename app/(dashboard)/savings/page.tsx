import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SavingsPage from "@/components/savings/SavingsPage";

export default async function SavingsRoute() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return <SavingsPage userId={user.id} />;
}
