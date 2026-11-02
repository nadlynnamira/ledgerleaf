import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BudgetPage from "@/components/budget/BudgetPage";

export default async function BudgetRoute() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return <BudgetPage userId={user.id} />;
}
