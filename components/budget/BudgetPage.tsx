"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUI } from "@/store/ui";
import { formatCurrency, getPastMonths } from "@/lib/utils";
import {
  fetchBudgets, fetchCategorySpending, fetchExpenseCategories,
  upsertBudget, deleteBudget,
  type BudgetRow, type BudgetInsert,
} from "@/lib/queries/budgets";
import type { Category } from "@/types";
import { Plus, Pencil, Trash2, X, ChevronDown, AlertTriangle } from "lucide-react";

const MONTHS = getPastMonths(25);

function parseYM(value: string) {
  const [y, m] = value.split("-").map(Number);
  return { year: y, month: m };
}

type FormState = { category_id: string; amount: string };
const EMPTY_FORM: FormState = { category_id: "", amount: "" };

export default function BudgetPage({ userId }: { userId: string }) {
  const { currency } = useUI();
  const supabase = createClient();

  const [selectedMonth, setSelectedMonth] = useState(MONTHS[0]?.value ?? "");
  const [budgets, setBudgets] = useState<BudgetRow[]>([]);
  const [spending, setSpending] = useState<Record<string, number>>({});
  const [allCats, setAllCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editBudget, setEditBudget] = useState<BudgetRow | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const load = useCallback(async () => {
    setLoading(true);
    const { year, month } = parseYM(selectedMonth);
    const [b, s, c] = await Promise.all([
      fetchBudgets(supabase, userId, month, year),
      fetchCategorySpending(supabase, userId, month, year),
      fetchExpenseCategories(supabase, userId),
    ]);
    setBudgets(b);
    setSpending(s);
    setAllCats(c);
    setLoading(false);
  }, [userId, selectedMonth]);

  useEffect(() => { load(); }, [load]);

  // Categories that don't have a budget yet this month (for the add form)
  const budgetedCatIds = new Set(budgets.map(b => b.category_id));
  const availableCats = allCats.filter(c => !budgetedCatIds.has(c.id));

  function openAdd() {
    setEditBudget(null);
    setForm({ category_id: availableCats[0]?.id ?? "", amount: "" });
    setError("");
    setModalOpen(true);
  }

  function openEdit(b: BudgetRow) {
    setEditBudget(b);
    setForm({ category_id: b.category_id, amount: String(b.amount) });
    setError("");
    setModalOpen(true);
  }

  function closeModal() { setModalOpen(false); setEditBudget(null); setError(""); }

  async function handleSave() {
    if (!form.category_id) { setError("Select a category."); return; }
    const amt = parseFloat(form.amount);
    if (isNaN(amt) || amt <= 0) { setError("Enter a budget amount greater than 0."); return; }

    setSaving(true); setError("");
    try {
      const { year, month } = parseYM(selectedMonth);
      const payload: BudgetInsert = {
        user_id: userId,
        category_id: form.category_id,
        amount: amt,
        month,
        year,
      };
      await upsertBudget(supabase, payload);
      closeModal();
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this budget?")) return;
    await deleteBudget(supabase, id);
    await load();
  }

  // Summary totals
  const totalBudgeted = budgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent    = budgets.reduce((s, b) => s + (spending[b.category_id] ?? 0), 0);
  const totalLeft     = totalBudgeted - totalSpent;

  const monthLabel = MONTHS.find(m => m.value === selectedMonth)?.label ?? "";

  return (
    <div>
      {/* Header */}
      <div className="pg-hdr">
        <div>
          <h2 className="pg-h2">Budget</h2>
          <p className="pg-sub">{budgets.length} categor{budgets.length !== 1 ? "ies" : "y"} budgeted for {monthLabel}</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div className="bgt-month-wrap">
            <select
              className="bgt-month-sel"
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
            >
              {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
            <ChevronDown size={12} className="bgt-month-chev" />
          </div>
          <button className="btn-add" onClick={openAdd} disabled={availableCats.length === 0 && !editBudget}>
            <Plus size={15} strokeWidth={2.5} /> Add Budget
          </button>
        </div>
      </div>

      {/* Summary strip */}
      {budgets.length > 0 && (
        <div className="bgt-summ">
          <div className="bgt-summ-item">
            <span className="bgt-summ-lbl">Budgeted</span>
            <span className="bgt-summ-val">{formatCurrency(totalBudgeted, currency)}</span>
          </div>
          <div className="bgt-summ-div" />
          <div className="bgt-summ-item">
            <span className="bgt-summ-lbl">Spent</span>
            <span className="bgt-summ-val" style={{ color: totalSpent > 0 ? "var(--rd)" : undefined }}>{formatCurrency(totalSpent, currency)}</span>
          </div>
          <div className="bgt-summ-div" />
          <div className="bgt-summ-item">
            <span className="bgt-summ-lbl">{totalLeft >= 0 ? "Remaining" : "Over budget"}</span>
            <span className="bgt-summ-val" style={{ color: totalLeft < 0 ? "var(--rd)" : "var(--gr)" }}>
              {totalLeft < 0 ? "-" : ""}{formatCurrency(Math.abs(totalLeft), currency)}
            </span>
          </div>
        </div>
      )}

      {/* Budget list */}
      {loading ? (
        <p style={{ color: "var(--t3)", fontSize: 13, padding: "2rem 0" }}>Loading…</p>
      ) : budgets.length === 0 ? (
        <div className="acc-empty">
          <div className="acc-empty-ico">📊</div>
          <div className="acc-empty-ttl">No budgets for {monthLabel}</div>
          <p className="acc-empty-sub">
            {allCats.length === 0
              ? "Add expense categories first, then set budgets for them."
              : "Set a monthly spending limit for each category to stay on track."}
          </p>
          {allCats.length > 0 && (
            <button className="btn-add" onClick={openAdd}><Plus size={15} strokeWidth={2.5} /> Add Budget</button>
          )}
        </div>
      ) : (
        <div className="bgt-list">
          {budgets.map(b => {
            const spent   = spending[b.category_id] ?? 0;
            const pct     = Math.min((spent / b.amount) * 100, 100);
            const over    = spent > b.amount;
            const left    = b.amount - spent;
            const catColor = b.categories?.color ?? "var(--p)";

            return (
              <div key={b.id} className={`bgt-row${over ? " over" : ""}`}>
                <div className="bgt-row-top">
                  <div className="bgt-cat-info">
                    <div className="bgt-cat-dot" style={{ background: catColor }} />
                    <span className="bgt-cat-name">{b.categories?.name ?? "Unknown"}</span>
                    {over && <span className="bgt-over-chip"><AlertTriangle size={10} /> Over</span>}
                  </div>
                  <div className="bgt-row-acts">
                    <span className="bgt-amounts">
                      {formatCurrency(spent, currency)} <span className="bgt-of">of</span> {formatCurrency(b.amount, currency)}
                    </span>
                    <button className="icon-btn" onClick={() => openEdit(b)} title="Edit"><Pencil size={13} /></button>
                    <button className="icon-btn danger" onClick={() => handleDelete(b.id)} title="Delete"><Trash2 size={13} /></button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="bgt-bar-wrap">
                  <div
                    className={`bgt-bar${over ? " over" : pct >= 80 ? " warn" : ""}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="bgt-row-ft">
                  <span className="bgt-pct">{Math.round((spent / b.amount) * 100)}% used</span>
                  <span className={`bgt-left${over ? " over" : ""}`}>
                    {over
                      ? `${formatCurrency(Math.abs(left), currency)} over budget`
                      : `${formatCurrency(left, currency)} remaining`}
                  </span>
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
              <h3>{editBudget ? "Edit Budget" : "Add Budget"}</h3>
              <button className="modal-close" onClick={closeModal}><X size={16} /></button>
            </div>

            {error && <div className="msg-err" style={{ margin: "0 0 12px" }}>{error}</div>}

            <div className="modal-grid">
              <div className="fld" style={{ gridColumn: "1/-1" }}>
                <label>Category</label>
                {editBudget ? (
                  <input type="text" value={editBudget.categories?.name ?? ""} readOnly style={{ opacity: 0.7, cursor: "not-allowed" }} />
                ) : (
                  <select value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}>
                    <option value="">— Select category —</option>
                    {availableCats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                )}
              </div>
              <div className="fld" style={{ gridColumn: "1/-1" }}>
                <label>Monthly Budget Amount</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 500.00"
                  value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  autoFocus
                />
              </div>
            </div>

            <div className="modal-ft">
              <button className="btn-ghost" onClick={closeModal}>Cancel</button>
              <button
                className="btn-p"
                style={{ width: "auto", padding: "10px 28px", marginBottom: 0 }}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Saving…" : editBudget ? "Save Changes" : "Add Budget"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
