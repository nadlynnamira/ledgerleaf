"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUI } from "@/store/ui";
import { formatCurrency } from "@/lib/utils";
import { Plus, Pencil, Trash2, X, ToggleLeft, ToggleRight, AlertCircle } from "lucide-react";
import {
  fetchBills, insertBill, updateBill, deleteBill, getDaysUntilDue,
  type BillInsert,
} from "@/lib/queries/bills";
import type { Bill } from "@/types";

const PRESET_ICONS = ["💡","🏠","📱","🌐","🎬","🎵","☁️","🏋️","🚗","📺","🛡️","💊","🧾","🔧","💳","🎮"];
const PRESET_COLORS = ["#16a34a","#0d9488","#2563eb","#7c3aed","#db2777","#ea580c","#ca8a04","#64748b"];
const FREQ_LABELS: Record<Bill["frequency"], string> = {
  weekly: "Weekly", monthly: "Monthly", quarterly: "Quarterly", yearly: "Yearly",
};

type FormState = {
  name: string; amount: string; due_day: string;
  frequency: Bill["frequency"]; icon: string; color: string; notes: string; is_active: boolean;
};
const EMPTY: FormState = {
  name: "", amount: "", due_day: "1", frequency: "monthly",
  icon: PRESET_ICONS[0], color: PRESET_COLORS[0], notes: "", is_active: true,
};

function DueBadge({ days }: { days: number }) {
  if (days === 0) return <span className="bill-badge due-today">Due today</span>;
  if (days < 0)  return <span className="bill-badge overdue">Overdue</span>;
  if (days <= 3) return <span className="bill-badge due-soon">{days}d away</span>;
  if (days <= 7) return <span className="bill-badge due-week">{days}d away</span>;
  return <span className="bill-badge due-later">{days}d away</span>;
}

export default function BillsPage({ userId }: { userId: string }) {
  const { currency } = useUI();
  const supabase = createClient();

  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("active");
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);

  const load = useCallback(async () => {
    setLoading(true);
    setBills(await fetchBills(supabase, userId));
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const visible = bills.filter(b =>
    filter === "all" ? true : filter === "active" ? b.is_active : !b.is_active
  );

  // Summary
  const active = bills.filter(b => b.is_active);
  const monthlyTotal = active.reduce((sum, b) => {
    if (b.frequency === "monthly")   return sum + b.amount;
    if (b.frequency === "weekly")    return sum + b.amount * 4.33;
    if (b.frequency === "quarterly") return sum + b.amount / 3;
    if (b.frequency === "yearly")    return sum + b.amount / 12;
    return sum;
  }, 0);
  const dueSoon = active.filter(b => getDaysUntilDue(b.due_day, b.frequency) <= 7).length;

  function openAdd() {
    setEditId(null); setForm(EMPTY); setError(""); setModalOpen(true);
  }
  function openEdit(b: Bill) {
    setEditId(b.id);
    setForm({
      name: b.name, amount: String(b.amount), due_day: String(b.due_day),
      frequency: b.frequency, icon: b.icon ?? PRESET_ICONS[0],
      color: b.color ?? PRESET_COLORS[0], notes: b.notes ?? "", is_active: b.is_active,
    });
    setError(""); setModalOpen(true);
  }
  function closeModal() { setModalOpen(false); setEditId(null); setError(""); }

  async function handleSave() {
    if (!form.name.trim()) { setError("Bill name is required."); return; }
    const amt = parseFloat(form.amount);
    if (isNaN(amt) || amt <= 0) { setError("Enter a valid amount."); return; }
    const day = parseInt(form.due_day, 10);
    if (isNaN(day) || day < 1 || day > 31) { setError("Due day must be 1–31."); return; }

    setSaving(true); setError("");
    try {
      const payload: BillInsert = {
        user_id: userId, name: form.name.trim(), amount: amt, due_day: day,
        frequency: form.frequency, icon: form.icon, color: form.color,
        notes: form.notes.trim() || null, is_active: form.is_active,
      };
      if (editId) await updateBill(supabase, editId, payload);
      else await insertBill(supabase, payload);
      closeModal(); await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally { setSaving(false); }
  }

  async function handleDelete(b: Bill) {
    if (!confirm(`Delete "${b.name}"?`)) return;
    await deleteBill(supabase, b.id);
    await load();
  }

  async function handleToggleActive(b: Bill) {
    await updateBill(supabase, b.id, { is_active: !b.is_active });
    await load();
  }

  return (
    <div>
      {/* Header */}
      <div className="pg-hdr">
        <div>
          <h2 className="pg-h2">Bills & Subscriptions</h2>
          <p className="pg-sub">{active.length} active · {formatCurrency(monthlyTotal, currency)}/mo estimated</p>
        </div>
        <button className="btn-add" onClick={openAdd}><Plus size={15} strokeWidth={2.5} /> Add Bill</button>
      </div>

      {/* Summary strip */}
      {bills.length > 0 && (
        <div className="bill-summ">
          <div className="bgt-summ-item">
            <span className="bgt-summ-lbl">Active Bills</span>
            <span className="bgt-summ-val">{active.length}</span>
          </div>
          <div className="bgt-summ-div" />
          <div className="bgt-summ-item">
            <span className="bgt-summ-lbl">Monthly Cost</span>
            <span className="bgt-summ-val">{formatCurrency(monthlyTotal, currency)}</span>
          </div>
          <div className="bgt-summ-div" />
          <div className="bgt-summ-item">
            <span className="bgt-summ-lbl">Due This Week</span>
            <span className="bgt-summ-val" style={{ color: dueSoon > 0 ? "var(--ab)" : undefined }}>
              {dueSoon > 0 ? <><AlertCircle size={14} style={{ display:"inline",marginRight:4,verticalAlign:"middle" }} />{dueSoon}</> : "0"}
            </span>
          </div>
          <div className="bgt-summ-div" />
          <div className="bgt-summ-item">
            <span className="bgt-summ-lbl">Yearly Cost</span>
            <span className="bgt-summ-val">{formatCurrency(monthlyTotal * 12, currency)}</span>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="type-tabs" style={{ marginBottom: 16 }}>
        {(["active","all","inactive"] as const).map(f => (
          <button key={f} className={`type-tab${filter === f ? " active" : ""}`} onClick={() => setFilter(f)}>
            {f === "active" ? "Active" : f === "all" ? "All" : "Inactive"}
            <span className="tab-ct">
              {f === "active" ? active.length : f === "all" ? bills.length : bills.length - active.length}
            </span>
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <p style={{ color: "var(--t3)", fontSize: 13, padding: "2rem 0" }}>Loading…</p>
      ) : visible.length === 0 ? (
        <div className="acc-empty">
          <div className="acc-empty-ico">🧾</div>
          <div className="acc-empty-ttl">{filter === "inactive" ? "No inactive bills" : "No bills yet"}</div>
          <p className="acc-empty-sub">Track recurring bills — rent, subscriptions, utilities — and never miss a due date.</p>
          {filter !== "inactive" && (
            <button className="btn-add" onClick={openAdd}><Plus size={15} strokeWidth={2.5} /> Add Bill</button>
          )}
        </div>
      ) : (
        <div className="bill-list">
          {visible.map(b => {
            const days = getDaysUntilDue(b.due_day, b.frequency);
            return (
              <div key={b.id} className={`bill-row${!b.is_active ? " inactive" : ""}`}>
                <div className="bill-ico" style={{ background: b.color ? `${b.color}22` : "var(--plt)" }}>
                  <span>{b.icon ?? "🧾"}</span>
                </div>
                <div className="bill-info">
                  <div className="bill-name">{b.name}</div>
                  <div className="bill-meta">
                    <span className="bill-freq">{FREQ_LABELS[b.frequency]}</span>
                    <span className="bill-dot">·</span>
                    <span className="bill-day">Due day {b.due_day}</span>
                  </div>
                </div>
                <div className="bill-mid">
                  {b.is_active && <DueBadge days={days} />}
                </div>
                <div className="bill-right">
                  <span className="bill-amount">{formatCurrency(b.amount, currency)}</span>
                  <div className="bill-acts">
                    <button
                      className="icon-btn"
                      title={b.is_active ? "Deactivate" : "Activate"}
                      onClick={() => handleToggleActive(b)}
                    >
                      {b.is_active ? <ToggleRight size={15} style={{ color: "var(--p)" }} /> : <ToggleLeft size={15} />}
                    </button>
                    <button className="icon-btn" onClick={() => openEdit(b)} title="Edit"><Pencil size={13} /></button>
                    <button className="icon-btn danger" onClick={() => handleDelete(b)} title="Delete"><Trash2 size={13} /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="modal-bg" onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="modal">
            <div className="modal-hdr">
              <h3>{editId ? "Edit Bill" : "Add Bill"}</h3>
              <button className="modal-close" onClick={closeModal}><X size={16} /></button>
            </div>

            {error && <div className="msg-err" style={{ margin: "0 0 12px" }}>{error}</div>}

            <div className="modal-grid">
              {/* Name */}
              <div className="fld" style={{ gridColumn: "1/-1" }}>
                <label>Name</label>
                <input type="text" placeholder="e.g. Netflix" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus />
              </div>
              {/* Amount */}
              <div className="fld">
                <label>Amount</label>
                <input type="number" min="0" step="0.01" placeholder="0.00" value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
              </div>
              {/* Frequency */}
              <div className="fld">
                <label>Frequency</label>
                <select value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value as Bill["frequency"] }))}>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              {/* Due day */}
              <div className="fld">
                <label>Due Day of Month</label>
                <input type="number" min="1" max="31" placeholder="1–31" value={form.due_day}
                  onChange={e => setForm(f => ({ ...f, due_day: e.target.value }))} />
              </div>
              {/* Active toggle */}
              <div className="fld" style={{ display:"flex",alignItems:"center",gap:10 }}>
                <label style={{ margin:0 }}>Active</label>
                <button
                  type="button"
                  style={{ background:"none",border:"none",cursor:"pointer",padding:0 }}
                  onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                >
                  {form.is_active
                    ? <ToggleRight size={28} style={{ color:"var(--p)" }} />
                    : <ToggleLeft size={28} style={{ color:"var(--t4)" }} />}
                </button>
              </div>

              {/* Icon picker */}
              <div className="fld" style={{ gridColumn: "1/-1" }}>
                <label>Icon</label>
                <div className="icon-picker">
                  {PRESET_ICONS.map(ico => (
                    <button key={ico} type="button"
                      className={`ico-dot${form.icon === ico ? " sel" : ""}`}
                      onClick={() => setForm(f => ({ ...f, icon: ico }))}>{ico}</button>
                  ))}
                </div>
              </div>

              {/* Color picker */}
              <div className="fld" style={{ gridColumn: "1/-1" }}>
                <label>Color</label>
                <div className="color-picker">
                  {PRESET_COLORS.map(c => (
                    <button key={c} type="button"
                      className={`color-dot${form.color === c ? " sel" : ""}`}
                      style={{ background: c }}
                      onClick={() => setForm(f => ({ ...f, color: c }))}
                      aria-label={c} />
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="fld" style={{ gridColumn: "1/-1" }}>
                <label>Notes <span style={{ color:"var(--t4)", fontWeight:400 }}>(optional)</span></label>
                <input type="text" placeholder="e.g. Auto-renews annually" value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>

            <div className="modal-ft">
              <button className="btn-ghost" onClick={closeModal}>Cancel</button>
              <button className="btn-p"
                style={{ width:"auto", padding:"10px 28px", marginBottom:0 }}
                onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : editId ? "Save Changes" : "Add Bill"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
