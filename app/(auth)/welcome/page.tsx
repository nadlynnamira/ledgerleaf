"use client";
import { useRouter } from "next/navigation";
import { CreditCard, List, BarChart2, ArrowRight, CheckCircle } from "lucide-react";

const STEPS = [
  {
    icon: CreditCard,
    color: "#2563eb",
    bg: "#2563eb22",
    step: "Step 1",
    title: "Add an Account",
    desc: "Start by adding your bank account, wallet, or credit card. Ledgerleaf tracks balances across all your accounts.",
    href: "/accounts",
    cta: "Go to Accounts",
  },
  {
    icon: List,
    color: "var(--p)",
    bg: "var(--plt)",
    step: "Step 2",
    title: "Record Transactions",
    desc: "Log your income and expenses. Categorise them so you can see exactly where your money comes from and goes.",
    href: "/transactions",
    cta: "Go to Transactions",
  },
  {
    icon: BarChart2,
    color: "#d97706",
    bg: "#d9770622",
    step: "Step 3",
    title: "Set a Budget",
    desc: "Create monthly budgets per category and get alerted when you are close to your limit.",
    href: "/budget",
    cta: "Go to Budget",
  },
];

export default function WelcomePage() {
  const router = useRouter();

  return (
    <div className="auth-pg" style={{ minHeight: "100dvh", justifyContent: "center", padding: "32px 16px" }}>
      <div style={{ maxWidth: 560, width: "100%", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <img src="/logo.png" alt="Ledgerleaf" style={{ width: 56, height: 56, borderRadius: 16, objectFit: "contain" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <CheckCircle size={20} color="var(--gr)" />
            <span style={{ color: "var(--gr)", fontWeight: 600, fontSize: 14 }}>Activation successful</span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--t1)", margin: "0 0 8px" }}>
            Welcome to Ledgerleaf! 🌿
          </h1>
          <p style={{ color: "var(--t3)", fontSize: 14, margin: 0 }}>
            Here&apos;s how to get started in 3 simple steps.
          </p>
        </div>

        {/* Steps */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 28 }}>
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="card" style={{ display: "flex", alignItems: "flex-start", gap: 16, padding: "18px 20px" }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={20} color={s.color} strokeWidth={1.8} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--t4)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 3 }}>{s.step}</div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "var(--t1)", marginBottom: 5 }}>{s.title}</div>
                  <p style={{ fontSize: 13, color: "var(--t3)", margin: 0, lineHeight: 1.5 }}>{s.desc}</p>
                </div>
                <button
                  className="btn-ghost"
                  style={{ fontSize: 12, whiteSpace: "nowrap", flexShrink: 0 }}
                  onClick={() => router.push(s.href)}
                >
                  {s.cta} <ArrowRight size={11} style={{ marginLeft: 3 }} />
                </button>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <button
          className="btn-p"
          style={{ width: "100%", fontSize: 15, padding: "13px 0" }}
          onClick={() => router.push("/")}
        >
          Go to Dashboard
        </button>
        <p style={{ textAlign: "center", fontSize: 12, color: "var(--t4)", marginTop: 14 }}>
          You can always find these sections in the sidebar.
        </p>
      </div>
    </div>
  );
}
