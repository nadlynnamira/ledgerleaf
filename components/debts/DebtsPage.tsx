"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUI } from "@/store/ui";
import { formatCurrency } from "@/lib/utils";
import { Plus, Pencil, Trash2, X, TrendingDown, TrendingUp } from "lucide-react";
import { fetchDebts, insertDebt, updateDebt, deleteDebt, type DebtInsert } from "@/lib/queries/debts";
import type { Debt } from "@/types";

const PRESET_ICONS = ["🏦","🏠","🚗","💳","🎓","👤","🏥","📱","🌐","💰"];
const PRESET_COLORS = ["#16a34a","#0d9488","#2563eb","#7c3aed","#db2777","#ea580c","#ca8a04","#64748b"];

type Tab = "debt" | "loan";
type Form = {
  name: string; type: Tab; balance: string; original_amount: string;
  interest_rate: string; monthly_payment: string; due_date: string;
  counterparty: string; icon: string; color: string; notes: string; is_paid: boolean;
};
const EMPTY: Form = {
  name: "", type: "debt", balance: "", original_amount: "",
  interest_rate: "", monthly_payment: "", due_date: "",
  counterparty: "", icon: PRESET_ICONS[0], color: PRESET_COLORS[0], notes: "", is_paid: false,
};

export default function DebtsPage({ userId }: { userId: string }) {
  const { currency } = useUI();
  const supabase = createClient();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("debt");
  const [showPaid, setShowPaid] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);

  const load = useCallback(async () => {
    setLoading(true);
    setDebts(await fetchDebts(supabase, userId));
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const visible = debts.filter(d => d.type === tab && d.is_paid === showPaid);
  const activeDebts = debts.filter(d => d.type === "debt" && !d.is_paid);
  const activeLoans = debts.filter(d => d.type === "loan" && !d.is_paid);
  const totalOwed = activeDebts.reduce((s, d) => s + d.balance, 0);
  const totalOwing = activeLoans.reduce((s, d) => s + d.balance, 0);

  function openAdd() { setEditId(null); setForm({ ...EMPTY, type: tab }); setError(""); setModalOpen(true); }
  function openEdit(d: Debt) {
    setEditId(d.id);
    setForm({
      name: d.name, type: d.type as Tab, balance: String(d.balance),
      original_amount: String(d.original_amount),
      interest_rate: d.interest_rate != null ? String(d.interest_rate) : "",
      monthly_payment: d.monthly_payment != null ? String(d.monthly_payment) : "",
      due_date: d.due_date ?? "", counterparty: d.counterparty ?? "",
      icon: d.icon ?? PRESET_ICONS[0], color: d.color ?? PRESET_COLORS[0],
      notes: d.notes ?? "", is_paid: d.is_paid,
    });
    setError(""); setModalOpen(true);
  }
  function closeModal() { setModalOpen(false); setEditId(null); setError(""); }

  async function handleSave() {
    if (!form.name.trim()) { setError("Name is required."); return; }
    const balance = parseFloat(form.balance);
    const original = parseFloat(form.original_amount);
    if (isNaN(balance) || balance < 0) { setError("Enter a valid balance."); return; }
    if (isNaN(original) || original < 0) { setError("Enter a valid original amount."); return; }
    setSaving(true); setError("");
    try {
      const payload: DebtInsert = {
        user_id: userId, name: form.name.trim(), type: form.type,
        balance, original_amount: original,
        interest_rate: form.interest_rate ? parseFloat(form.interest_rate) : null,
        monthly_payment: form.monthly_payment ? parseFloat(form.monthly_payment) : null,
        due_date: form.due_date || null, counterparty: form.counterparty.trim() || null,
        icon: form.icon, color: form.color, notes: form.notes.trim() || null, is_paid: form.is_paid,
      };
      if (editId) await updateDebt(supabase, editId, payload);
      else await insertDebt(supabase, payload);
      closeModal(); await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally { setSaving(false); }
  }

  async function handleDelete(d: Debt) {
    if (!confirm(`Delete "${d.name}"?`)) return;
    await deleteDebt(supabase, d.id);
    await load();
  }

  async function markPaid(d: Debt) {
    await updateDebt(supabase, d.id, { is_paid: !d.is_paid, balance: d.is_paid ? d.balance : 0 });
    await load();
  }

  const paidIn = (d: Debt) => Math.max(0, d.original_amount - d.balance);
  const pct = (d: Debt) => d.original_amount > 0 ? Math.min(100, Math.round((paidIn(d) / d.original_amount) * 100)) : 0;

  return (
    <div>
      <div className="pg-hdr">
        <div>
          <h2 className="pg-h2">Debts & Loans</h2>
          <p className="pg-sub">
            You owe: <strong style={{ color: "var(--rd)" }}>{formatCurrency(totalOwed, currency)}</strong>
            &nbsp;· Owed to you: <strong style={{ color: "var(--gr)" }}>{formatCurrency(totalOwing, currency)}</strong>
          </p>
        </div>
        <button className="btn-add" onClick={openAdd}><Plus size={15} strokeWidth={2.5} /> Add</button>
      </div>

      {/* Summary */}
      {debts.filter(d => !d.is_paid).length > 0 && (
        <div className="bgt-summ" style={{ marginBottom: 16 }}>
          <div className="bgt-summ-item">
            <span className="bgt-summ-lbl">Total Debt</span>
            <span className="bgt-summ-val" style={{ color: "var(--rd)" }}>{formatCurrency(totalOwed, currency)}</span>
          </div>
          <div className="bgt-summ-div" />
          <div className="bgt-summ-item">
            <span className="bgt-summ-lbl">Total Loans (owed to you)</span>
            <span className="bgt-summ-val" style={{ color: "var(--gr)" }}>{formatCurrency(totalOwing, currency)}</span>
          </div>
          <div className="bgt-summ-div" />
          <div className="bgt-summ-item">
            <span className="bgt-summ-lbl">Net Position</span>
            <span className="bgt-summ-val" style={{ color: totalOwing - totalOwed >= 0 ? "var(--gr)" : "var(--rd)" }}>
              {formatCurrency(totalOwing - totalOwed, currency)}
            </span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div className="type-tabs">
          <button className={`type-tab${tab === "debt" ? " active" : ""}`} onClick={() => setTab("debt")}>
            <TrendingDown size={12} /> I Owe <span className="tab-ct">{activeDebts.length}</span>
          </button>
          <button className={`type-tab${tab === "loan" ? " active" : ""}`} onClick={() => setTab("loan")}>
            <TrendingUp size={12} /> Owed to Me <span className="tab-ct">{activeLoans.length}</span>
          </button>
        </div>
        <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => setShowPaid(v => !v)}>
          {showPaid ? "Show Active" : `Show Paid (${debts.filter(d => d.is_paid && d.type === tab).length})`}
        </button>
      </div>

      {loading ? (
        <p style={{ color: "var(--t3)", fontSize: 13 }}>Loading…</p>
      ) : visible.length === 0 ? (
        <div className="acc-empty">
          <div className="acc-empty-ico">{tab === "debt" ? "💸" : "🤝"}</div>
          <div className="acc-empty-ttl">{showPaid ? "No paid entries" : tab === "debt" ? "No debts tracked" : "No loans tracked"}</div>
          <p className="acc-empty-sub">
            {tab === "debt" ? "Track money you owe — credit cards, personal loans, mortgages."
              : "Track money others owe you — personal loans, IOUs."}
          </p>
          {!showPaid && <button className="btn-add" onClick={openAdd}><Plus size={15} strokeWidth={2.5} /> Add</button>}
        </div>
      ) : (
        <div className="debt-list">
          {visible.map(d => (
            <div key={d.id} className={`debt-row${d.is_paid ? " paid" : ""}`}>
              <div className="debt-ico" style={{ background: d.color ? `${d.color}22` : "var(--plt)" }}>{d.icon ?? "💳"}</div>
              <div className="debt-info">
                <div className="debt-name">{d.name}</div>
                {d.counterparty && <div className="debt-meta">{tab === "debt" ? "To" : "From"}: {d.counterparty}</div>}
                {d.interest_rate != null && <div className="debt-meta">{d.interest_rate}% interest</div>}
              </div>
              <div className="debt-progress">
                <div className="debt-bar-wrap">
                  <div className="debt-bar" style={{ width: `${pct(d)}%`, background: d.color ?? (tab === "debt" ? "var(--rd)" : "var(--gr)") }} />
                </div>
                <span className="debt-pct">{pct(d)}% paid</span>
              </div>
              <div className="debt-right">
                <div>
                  <div className="debt-balance" style={{ color: tab === "debt" ? "var(--rd)" : "var(--gr)" }}>
                    {formatCurrency(d.balance, currency)}
                  </div>
                  <div className="debt-orig">of {formatCurrency(d.original_amount, currency)}</div>
                </div>
                <div className="debt-acts">
                  <button className="icon-btn" onClick={() => markPaid(d)} title={d.is_paid ? "Reopen" : "Mark Paid"}>
                    {d.is_paid ? "↩" : "✓"}
                  </button>
                  <button className="icon-btn" onClick={() => openEdit(d)} title="Edit"><Pencil size={13} /></button>
                  <button className="icon-btn danger" onClick={() => handleDelete(d)} title="Delete"><Trash2 size={13} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="modal-bg" onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="modal">
            <div className="modal-hdr">
              <h3>{editId ? "Edit Entry" : "Add Debt / Loan"}</h3>
              <button className="modal-close" onClick={closeModal}><X size={16} /></button>
            </div>
            {error && <div className="msg-err" style={{ margin: "0 0 12px" }}>{error}</div>}

            <div className="type-toggle" style={{ marginBottom: 16 }}>
              <button className={`tt-btn${form.type === "debt" ? " active exp" : ""}`}
                onClick={() => setForm(f => ({ ...f, type: "debt" }))}>I Owe (Debt)</button>
              <button className={`tt-btn${form.type === "loan" ? " active inc" : ""}`}
                onClick={() => setForm(f => ({ ...f, type: "loan" }))}>Owed to Me (Loan)</button>
            </div>

            <div className="modal-grid">
              <div className="fld" style={{ gridColumn: "1/-1" }}>
                <label>Name</label>
                <input type="text" placeholder="e.g. Car Loan" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus />
              </div>
              <div className="fld">
                <label>Remaining Balance</label>
                <input type="number" min="0" step="0.01" value={form.balance}
                  onChange={e => setForm(f => ({ ...f, balance: e.target.value }))} />
              </div>
              <div className="fld">
                <label>Original Amount</label>
                <input type="number" min="0" step="0.01" value={form.original_amount}
                  onChange={e => setForm(f => ({ ...f, original_amount: e.target.value }))} />
              </div>
              <div className="fld">
                <label>Interest Rate % <span style={{ color:"var(--t4)", fontWeight:400 }}>(optional)</span></label>
                <input type="number" min="0" step="0.01" placeholder="e.g. 5.5" value={form.interest_rate}
                  onChange={e => setForm(f => ({ ...f, interest_rate: e.target.value }))} />
              </div>
              <div className="fld">
                <label>Monthly Payment <span style={{ color:"var(--t4)", fontWeight:400 }}>(optional)</span></label>
                <input type="number" min="0" step="0.01" value={form.monthly_payment}
                  onChange={e => setForm(f => ({ ...f, monthly_payment: e.target.value }))} />
              </div>
              <div className="fld">
                <label>{form.type === "debt" ? "Creditor" : "Debtor"} <span style={{ color:"var(--t4)", fontWeight:400 }}>(optional)</span></label>
                <input type="text" placeholder={form.type === "debt" ? "e.g. Bank of America" : "e.g. John"} value={form.counterparty}
                  onChange={e => setForm(f => ({ ...f, counterparty: e.target.value }))} />
              </div>
              <div className="fld">
                <label>Due Date <span style={{ color:"var(--t4)", fontWeight:400 }}>(optional)</span></label>
                <input type="date" value={form.due_date}
                  onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
              </div>
              <div className="fld" style={{ gridColumn: "1/-1" }}>
                <label>Icon</label>
                <div className="icon-picker">
                  {PRESET_ICONS.map(ico => (
                    <button key={ico} type="button" className={`ico-dot${form.icon === ico ? " sel" : ""}`}
                      onClick={() => setForm(f => ({ ...f, icon: ico }))}>{ico}</button>
                  ))}
                </div>
              </div>
              <div className="fld" style={{ gridColumn: "1/-1" }}>
                <label>Color</label>
                <div className="color-picker">
                  {PRESET_COLORS.map(c => (
                    <button key={c} type="button" className={`color-dot${form.color === c ? " sel" : ""}`}
                      style={{ background: c }} onClick={() => setForm(f => ({ ...f, color: c }))} aria-label={c} />
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-ft">
              <button className="btn-ghost" onClick={closeModal}>Cancel</button>
              <button className="btn-p" style={{ width: "auto", padding: "10px 28px", marginBottom: 0 }}
                onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : editId ? "Save Changes" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
