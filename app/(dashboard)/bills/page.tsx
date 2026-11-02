import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BillsPage from "@/components/bills/BillsPage";

export default async function BillsRoute() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return <BillsPage userId={user.id} />;
}
