"use client";
import { useState } from "react";
import { generateLicenseCode } from "@/lib/actions/license";
import { Copy, Check, Plus, KeyRound, Shield } from "lucide-react";

type LicenseKey = {
  id: string;
  code: string;
  is_used: boolean;
  used_by_user_id: string | null;
  used_at: string | null;
  created_at: string;
};

export default function AdminPage({ keys: initialKeys }: { keys: LicenseKey[] }) {
  const [keys, setKeys] = useState(initialKeys);
  const [generating, setGenerating] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");

  async function handleGenerate() {
    setGenerating(true); setError(""); setNewCode("");
    const result = await generateLicenseCode();
    if (result.error) { setError(result.error); setGenerating(false); return; }
    const code = result.code!;
    setNewCode(code);
    setKeys(prev => [{ id: Date.now().toString(), code, is_used: false, used_by_user_id: null, used_at: null, created_at: new Date().toISOString() }, ...prev]);
    setGenerating(false);
  }

  async function copyCode(code: string) {
    try { await navigator.clipboard.writeText(code); } catch { /* ignore */ }
    setCopied(code);
    setTimeout(() => setCopied(""), 2000);
  }

  const used = keys.filter(k => k.is_used).length;
  const available = keys.filter(k => !k.is_used).length;

  return (
    <div>
      <div className="pg-hdr">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,var(--p3),var(--p))", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Shield size={16} color="#fff" />
          </div>
          <div>
            <h2 className="pg-h2">Admin — License Keys</h2>
            <p className="pg-sub">Generate and manage activation codes</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <div className="card" style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: "var(--p)" }}>{keys.length}</div>
          <div style={{ fontSize: 12, color: "var(--t3)" }}>Total Codes</div>
        </div>
        <div className="card" style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: "var(--gr)" }}>{available}</div>
          <div style={{ fontSize: 12, color: "var(--t3)" }}>Available</div>
        </div>
        <div className="card" style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: "var(--t2)" }}>{used}</div>
          <div style={{ fontSize: 12, color: "var(--t3)" }}>Used</div>
        </div>
      </div>

      {/* Generate */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-ttl" style={{ marginBottom: 14 }}>Generate New Code</div>
        {error && <div className="msg-err" style={{ marginBottom: 12 }}>{error}</div>}
        {newCode && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, background: "color-mix(in srgb,var(--gr) 10%,transparent)", border: "1.5px solid var(--gr)", borderRadius: 10, padding: "12px 16px", marginBottom: 14 }}>
            <KeyRound size={15} color="var(--gr)" />
            <span style={{ fontFamily: "monospace", fontSize: 15, fontWeight: 700, color: "var(--gr)", flex: 1, letterSpacing: "0.05em" }}>{newCode}</span>
            <button className="btn-ghost" style={{ padding: "6px 12px", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }} onClick={() => copyCode(newCode)}>
              {copied === newCode ? <Check size={13} /> : <Copy size={13} />}
              {copied === newCode ? "Copied!" : "Copy"}
            </button>
          </div>
        )}
        <button className="btn-p" style={{ width: "auto", display: "flex", alignItems: "center", gap: 8, padding: "10px 24px" }} onClick={handleGenerate} disabled={generating}>
          <Plus size={14} /> {generating ? "Generating…" : "Generate Code"}
        </button>
      </div>

      {/* Keys table */}
      <div className="card">
        <div className="card-ttl" style={{ marginBottom: 14 }}>All Codes</div>
        {keys.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem 0", color: "var(--t3)", fontSize: 13 }}>No codes generated yet.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1.5px solid var(--bdr)" }}>
                  <th style={{ textAlign: "left", padding: "8px 12px", color: "var(--t3)", fontWeight: 600 }}>Code</th>
                  <th style={{ textAlign: "left", padding: "8px 12px", color: "var(--t3)", fontWeight: 600 }}>Status</th>
                  <th style={{ textAlign: "left", padding: "8px 12px", color: "var(--t3)", fontWeight: 600 }}>Used At</th>
                  <th style={{ textAlign: "left", padding: "8px 12px", color: "var(--t3)", fontWeight: 600 }}>Created</th>
                  <th style={{ padding: "8px 12px" }} />
                </tr>
              </thead>
              <tbody>
                {keys.map(k => (
                  <tr key={k.id} style={{ borderBottom: "1px solid var(--bdr)" }}>
                    <td style={{ padding: "10px 12px", fontFamily: "monospace", fontWeight: 600, letterSpacing: "0.04em", color: "var(--t1)" }}>{k.code}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 6, background: k.is_used ? "color-mix(in srgb,var(--t3) 12%,transparent)" : "color-mix(in srgb,var(--gr) 15%,transparent)", color: k.is_used ? "var(--t3)" : "var(--gr)" }}>
                        {k.is_used ? "Used" : "Available"}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px", color: "var(--t3)" }}>
                      {k.used_at ? new Date(k.used_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—"}
                    </td>
                    <td style={{ padding: "10px 12px", color: "var(--t3)" }}>
                      {new Date(k.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      {!k.is_used && (
                        <button className="btn-ghost" style={{ padding: "4px 10px", fontSize: 11, display: "flex", alignItems: "center", gap: 5 }} onClick={() => copyCode(k.code)}>
                          {copied === k.code ? <Check size={11} /> : <Copy size={11} />}
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
