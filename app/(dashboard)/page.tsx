import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getDashboardData } from "@/lib/queries/dashboard";
import KpiCards from "@/components/dashboard/KpiCards";
import BudgetDonut from "@/components/dashboard/BudgetDonut";
import SpendingTrend from "@/components/dashboard/SpendingTrend";
import UpcomingBills from "@/components/dashboard/UpcomingBills";
import SavingsGoals from "@/components/dashboard/SavingsGoals";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const now = new Date();
  const data = await getDashboardData(supabase, user.id, now.getFullYear(), now.getMonth() + 1);

  return (
    <>
      <div className="quote">🌿 A budget is telling your money where to go instead of wondering where it went. 💗</div>
      <KpiCards kpi={data.kpi} />
      <div className="charts-row">
        <BudgetDonut slices={data.slices} total={data.kpi.expenses} monthLabel={data.monthLabel} />
        <SpendingTrend weeks={data.weeks} />
      </div>
      <div className="bottom-row">
        <UpcomingBills bills={data.bills} monthLabel={data.monthLabel} />
        <SavingsGoals goals={data.savingsGoals} />
      </div>
    </>
  );
}
