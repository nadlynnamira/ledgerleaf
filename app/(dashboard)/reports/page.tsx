import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ReportsPage from "@/components/reports/ReportsPage";

export default async function ReportsRoute() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return <ReportsPage userId={user.id} />;
}
