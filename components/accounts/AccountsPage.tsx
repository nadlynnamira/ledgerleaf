"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUI } from "@/store/ui";
import { formatCurrency } from "@/lib/utils";
import {
  fetchAccounts, insertAccount, updateAccount, deleteAccount,
  type AccInsert,
} from "@/lib/queries/accounts";
import type { Account } from "@/types";
import { Plus, Pencil, Trash2, X, Building2, CreditCard, Landmark, Wallet } from "lucide-react";

const ACCOUNT_TYPES = [
  { value: "checking", label: "Checking" },
  { value: "savings",  label: "Savings" },
  { value: "credit",   label: "Credit Card" },
  { value: "cash",     label: "Cash" },
];

const PRESET_COLORS = [
  "#16a34a", "#0d9488", "#2563eb", "#7c3aed",
  "#db2777", "#ea580c", "#ca8a04", "#64748b",
];

function TypeIcon({ type }: { type: string }) {
  switch (type) {
    case "savings":  return <Landmark size={20} />;
    case "credit":   return <CreditCard size={20} />;
    case "cash":     return <Wallet size={20} />;
    default:         return <Building2 size={20} />;
  }
}

type FormState = { name: string; type: string; balance: string; color: string };
const EMPTY_FORM: FormState = { name: "", type: "checking", balance: "", color: PRESET_COLORS[0] };

export default function AccountsPage({ userId }: { userId: string }) {
  const { currency } = useUI();
  const supabase = createClient();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchAccounts(supabase, userId);
    setAccounts(data);
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  function openAdd() {
    setEditId(null); setForm(EMPTY_FORM); setError(""); setModalOpen(true);
  }

  function openEdit(acc: Account) {
    setEditId(acc.id);
    setForm({ name: acc.name, type: acc.type, balance: String(acc.balance), color: acc.color ?? PRESET_COLORS[0] });
    setError(""); setModalOpen(true);
  }

  function closeModal() { setModalOpen(false); setEditId(null); setError(""); }

  async function handleSave() {
    if (!form.name.trim()) { setError("Account name is required."); return; }
    const bal = parseFloat(form.balance);
    if (form.balance === "" || isNaN(bal)) { setError("Enter a valid balance (use 0 if unknown)."); return; }

    setSaving(true); setError("");
    try {
      const payload: AccInsert = {
        user_id: userId,
        name: form.name.trim(),
        type: form.type,
        balance: bal,
        currency: "USD",
        color: form.color,
      };
      if (editId) await updateAccount(supabase, editId, payload);
      else await insertAccount(supabase, payload);
      closeModal();
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally { setSaving(false); }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? Its transactions will remain but won't be linked to an account.`)) return;
    await deleteAccount(supabase, id);
    await load();
  }

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);
  const typeLabel = (t: string) => ACCOUNT_TYPES.find(a => a.value === t)?.label ?? t;

  return (
    <div>
      {/* Header */}
      <div className="pg-hdr">
        <div>
          <h2 className="pg-h2">Accounts</h2>
          <p className="pg-sub">
            {accounts.length} account{accounts.length !== 1 ? "s" : ""}
            {accounts.length > 0 && <> · Net balance {formatCurrency(totalBalance, currency)}</>}
          </p>
        </div>
        <button className="btn-add" onClick={openAdd}>
          <Plus size={15} strokeWidth={2.5} /> Add Account
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <p style={{ color: "var(--t3)", fontSize: 13, padding: "2rem 0" }}>Loading…</p>
      ) : accounts.length === 0 ? (
        <div className="acc-empty">
          <div className="acc-empty-ico">🏦</div>
          <div className="acc-empty-ttl">No accounts yet</div>
          <p className="acc-empty-sub">Add your first account to start tracking your finances.</p>
          <button className="btn-add" onClick={openAdd}><Plus size={15} strokeWidth={2.5} /> Add Account</button>
        </div>
      ) : (
        <div className="acc-grid">
          {accounts.map(acc => (
            <div
              key={acc.id}
              className="acc-card"
              style={{ "--acc-clr": acc.color ?? PRESET_COLORS[0] } as React.CSSProperties}
            >
              <div className="acc-card-hd">
                <div className="acc-ico"><TypeIcon type={acc.type} /></div>
                <div className="acc-card-acts">
                  <button className="icon-btn" onClick={() => openEdit(acc)} title="Edit"><Pencil size={13} /></button>
                  <button className="icon-btn danger" onClick={() => handleDelete(acc.id, acc.name)} title="Delete"><Trash2 size={13} /></button>
                </div>
              </div>
              <div className="acc-name">{acc.name}</div>
              <span className={`acc-type acc-type-${acc.type}`}>{typeLabel(acc.type)}</span>
              <div className={`acc-bal${acc.balance < 0 ? " neg" : ""}`}>
                {formatCurrency(acc.balance, currency)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="modal-bg" onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="modal">
            <div className="modal-hdr">
              <h3>{editId ? "Edit Account" : "Add Account"}</h3>
              <button className="modal-close" onClick={closeModal}><X size={16} /></button>
            </div>

            {error && <div className="msg-err" style={{ margin: "0 0 12px" }}>{error}</div>}

            <div className="modal-grid">
              <div className="fld" style={{ gridColumn: "1/-1" }}>
                <label>Account Name</label>
                <input type="text" placeholder="e.g. Main Checking" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="fld">
                <label>Type</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  {ACCOUNT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="fld">
                <label>Current Balance</label>
                <input type="number" step="0.01" placeholder="0.00" value={form.balance} onChange={e => setForm(f => ({ ...f, balance: e.target.value }))} />
              </div>
              <div className="fld" style={{ gridColumn: "1/-1" }}>
                <label>Color</label>
                <div className="color-picker">
                  {PRESET_COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      className={`color-dot${form.color === c ? " sel" : ""}`}
                      style={{ background: c }}
                      onClick={() => setForm(f => ({ ...f, color: c }))}
                      aria-label={c}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-ft">
              <button className="btn-ghost" onClick={closeModal}>Cancel</button>
              <button className="btn-p" style={{ width: "auto", padding: "10px 28px", marginBottom: 0 }} onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : editId ? "Save Changes" : "Add Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
