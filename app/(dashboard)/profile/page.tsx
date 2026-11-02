import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProfilePage from "@/components/profile/ProfilePage";
import { getUserActivationCode } from "@/lib/actions/license";

export default async function ProfileRoute() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const userName = user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "User";
  const avatarUrl = user.user_metadata?.avatar_url ?? "";
  const activationCode = await getUserActivationCode(user.id);
  return (
    <ProfilePage
      userId={user.id}
      userName={userName}
      userEmail={user.email ?? ""}
      createdAt={user.created_at}
      avatarUrl={avatarUrl}
      activationCode={activationCode ?? undefined}
    />
  );
}
