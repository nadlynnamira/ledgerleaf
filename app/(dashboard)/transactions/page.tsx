import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import TransactionPage from "@/components/transactions/TransactionPage";

export default async function TransactionsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { q } = await searchParams;
  return <TransactionPage userId={user.id} initialSearch={q ?? ""} />;
}
