import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AssetsPage from "@/components/assets/AssetsPage";

export default async function AssetsRoute() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return <AssetsPage userId={user.id} />;
}
