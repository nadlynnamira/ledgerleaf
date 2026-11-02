"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  // Restore saved email on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("ll_remember_email");
      if (saved) { setValue("email", saved); }
    } catch {}
  }, [setValue]);

  async function onSubmit(data: FormData) {
    setError(""); setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: data.email, password: data.password });
    if (error) { setError(error.message); setLoading(false); return; }
    try {
      if (rememberMe) { localStorage.setItem("ll_remember_email", data.email); }
      else { localStorage.removeItem("ll_remember_email"); }
    } catch {}
    router.push("/"); router.refresh();
  }

  return (
    <div className="auth-pg">
      <div className="auth-brand">
        <img src="/logo.png" alt="Ledgerleaf" className="auth-brand-ico" />
        <div className="auth-brand-name">Ledgerleaf</div>
      </div>
      <div className="auth-card">
        <h1>Welcome back</h1>
        <p className="sub">Sign in to your account to continue</p>
        {error && <div className="msg-err">{error}</div>}
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="fld">
            <label htmlFor="email">Email address</label>
            <input id="email" type="email" placeholder="you@example.com" autoComplete="email" {...register("email")} />
            {errors.email && <span className="fld-err">{errors.email.message}</span>}
          </div>
          <div className="fld">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <label htmlFor="password" style={{ marginBottom: 0 }}>Password</label>
              <Link href="/forgot-password" className="auth-link" style={{ fontSize: 12 }}>Forgot password?</Link>
            </div>
            <div style={{ position: "relative" }}>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="current-password"
                style={{ paddingRight: 40 }}
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--t3)", display: "flex", padding: 0 }}
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.password && <span className="fld-err">{errors.password.message}</span>}
          </div>
          <div className="auth-remember">
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: "var(--t2)" }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                style={{ width: 14, height: 14, accentColor: "var(--p)", cursor: "pointer" }}
              />
              Remember me
            </label>
          </div>
          <button type="submit" className="btn-p" disabled={loading}>
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
        <p className="auth-foot">No account? <Link href="/signup">Create one</Link></p>
      </div>
    </div>
  );
}
