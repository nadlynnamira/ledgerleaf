"use client";
import { useState, useEffect, useCallback } from "react";
import { generateLicenseCode, getAllLicenseKeys } from "@/lib/actions/license";
import { Shield, Copy, Check, Plus, RefreshCw } from "lucide-react";

type LicenseKey = {
  id: string;
  code: string;
  is_used: boolean;
  used_by_user_id: string | null;
  used_at: string | null;
  created_at: string;
};

export default function AdminPage() {
  const [keys, setKeys] = useState<LicenseKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [copied, setCopied] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getAllLicenseKeys();
    setKeys(data as LicenseKey[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleGenerate() {
    setGenerating(true);
    const result = await generateLicenseCode();
    if (result.code) {
      setNewCode(result.code);
      await load();
    }
    setGenerating(false);
  }

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      setTimeout(() => setCopied(""), 2000);
    } catch {
      setCopied(code);
      setTimeout(() => setCopied(""), 2000);
    }
  }

  const available = keys.filter(k => !k.is_used).length;
  const used = keys.filter(k => k.is_used).length;

  return (
    <div>
      <div className="pg-hdr">
        <div>
          <h2 className="pg-h2">License Keys</h2>
          <p className="pg-sub">Generate and manage activation codes for new users</p>
        </div>
        <button className="btn-p" onClick={handleGenerate} disabled={generating} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Plus size={15} />
          {generating ? "Generating…" : "Generate Code"}
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total Keys", value: keys.length, color: "var(--p)" },
          { label: "Available", value: available, color: "var(--gr)" },
          { label: "Used", value: used, color: "var(--rd)" },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: "16px 18px" }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "var(--t3)", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Newly generated code highlight */}
      {newCode && (
        <div className="card" style={{ padding: "14px 18px", marginBottom: 16, borderColor: "var(--p)", background: "var(--plt)" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--p)", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".5px" }}>
            ✅ New code generated — copy and share it
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <code style={{ flex: 1, fontSize: 16, fontFamily: "monospace", fontWeight: 700, color: "var(--t1)", letterSpacing: ".08em" }}>{newCode}</code>
            <button className="btn-ghost" onClick={() => copyCode(newCode)} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12 }}>
              {copied === newCode ? <Check size={13} color="var(--gr)" /> : <Copy size={13} />}
              {copied === newCode ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      )}

      {/* Keys table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid var(--bdr)" }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "var(--t1)" }}>All Keys</div>
          <button onClick={load} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--t3)", display: "flex", padding: 4 }}>
            <RefreshCw size={14} />
          </button>
        </div>

        {loading ? (
          <div style={{ padding: 24, textAlign: "center", color: "var(--t3)", fontSize: 13 }}>Loading…</div>
        ) : keys.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center" }}>
            <Shield size={32} color="var(--t4)" style={{ marginBottom: 8 }} />
            <p style={{ color: "var(--t3)", fontSize: 13 }}>No keys yet. Generate your first one above.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--bdr)" }}>
                  {["Code", "Status", "Used At", ""].map(h => (
                    <th key={h} style={{ padding: "10px 18px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--t3)", textTransform: "uppercase", letterSpacing: ".4px" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {keys.map(k => (
                  <tr key={k.id} style={{ borderBottom: "1px solid var(--bdr)" }}>
                    <td style={{ padding: "12px 18px" }}>
                      <code style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 600, color: "var(--t1)", letterSpacing: ".05em" }}>{k.code}</code>
                    </td>
                    <td style={{ padding: "12px 18px" }}>
                      <span style={{
                        display: "inline-block", padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                        background: k.is_used ? "color-mix(in srgb,var(--rd) 12%,transparent)" : "color-mix(in srgb,var(--gr) 12%,transparent)",
                        color: k.is_used ? "var(--rd)" : "var(--gr)",
                      }}>
                        {k.is_used ? "Used" : "Available"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 18px", color: "var(--t3)" }}>
                      {k.used_at ? new Date(k.used_at).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                    </td>
                    <td style={{ padding: "12px 18px" }}>
                      {!k.is_used && (
                        <button className="btn-ghost" onClick={() => copyCode(k.code)} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
                          {copied === k.code ? <Check size={12} color="var(--gr)" /> : <Copy size={12} />}
                          {copied === k.code ? "Copied" : "Copy"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
