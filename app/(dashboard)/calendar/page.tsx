import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CalendarPage from "@/components/calendar/CalendarPage";

export default async function CalendarRoute() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return <CalendarPage userId={user.id} />;
}
