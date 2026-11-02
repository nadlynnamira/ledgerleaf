import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CategoriesPage from "@/components/categories/CategoriesPage";

export default async function CategoriesRoute() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return <CategoriesPage userId={user.id} />;
}
