"use client";
import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) { setError("Please enter your email address."); return; }
    setLoading(true); setError("");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) setError(error.message);
    else setSent(true);
    setLoading(false);
  }

  return (
    <div className="auth-pg">
      <div className="auth-brand">
        <img src="/logo.png" alt="Ledgerleaf" className="auth-brand-ico" />
        <div className="auth-brand-name">Ledgerleaf</div>
      </div>
      <div className="auth-card">
        <h1>Forgot password?</h1>
        <p className="sub">Enter your email and we&apos;ll send you a reset link.</p>

        {sent ? (
          <div>
            <div className="msg-ok" style={{ marginBottom: 16 }}>
              Check your inbox! A password reset link has been sent to <strong>{email}</strong>.
            </div>
            <p className="auth-foot"><Link href="/login">Back to Sign In</Link></p>
          </div>
        ) : (
          <>
            {error && <div className="msg-err">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="fld">
                <label htmlFor="email">Email address</label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoFocus
                />
              </div>
              <button type="submit" className="btn-p" disabled={loading}>
                {loading ? "Sending…" : "Send Reset Link"}
              </button>
            </form>
            <p className="auth-foot"><Link href="/login">Back to Sign In</Link></p>
          </>
        )}
      </div>
    </div>
  );
}
