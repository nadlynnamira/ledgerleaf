"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, {
  message: "Passwords do not match",
  path: ["confirm"],
});
type FormData = z.infer<typeof schema>;

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: { data: { full_name: data.name } },
    });
    if (error) { setError(error.message); setLoading(false); return; }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="auth-pg">
      <div className="auth-brand">
        <img src="/logo.png" alt="Ledgerleaf" className="auth-brand-ico" />
        <div>
          <div className="auth-brand-name">Ledgerleaf</div>
          <div className="auth-brand-sub">Personal Finance Tracker</div>
        </div>
      </div>
      <div className="auth-card">
        <h1>Create account</h1>
        <p className="sub">Create your Ledgerleaf account</p>
        {error && <div className="msg-err">{error}</div>}
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="fld">
            <label htmlFor="name">Full name</label>
            <input id="name" type="text" placeholder="Namyra" autoComplete="name" {...register("name")} />
            {errors.name && <span className="fld-err">{errors.name.message}</span>}
          </div>
          <div className="fld">
            <label htmlFor="email">Email address</label>
            <input id="email" type="email" placeholder="you@example.com" autoComplete="email" {...register("email")} />
            {errors.email && <span className="fld-err">{errors.email.message}</span>}
          </div>
          <div className="fld">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" placeholder="At least 8 characters" {...register("password")} />
            {errors.password && <span className="fld-err">{errors.password.message}</span>}
          </div>
          <div className="fld">
            <label htmlFor="confirm">Confirm password</label>
            <input id="confirm" type="password" placeholder="••••••••" {...register("confirm")} />
            {errors.confirm && <span className="fld-err">{errors.confirm.message}</span>}
          </div>
          <button type="submit" className="btn-p" disabled={loading}>
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>
        <p className="auth-foot">Have an account? <Link href="/login">Sign in</Link></p>
      </div>
    </div>
  );
}
