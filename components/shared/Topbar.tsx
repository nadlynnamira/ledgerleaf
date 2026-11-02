"use client";
import { useState, useEffect, useRef } from "react";
import { useUI } from "@/store/ui";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getPastMonths, getGreeting } from "@/lib/utils";
import { CURRENCY_SYMBOLS, type Currency, type Theme } from "@/types";
import {
  Menu, Search, Sun, Bell, ChevronDown, Check,
  Settings, User, LogOut,
} from "lucide-react";
import { fetchBills, getDaysUntilDue } from "@/lib/queries/bills";
import type { Bill } from "@/types";

type Notif = { id: string; icon: string; title: string; sub: string; urgent?: boolean };

function ordinal(n: number) {
  const s = ["th","st","nd","rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

async function buildNotifications(supabase: ReturnType<typeof createClient>, userId: string): Promise<Notif[]> {
  const notifs: Notif[] = [];
  const today = new Date();
  const y = today.getFullYear(), m = today.getMonth() + 1;
  const pad = (n: number) => String(n).padStart(2, "0");

  // Bills due within 7 days or overdue
  const bills: Bill[] = await fetchBills(supabase, userId).catch(() => []);
  for (const b of bills.filter(b => b.is_active)) {
    const days = getDaysUntilDue(b.due_day, b.frequency);
    if (days <= 7) {
      const freq = b.frequency === "monthly" ? "monthly" : b.frequency === "weekly" ? "weekly" : b.frequency === "quarterly" ? "quarterly" : "yearly";
      notifs.push({
        id: `bill-${b.id}`,
        icon: b.icon ?? "📅",
        title: days < 0 ? `${b.name} is overdue by ${Math.abs(days)} day${Math.abs(days) !== 1 ? "s" : ""}!`
          : days === 0 ? `${b.name} is due TODAY`
          : days === 1 ? `${b.name} is due TOMORROW`
          : `${b.name} due in ${days} days`,
        sub: `${freq.charAt(0).toUpperCase() + freq.slice(1)} bill · due on the ${ordinal(b.due_day)}`,
        urgent: days <= 1,
      });
    }
  }

  // Budgets over or near limit this month
  const from = `${y}-${pad(m)}-01`;
  const to = `${y}-${pad(m)}-${new Date(y, m, 0).getDate()}`;
  const { data: budgets } = await supabase.from("budgets").select("*, categories(name)").eq("user_id", userId).eq("year", y).eq("month", m);
  const { data: txns } = await supabase.from("transactions").select("category_id, amount").eq("user_id", userId).eq("type", "expense").gte("date", from).lte("date", to);

  for (const bgt of (budgets ?? [])) {
    const spent = (txns ?? []).filter(t => t.category_id === bgt.category_id).reduce((s: number, t: { amount: number }) => s + t.amount, 0);
    const pct = bgt.amount > 0 ? spent / bgt.amount : 0;
    if (pct >= 0.9) {
      const catName = (bgt.categories as { name: string } | null)?.name ?? "Budget";
      notifs.push({
        id: `bgt-${bgt.id}`,
        icon: "⚠️",
        title: pct >= 1 ? `${catName} budget exceeded` : `${catName} at ${Math.round(pct * 100)}%`,
        sub: pct >= 1 ? "You've gone over your monthly budget" : "Only a little room left in this category",
        urgent: pct >= 1,
      });
    }
  }

  // Savings goals with deadlines in the next 30 days
  const { data: goals } = await supabase.from("savings_goals").select("name, deadline, saved_amount, target_amount, is_achieved").eq("user_id", userId);
  for (const g of (goals ?? [])) {
    if (g.is_achieved) {
      notifs.push({ id: `goal-done-${g.name}`, icon: "🏆", title: `Goal achieved: ${g.name}!`, sub: "You reached your savings target", urgent: false });
      continue;
    }
    if (g.deadline) {
      const daysLeft = Math.ceil((new Date(g.deadline).getTime() - today.getTime()) / 86400000);
      if (daysLeft >= 0 && daysLeft <= 30) {
        const remaining = Math.max(0, g.target_amount - g.saved_amount);
        notifs.push({
          id: `goal-deadline-${g.name}`,
          icon: "🎯",
          title: daysLeft === 0 ? `"${g.name}" deadline is TODAY`
            : daysLeft === 1 ? `"${g.name}" deadline is TOMORROW`
            : `"${g.name}" deadline in ${daysLeft} days`,
          sub: remaining > 0 ? `Still need ${remaining.toLocaleString()} to reach goal` : "Goal fully funded — mark it achieved!",
          urgent: daysLeft <= 3,
        });
      }
    }
  }

  // Debts with due dates in the next 14 days
  const { data: debts } = await supabase.from("debts").select("name, due_date, type, is_paid").eq("user_id", userId).eq("is_paid", false);
  for (const d of (debts ?? [])) {
    if (d.due_date) {
      const daysLeft = Math.ceil((new Date(d.due_date).getTime() - today.getTime()) / 86400000);
      if (daysLeft <= 14) {
        notifs.push({
          id: `debt-${d.name}`,
          icon: d.type === "loan" ? "🤝" : "💳",
          title: daysLeft < 0 ? `${d.name} is overdue by ${Math.abs(daysLeft)} day${Math.abs(daysLeft) !== 1 ? "s" : ""}!`
            : daysLeft === 0 ? `${d.name} payment due TODAY`
            : daysLeft === 1 ? `${d.name} payment due TOMORROW`
            : `${d.name} payment due in ${daysLeft} days`,
          sub: d.type === "debt" ? "Debt payment approaching" : "Loan collection date approaching",
          urgent: daysLeft <= 2,
        });
      }
    }
  }

  // Sort: urgent first
  return notifs.sort((a, b) => (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0));
}

const THEMES: { key: Theme; name: string; dots: string[] }[] = [
  { key: "blush",    name: "Blush Petals",     dots: ["#8F4965","#D982A2","#F9E1E8"] },
  { key: "lavender", name: "Lavender Dream",    dots: ["#55427F","#9272D6","#E9DFFF"] },
  { key: "matcha",   name: "Matcha Serenity",   dots: ["#42583D","#7F9B67","#E2E9D5"] },
  { key: "butter",   name: "Buttercream",       dots: ["#79602C","#D8AF4F","#FFF0C9"] },
  { key: "peach",    name: "Peach Sorbet",      dots: ["#8B4D39","#E99070","#FFE4D5"] },
  { key: "ocean",    name: "Ocean Mist",        dots: ["#315E6B","#65A8B8","#DCEFF3"] },
  { key: "cocoa",    name: "Cocoa Latte",       dots: ["#5F493A","#A18368","#EAE0D3"] },
  { key: "midnight", name: "Midnight Bloom",    dots: ["#F0EBFF","#A99AE6","#494563"] },
];
const CURRENCIES: { code: Currency; name: string; flag: string }[] = [
  { code: "USD", name: "US Dollar",          flag: "🇺🇸" },
  { code: "MYR", name: "Malaysian Ringgit",  flag: "🇲🇾" },
  { code: "EUR", name: "Euro",               flag: "🇪🇺" },
  { code: "GBP", name: "British Pound",      flag: "🇬🇧" },
  { code: "SGD", name: "Singapore Dollar",   flag: "🇸🇬" },
];

interface TopbarProps {
  userName: string;
  userEmail: string;
  userId: string;
  avatarUrl?: string;
  pageTitle: string;
  onOpenDrawer?: () => void;
  onOpenSettings?: () => void;
  selectedMonth: string;
  onMonthChange: (v: string) => void;
}

export default function Topbar({
  userName, userEmail, userId, avatarUrl,
  pageTitle, onOpenDrawer, onOpenSettings,
  selectedMonth, onMonthChange,
}: TopbarProps) {
  const { theme, setTheme, currency, setCurrency } = useUI();
  const router = useRouter();
  const supabase = createClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [monthOpen, setMonthOpen] = useState(false);
  const [curOpen, setCurOpen] = useState(false);
  const [profOpen, setProfOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Load notifications eagerly on mount so the dot appears
  useEffect(() => {
    if (!userId) return;
    buildNotifications(supabase, userId).then(n => setNotifs(n)).catch(() => {});
  }, [userId]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function openNotifications() {
    const opening = !notifOpen;
    setNotifOpen(o => !o);
    setMonthOpen(false); setCurOpen(false); setProfOpen(false);
    if (opening) {
      setNotifLoading(true);
      try {
        const n = await buildNotifications(supabase, userId);
        setNotifs(n);
      } finally {
        setNotifLoading(false);
      }
    }
  }

  const months = getPastMonths(25);
  const ini = userName.charAt(0).toUpperCase();
  const greeting = getGreeting();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const selectedMonthLabel = months.find(m => m.value === selectedMonth)?.label ?? months[0]?.label;

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="hamburger" onClick={onOpenDrawer} title="Menu">
          <Menu size={16} />
        </button>
        <div className="topbar-title-wrap">
          <div className="greeting">{greeting}, {userName}! 🌿</div>
          <div className="pg-title">{pageTitle}</div>
        </div>
      </div>

      <div className="topbar-right">
        {/* Search */}
        <div className="search-wrap">
          <input
            className="search-input"
            type="search"
            placeholder="Search transactions…"
            aria-label="Search"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && searchQuery.trim()) {
                router.push(`/transactions?q=${encodeURIComponent(searchQuery.trim())}`);
              }
            }}
          />
          <button
            className="search-ico-btn"
            onClick={() => {
              if (searchQuery.trim()) router.push(`/transactions?q=${encodeURIComponent(searchQuery.trim())}`);
            }}
            aria-label="Search"
          >
            <Search size={13} />
          </button>
        </div>

        {/* Month picker */}
        <div className="month-wrap">
          <button
            className={`month-btn${monthOpen ? " open" : ""}`}
            onClick={() => { setMonthOpen(o => !o); setCurOpen(false); setProfOpen(false); }}
          >
            <span>{selectedMonthLabel}</span>
            <ChevronDown size={12} />
          </button>
          {monthOpen && (
            <div className="month-drop open">
              {months.map(m => (
                <div
                  key={m.value}
                  className={`month-drop-item${m.value === selectedMonth ? " active" : ""}`}
                  onClick={() => { onMonthChange(m.value); setMonthOpen(false); }}
                >
                  {m.label}
                  {m.value === selectedMonth && <Check size={12} className="chk-icon" />}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Currency */}
        <div className="cur-wrap">
          <button
            className="cur-btn"
            onClick={() => { setCurOpen(o => !o); setMonthOpen(false); setProfOpen(false); }}
          >
            <span>{currency}</span>
            <ChevronDown size={11} />
          </button>
          {curOpen && (
            <div className="cur-drop open">
              {CURRENCIES.map(c => (
                <div
                  key={c.code}
                  className={`cur-item${currency === c.code ? " active" : ""}`}
                  onClick={() => { setCurrency(c.code); setCurOpen(false); }}
                >
                  <span className="flag">{c.flag}</span>
                  <span className="cur-code">{c.code}</span>
                  <span className="cur-name">{c.name}</span>
                  <span className="cur-sym">{CURRENCY_SYMBOLS[c.code]}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Theme shortcut */}
        <button className="ic-btn" onClick={onOpenSettings} title="Themes & Settings">
          <Sun size={15} strokeWidth={1.8} />
        </button>

        {/* Notifications */}
        <div className="notif-wrap" ref={notifRef}>
          <button className="ic-btn" onClick={openNotifications} title="Notifications" style={{ position: "relative" }}>
            {notifs.some(n => n.urgent) && <span className="notif-dot urgent" />}
            {notifs.length > 0 && !notifs.some(n => n.urgent) && <span className="notif-dot" />}
            <Bell size={15} strokeWidth={1.8} />
          </button>
          {notifOpen && (
            <div className="notif-drop open">
              <div className="notif-hdr">
                <span>Notifications</span>
                {notifs.length > 0 && <button className="btn-ghost" style={{ fontSize: 11 }} onClick={() => setNotifs([])}>Clear</button>}
              </div>
              {notifs.length === 0 ? (
                <div className="notif-empty">
                  <Bell size={20} strokeWidth={1.5} />
                  <p>All caught up!</p>
                </div>
              ) : notifs.map(n => (
                <div key={n.id} className={`notif-item${n.urgent ? " urgent" : ""}`}>
                  <span className="notif-ico">{n.icon}</span>
                  <div className="notif-body">
                    <div className="notif-title">{n.title}</div>
                    <div className="notif-sub">{n.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="prof-wrap">
          <button
            className="prof-btn"
            onClick={() => { setProfOpen(o => !o); setMonthOpen(false); setCurOpen(false); }}
          >
            {avatarUrl
              ? <img src={avatarUrl} alt={userName} className="prof-av-img" />
              : <div className="prof-av">{ini}</div>
            }
            <span className="prof-name">{userName}</span>
          </button>
          {profOpen && (
            <div className="prof-drop open">
              <div className="prof-info">
                <div className="pn">{userName}</div>
                <div className="pe">{userEmail}</div>
              </div>
              <div className="drop-div" />
              <div className="drop-item" onClick={() => { onOpenSettings?.(); setProfOpen(false); }}>
                <Settings size={14} strokeWidth={1.8} /> Settings
              </div>
              <div className="drop-item" onClick={() => { router.push("/profile"); setProfOpen(false); }}>
                <User size={14} strokeWidth={1.8} /> Profile
              </div>
              <div className="drop-div" />
              <div className="drop-item danger" onClick={handleLogout}>
                <LogOut size={14} strokeWidth={1.8} /> Sign Out
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
