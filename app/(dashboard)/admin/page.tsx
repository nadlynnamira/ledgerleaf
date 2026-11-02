import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminPage from "@/components/admin/AdminPage";
import { getAllLicenseKeys } from "@/lib/actions/license";

export default async function AdminRoute() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (user.email !== process.env.ADMIN_EMAIL) redirect("/");

  const keys = await getAllLicenseKeys();
  return <AdminPage keys={keys} />;
}
