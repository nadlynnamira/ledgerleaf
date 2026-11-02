"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUI } from "@/store/ui";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, List, FileText, TrendingDown,
  Scale, Calendar, BarChart2, Tag, CreditCard,
  ChevronLeft, LogOut, User, Shield,
} from "lucide-react";

const NAV = [
  { label: "Navigation", items: [
    { href: "/", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/transactions", icon: List, label: "Transactions" },
    { href: "/bills", icon: FileText, label: "Bills & Subscriptions" },
    { href: "/budget", icon: BarChart2, label: "Budget" },
    { href: "/savings", icon: TrendingDown, label: "Savings Goals" },
    { href: "/reports", icon: BarChart2, label: "Reports" },
  ]},
  { label: "Manage", items: [
    { href: "/categories", icon: Tag, label: "Categories & Tags" },
    { href: "/accounts", icon: CreditCard, label: "Accounts" },
    { href: "/debts", icon: TrendingDown, label: "Debts & Loans" },
    { href: "/assets", icon: Scale, label: "Assets & Liabilities" },
    { href: "/calendar", icon: Calendar, label: "Calendar" },
  ]},
  { label: "Account", items: [
    { href: "/profile", icon: User, label: "Profile" },
  ]},
  { label: "Admin", items: [
    { href: "/admin", icon: Shield, label: "License Keys" },
  ]},
];

export default function Sidebar({ userName, isAdmin, avatarUrl }: { userName: string; isAdmin?: boolean; avatarUrl?: string }) {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useUI();
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const ini = userName ? userName.charAt(0).toUpperCase() : "U";

  return (
    <aside className={`sidebar${sidebarCollapsed ? " collapsed" : ""}`} id="sidebar">
      {/* Header */}
      <div className="sb-hd">
        <div className="sb-logo">
          <img src="/logo.png" alt="Ledgerleaf" className="sb-logo-ico" />
          <div className="sb-logo-text">
            <div className="sb-logo-name">Ledgerleaf</div>
            <div className="sb-logo-sub">Finance</div>
          </div>
        </div>
        <button className="sb-toggle" onClick={toggleSidebar} title="Collapse sidebar">
          <ChevronLeft size={14} />
        </button>
      </div>

      {/* Nav */}
      <nav className="sb-nav">
        {NAV.filter(s => s.label !== "Admin" || isAdmin).map((section) => (
          <div key={section.label}>
            <div className="sb-nav-lbl">{section.label}</div>
            {section.items.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} className={`nav-item${active ? " active" : ""}`}>
                  <Icon size={15} strokeWidth={1.8} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="sb-user">
        {avatarUrl
          ? <img src={avatarUrl} alt={userName} className="u-av" style={{ objectFit: "cover", borderRadius: "50%" }} />
          : <div className="u-av">{ini}</div>
        }
        <div className="u-info">
          <div className="u-name">{userName}</div>
          <div className="u-role">Personal Account</div>
        </div>
        <button className="sb-logout" onClick={handleLogout} title="Sign out">
          <LogOut size={14} strokeWidth={1.8} />
        </button>
      </div>
    </aside>
  );
}
