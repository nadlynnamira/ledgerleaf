"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUI } from "@/store/ui";
import { formatCurrency } from "@/lib/utils";
import { Plus, Pencil, Trash2, X, Trophy, PlusCircle } from "lucide-react";
import {
  fetchSavingsGoals, insertGoal, updateGoal, deleteGoal,
  type GoalInsert,
} from "@/lib/queries/savings";
import type { SavingsGoal } from "@/types";

const PRESET_ICONS = ["🏦","✈️","💻","🎓","🏠","🚗","💍","👶","🏥","🎮","📱","🎸","🌍","⛵","🐶","💰"];
const PRESET_COLORS = ["#16a34a","#0d9488","#2563eb","#7c3aed","#db2777","#ea580c","#ca8a04","#64748b"];

type FormState = {
  name: string; target_amount: string; saved_amount: string;
  icon: string; color: string; deadline: string; notes: string;
};
const EMPTY: FormState = {
  name: "", target_amount: "", saved_amount: "0",
  icon: PRESET_ICONS[0], color: PRESET_COLORS[0], deadline: "", notes: "",
};

type AddFundsState = { goalId: string; name: string; current: number; target: number };

export default function SavingsPage({ userId }: { userId: string }) {
  const { currency } = useUI();
  const supabase = createClient();

  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showAchieved, setShowAchieved] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [addFunds, setAddFunds] = useState<AddFundsState | null>(null);
  const [fundsAmt, setFundsAmt] = useState("");
  const [fundsSaving, setFundsSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setGoals(await fetchSavingsGoals(supabase, userId));
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const active = goals.filter(g => !g.is_achieved);
  const achieved = goals.filter(g => g.is_achieved);
  const visible = showAchieved ? achieved : active;

  const totalTarget = active.reduce((s, g) => s + g.target_amount, 0);
  const totalSaved  = active.reduce((s, g) => s + g.saved_amount, 0);
  const overallPct  = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

  function openAdd() {
    setEditId(null); setForm(EMPTY); setError(""); setModalOpen(true);
  }
  function openEdit(g: SavingsGoal) {
    setEditId(g.id);
    setForm({
      name: g.name,
      target_amount: String(g.target_amount),
      saved_amount: String(g.saved_amount),
      icon: g.icon ?? PRESET_ICONS[0],
      color: g.color ?? PRESET_COLORS[0],
      deadline: g.deadline ?? "",
      notes: g.notes ?? "",
    });
    setError(""); setModalOpen(true);
  }
  function closeModal() { setModalOpen(false); setEditId(null); setError(""); }

  async function handleSave() {
    if (!form.name.trim()) { setError("Goal name is required."); return; }
    const target = parseFloat(form.target_amount);
    const saved  = parseFloat(form.saved_amount);
    if (isNaN(target) || target <= 0) { setError("Enter a target amount."); return; }
    if (isNaN(saved)  || saved < 0)   { setError("Saved amount can't be negative."); return; }
    if (saved > target) { setError("Saved amount can't exceed the target."); return; }

    setSaving(true); setError("");
    try {
      const payload: GoalInsert = {
        user_id: userId,
        name: form.name.trim(),
        target_amount: target,
        saved_amount: saved,
        icon: form.icon,
        color: form.color,
        deadline: form.deadline || null,
        notes: form.notes.trim() || null,
        is_achieved: saved >= target,
      };
      if (editId) await updateGoal(supabase, editId, payload);
      else await insertGoal(supabase, payload);
      closeModal(); await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally { setSaving(false); }
  }

  async function handleDelete(g: SavingsGoal) {
    if (!confirm(`Delete "${g.name}"?`)) return;
    await deleteGoal(supabase, g.id);
    await load();
  }

  function openAddFunds(g: SavingsGoal) {
    setAddFunds({ goalId: g.id, name: g.name, current: g.saved_amount, target: g.target_amount });
    setFundsAmt("");
  }

  async function handleAddFunds() {
    if (!addFunds) return;
    const amt = parseFloat(fundsAmt);
    if (isNaN(amt) || amt <= 0) return;
    const newSaved = Math.min(addFunds.current + amt, addFunds.target);
    setFundsSaving(true);
    try {
      await updateGoal(supabase, addFunds.goalId, {
        saved_amount: newSaved,
        is_achieved: newSaved >= addFunds.target,
      });
      setAddFunds(null); setFundsAmt("");
      await load();
    } finally { setFundsSaving(false); }
  }

  function daysUntilDeadline(deadline: string): number {
    const d = new Date(deadline);
    const today = new Date(); today.setHours(0,0,0,0);
    return Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  return (
    <div>
      {/* Header */}
      <div className="pg-hdr">
        <div>
          <h2 className="pg-h2">Savings Goals</h2>
          <p className="pg-sub">{active.length} active · {achieved.length} achieved</p>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          {achieved.length > 0 && (
            <button className="btn-ghost" onClick={() => setShowAchieved(v => !v)}>
              <Trophy size={14} /> {showAchieved ? "Show Active" : `Achieved (${achieved.length})`}
            </button>
          )}
          <button className="btn-add" onClick={openAdd}><Plus size={15} strokeWidth={2.5} /> New Goal</button>
        </div>
      </div>

      {/* Overall progress strip */}
      {active.length > 0 && (
        <div className="sv-summ">
          <div className="bgt-summ-item">
            <span className="bgt-summ-lbl">Total Saved</span>
            <span className="bgt-summ-val" style={{ color:"var(--gr)" }}>{formatCurrency(totalSaved, currency)}</span>
          </div>
          <div className="bgt-summ-div" />
          <div className="bgt-summ-item">
            <span className="bgt-summ-lbl">Total Target</span>
            <span className="bgt-summ-val">{formatCurrency(totalTarget, currency)}</span>
          </div>
          <div className="bgt-summ-div" />
          <div className="bgt-summ-item">
            <span className="bgt-summ-lbl">Still Needed</span>
            <span className="bgt-summ-val">{formatCurrency(totalTarget - totalSaved, currency)}</span>
          </div>
          <div className="bgt-summ-div" />
          <div className="bgt-summ-item" style={{ flex:2 }}>
            <span className="bgt-summ-lbl">Overall Progress — {overallPct}%</span>
            <div className="sv-overall-bar">
              <div className="sv-overall-fill" style={{ width:`${overallPct}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* Goal cards */}
      {loading ? (
        <p style={{ color:"var(--t3)", fontSize:13, padding:"2rem 0" }}>Loading…</p>
      ) : visible.length === 0 ? (
        <div className="acc-empty">
          <div className="acc-empty-ico">{showAchieved ? "🏆" : "🎯"}</div>
          <div className="acc-empty-ttl">{showAchieved ? "No achieved goals yet" : "No savings goals yet"}</div>
          <p className="acc-empty-sub">
            {showAchieved
              ? "Keep saving — your completed goals will appear here."
              : "Set a target, track your progress, and celebrate when you hit it."}
          </p>
          {!showAchieved && (
            <button className="btn-add" onClick={openAdd}><Plus size={15} strokeWidth={2.5} /> New Goal</button>
          )}
        </div>
      ) : (
        <div className="sv-grid">
          {visible.map(g => {
            const pct = g.target_amount > 0 ? Math.min((g.saved_amount / g.target_amount) * 100, 100) : 0;
            const left = g.target_amount - g.saved_amount;
            const clr = g.color ?? "var(--p)";
            const days = g.deadline ? daysUntilDeadline(g.deadline) : null;

            return (
              <div key={g.id} className={`sv-card${g.is_achieved ? " achieved" : ""}`}>
                {g.is_achieved && <div className="sv-achieved-ribbon"><Trophy size={11} /> Achieved!</div>}
                <div className="sv-card-hd">
                  <div className="sv-ico" style={{ background:`${clr}22`, fontSize:22 }}>{g.icon ?? "🎯"}</div>
                  <div className="sv-acts">
                    {!g.is_achieved && (
                      <button className="icon-btn" onClick={() => openAddFunds(g)} title="Add funds">
                        <PlusCircle size={13} />
                      </button>
                    )}
                    <button className="icon-btn" onClick={() => openEdit(g)} title="Edit"><Pencil size={13} /></button>
                    <button className="icon-btn danger" onClick={() => handleDelete(g)} title="Delete"><Trash2 size={13} /></button>
                  </div>
                </div>
                <div className="sv-name">{g.name}</div>
                {g.deadline && days !== null && (
                  <div className="sv-deadline" style={{ color: days < 0 ? "var(--rd)" : days <= 30 ? "var(--ab)" : "var(--t3)" }}>
                    {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? "Due today" : `${days}d left`}
                  </div>
                )}

                {/* Progress bar */}
                <div className="sv-bar-wrap">
                  <div className="sv-bar" style={{ width:`${pct}%`, background: clr }} />
                </div>

                <div className="sv-foot">
                  <div className="sv-amounts">
                    <span className="sv-saved" style={{ color: clr }}>{formatCurrency(g.saved_amount, currency)}</span>
                    <span className="sv-of"> of </span>
                    <span className="sv-target">{formatCurrency(g.target_amount, currency)}</span>
                  </div>
                  <span className="sv-pct">{Math.round(pct)}%</span>
                </div>
                {!g.is_achieved && (
                  <div className="sv-left">{formatCurrency(left, currency)} to go</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Funds mini-modal */}
      {addFunds && (
        <div className="modal-bg" onClick={e => { if (e.target === e.currentTarget) { setAddFunds(null); } }}>
          <div className="modal" style={{ maxWidth: 360 }}>
            <div className="modal-hdr">
              <h3>Add Funds</h3>
              <button className="modal-close" onClick={() => setAddFunds(null)}><X size={16} /></button>
            </div>
            <p style={{ fontSize:13, color:"var(--t2)", marginBottom:14 }}>
              Adding to <strong>{addFunds.name}</strong> — currently {formatCurrency(addFunds.current, currency)} of {formatCurrency(addFunds.target, currency)}.
            </p>
            <div className="fld">
              <label>Amount to Add</label>
              <input type="number" min="0.01" step="0.01" placeholder="0.00"
                value={fundsAmt} onChange={e => setFundsAmt(e.target.value)} autoFocus />
            </div>
            <div className="modal-ft">
              <button className="btn-ghost" onClick={() => setAddFunds(null)}>Cancel</button>
              <button className="btn-p" style={{ width:"auto", padding:"10px 28px", marginBottom:0 }}
                onClick={handleAddFunds} disabled={fundsSaving}>
                {fundsSaving ? "Saving…" : "Add Funds"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Goal Modal */}
      {modalOpen && (
        <div className="modal-bg" onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="modal">
            <div className="modal-hdr">
              <h3>{editId ? "Edit Goal" : "New Savings Goal"}</h3>
              <button className="modal-close" onClick={closeModal}><X size={16} /></button>
            </div>
            {error && <div className="msg-err" style={{ margin:"0 0 12px" }}>{error}</div>}

            <div className="modal-grid">
              <div className="fld" style={{ gridColumn:"1/-1" }}>
                <label>Goal Name</label>
                <input type="text" placeholder="e.g. Emergency Fund" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus />
              </div>
              <div className="fld">
                <label>Target Amount</label>
                <input type="number" min="0" step="0.01" placeholder="0.00" value={form.target_amount}
                  onChange={e => setForm(f => ({ ...f, target_amount: e.target.value }))} />
              </div>
              <div className="fld">
                <label>Already Saved</label>
                <input type="number" min="0" step="0.01" placeholder="0.00" value={form.saved_amount}
                  onChange={e => setForm(f => ({ ...f, saved_amount: e.target.value }))} />
              </div>
              <div className="fld">
                <label>Deadline <span style={{ color:"var(--t4)", fontWeight:400 }}>(optional)</span></label>
                <input type="date" value={form.deadline}
                  onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
              </div>
              <div className="fld">
                <label>Notes <span style={{ color:"var(--t4)", fontWeight:400 }}>(optional)</span></label>
                <input type="text" placeholder="e.g. 3 months expenses" value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>

              {/* Icon picker */}
              <div className="fld" style={{ gridColumn:"1/-1" }}>
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
              <div className="fld" style={{ gridColumn:"1/-1" }}>
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
            </div>

            <div className="modal-ft">
              <button className="btn-ghost" onClick={closeModal}>Cancel</button>
              <button className="btn-p" style={{ width:"auto", padding:"10px 28px", marginBottom:0 }}
                onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : editId ? "Save Changes" : "Create Goal"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
