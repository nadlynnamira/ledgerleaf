"use client";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useUI } from "@/store/ui";
import { getPastMonths } from "@/lib/utils";
import Sidebar from "@/components/shared/Sidebar";
import Topbar from "@/components/shared/Topbar";
import SettingsModal from "@/components/shared/SettingsModal";
import InstallPWA from "@/components/shared/InstallPWA";

const PAGE_TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/transactions": "Transactions",
  "/bills": "Bills & Subscriptions",
  "/budget": "Budget",
  "/savings": "Savings Goals",
  "/reports": "Reports",
  "/categories": "Categories & Tags",
  "/accounts": "Accounts",
  "/debts": "Debts & Loans",
  "/assets": "Assets & Liabilities",
  "/calendar": "Calendar",
  "/profile": "Profile",
  "/admin": "Admin",
};

export default function DashboardShell({
  userName, userEmail, userId, avatarUrl, isAdmin, children,
}: {
  userName: string; userEmail: string; userId: string; avatarUrl?: string; isAdmin?: boolean; children: React.ReactNode;
}) {
  const { theme, setCurrency } = useUI();
  const pathname = usePathname();
  const pageTitle = PAGE_TITLES[pathname] ?? "";
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const months = getPastMonths(25);
  const [selectedMonth, setSelectedMonth] = useState(months[0]?.value ?? "");

  // Apply saved theme on mount
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Restore currency from Supabase user_metadata on login
  useEffect(() => {
    import("@/lib/supabase/client").then(({ createClient }) => {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data }) => {
        const supabaseCurrency = data.user?.user_metadata?.currency;
        if (supabaseCurrency) {
          // Supabase has a saved currency — use it and sync to localStorage
          setCurrency(supabaseCurrency);
        } else {
          // No Supabase value yet — read from localStorage and save it up
          try {
            const local = JSON.parse(localStorage.getItem("ll_ui") ?? "{}");
            const localCurrency = local?.state?.currency;
            if (localCurrency && localCurrency !== "USD") {
              setCurrency(localCurrency);
              supabase.auth.updateUser({ data: { currency: localCurrency } }).catch(() => {});
            }
          } catch {}
        }
      }).catch(() => {});
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div id="pg-dash">
      <Sidebar userName={userName} isAdmin={isAdmin} avatarUrl={avatarUrl} />

      {/* Mobile overlay drawer */}
      <div className={`mob-overlay${drawerOpen ? " open" : ""}`} onClick={() => setDrawerOpen(false)}>
        <div className="mob-drawer" onClick={e => e.stopPropagation()}>
          <button className="mob-close" onClick={() => setDrawerOpen(false)}>×</button>
          <div style={{ padding: "14px 12px 0", borderBottom: "1px solid var(--bdr)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, paddingBottom: 12 }}>
              <img src="/logo.png" alt="Ledgerleaf" style={{ width: 30, height: 30, borderRadius: 9, objectFit: "contain" }} />
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "var(--p)" }}>Ledgerleaf</div>
                <div style={{ fontSize: 9, color: "var(--t4)", textTransform: "uppercase", letterSpacing: ".5px" }}>Finance</div>
              </div>
            </div>
          </div>
          <nav style={{ padding: "10px 8px 0", flex: 1 }}>
            {[
              { label: "Dashboard", href: "/" },
              { label: "Transactions", href: "/transactions" },
              { label: "Bills & Subscriptions", href: "/bills" },
              { label: "Budget", href: "/budget" },
              { label: "Savings Goals", href: "/savings" },
              { label: "Reports", href: "/reports" },
              { label: "Categories & Tags", href: "/categories" },
              { label: "Accounts", href: "/accounts" },
              { label: "Debts & Loans", href: "/debts" },
              { label: "Assets & Liabilities", href: "/assets" },
              { label: "Calendar", href: "/calendar" },
              { label: "Profile", href: "/profile" },
              ...(isAdmin ? [{ label: "License Keys", href: "/admin" }] : []),
            ].map(item => (
              <Link key={item.href} href={item.href} className="nav-item" onClick={() => setDrawerOpen(false)} style={{ display: "block", textDecoration: "none" }}>{item.label}</Link>
            ))}
          </nav>
        </div>
      </div>

      <div className="main-area">
        <Topbar
          userName={userName}
          userEmail={userEmail}
          userId={userId}
          avatarUrl={avatarUrl}
          pageTitle={pageTitle}
          onOpenDrawer={() => setDrawerOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
        />
        <div className="content">
          {children}
        </div>
      </div>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <InstallPWA />
    </div>
  );
}
