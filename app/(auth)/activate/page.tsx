"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { redeemLicenseCode } from "@/lib/actions/license";
import { KeyRound, CheckCircle } from "lucide-react";

export default function ActivatePage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) { setError("Please enter your activation code."); return; }
    setLoading(true); setError("");
    const result = await redeemLicenseCode(code);
    if (result.error) { setError(result.error); setLoading(false); return; }
    setSuccess(true);
    setTimeout(() => { router.push("/welcome"); router.refresh(); }, 1200);
  }

  return (
    <div className="auth-pg">
      <div className="auth-brand">
        <img src="/logo.png" alt="Ledgerleaf" className="auth-brand-ico" />
        <div className="auth-brand-name">Ledgerleaf</div>
      </div>

      <div className="auth-card">
        {success ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "8px 0 4px" }}>
            <CheckCircle size={48} color="var(--gr)" strokeWidth={1.5} />
            <h1 style={{ margin: 0 }}>Activated!</h1>
            <p className="sub" style={{ margin: 0 }}>Setting up your workspace…</p>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 4 }}>
              <div style={{ width: 52, height: 52, borderRadius: 16, background: "linear-gradient(135deg,var(--p3),var(--p))", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px color-mix(in srgb,var(--p) 35%,transparent)" }}>
                <KeyRound size={24} color="#fff" />
              </div>
            </div>

            <h1>Activate Your Copy</h1>
            <p className="sub">Enter the unique code you received to unlock your Ledgerleaf account.</p>

            <div className="act-steps">
              <div className="act-step"><span>1</span> Purchase access</div>
              <div className="act-step-arr">→</div>
              <div className="act-step active"><span>2</span> Enter code</div>
              <div className="act-step-arr">→</div>
              <div className="act-step"><span>3</span> Start tracking</div>
            </div>

            {error && <div className="msg-err">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="fld">
                <label htmlFor="code">Activation Code</label>
                <input
                  id="code"
                  type="text"
                  placeholder="LEAF-XXXX-XXXX-XXXX"
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ""))}
                  autoComplete="off"
                  autoFocus
                  spellCheck={false}
                  style={{ fontFamily: "monospace", letterSpacing: "0.08em", fontSize: 15, textTransform: "uppercase" }}
                />
                <span className="fld-hint">Format: LEAF-XXXX-XXXX-XXXX</span>
              </div>
              <button type="submit" className="btn-p" disabled={loading || !code.trim()}>
                {loading ? "Activating…" : "Activate Ledgerleaf"}
              </button>
            </form>

            <p style={{ fontSize: 12, color: "var(--t3)", textAlign: "center", marginTop: 12 }}>
              Don&apos;t have a code?{" "}
              <a href="mailto:nadlynnamira@gmail.com" style={{ color: "var(--p)", textDecoration: "none" }}>Contact us to purchase access.</a>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
