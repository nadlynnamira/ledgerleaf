"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUI } from "@/store/ui";
import { formatCurrency } from "@/lib/utils";
import {
  fetchTransactions, fetchCategories, fetchAccounts,
  insertTransaction, updateTransaction, deleteTransaction,
  type TxRow, type TxInsert,
} from "@/lib/queries/transactions";
import type { Category, Account } from "@/types";
import { Plus, Pencil, Trash2, X, Search, TrendingUp, TrendingDown } from "lucide-react";

const today = () => new Date().toISOString().slice(0, 10);

type FormState = {
  type: "income" | "expense";
  description: string;
  amount: string;
  date: string;
  category_id: string;
  account_id: string;
  notes: string;
  is_recurring: boolean;
};

const EMPTY_FORM: FormState = {
  type: "expense",
  description: "",
  amount: "",
  date: today(),
  category_id: "",
  account_id: "",
  notes: "",
  is_recurring: false,
};

export default function TransactionPage({ userId, initialSearch = "" }: { userId: string; initialSearch?: string }) {
  const { currency } = useUI();
  const supabase = createClient();

  const [txns, setTxns] = useState<TxRow[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  // Filters
  const [search, setSearch] = useState(initialSearch);
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");

  const load = useCallback(async () => {
    setLoading(true);
    const [t, c, a] = await Promise.all([
      fetchTransactions(supabase, userId),
      fetchCategories(supabase, userId),
      fetchAccounts(supabase, userId),
    ]);
    setTxns(t); setCats(c); setAccounts(a);
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  function openAdd() {
    setEditId(null);
    setForm({ ...EMPTY_FORM, account_id: accounts[0]?.id ?? "", date: today() });
    setError("");
    setModalOpen(true);
  }

  function openEdit(tx: TxRow) {
    setEditId(tx.id);
    setForm({
      type: tx.type as "income" | "expense",
      description: tx.description,
      amount: String(tx.amount),
      date: tx.date,
      category_id: tx.category_id ?? "",
      account_id: tx.account_id,
      notes: tx.notes ?? "",
      is_recurring: tx.is_recurring,
    });
    setError("");
    setModalOpen(true);
  }

  function closeModal() { setModalOpen(false); setEditId(null); setError(""); }

  async function handleSave() {
    if (!form.description.trim()) { setError("Description is required."); return; }
    const amt = parseFloat(form.amount);
    if (isNaN(amt) || amt <= 0) { setError("Enter a valid amount greater than 0."); return; }
    if (!form.account_id) { setError("Select an account."); return; }
    if (!form.date) { setError("Select a date."); return; }

    setSaving(true); setError("");
    try {
      const payload: TxInsert = {
        user_id: userId,
        account_id: form.account_id,
        category_id: form.category_id || null,
        type: form.type,
        amount: amt,
        description: form.description.trim(),
        date: form.date,
        notes: form.notes.trim() || null,
        is_recurring: form.is_recurring,
      };
      if (editId) await updateTransaction(supabase, editId, payload);
      else await insertTransaction(supabase, payload);
      closeModal();
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this transaction?")) return;
    await deleteTransaction(supabase, id);
    await load();
  }

  // Filtered list
  const filtered = txns.filter(t => {
    if (filterType !== "all" && t.type !== filterType) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchDesc = t.description.toLowerCase().includes(q);
      const matchCat = (t.categories?.name ?? "").toLowerCase().includes(q);
      const matchAcc = (t.accounts?.name ?? "").toLowerCase().includes(q);
      if (!matchDesc && !matchCat && !matchAcc) return false;
    }
    return true;
  });

  const filteredCats = cats.filter(c => c.type === form.type);

  return (
    <div>
      {/* Header */}
      <div className="pg-hdr">
        <div>
          <h2 className="pg-h2">Transactions</h2>
          <p className="pg-sub">{txns.length} transaction{txns.length !== 1 ? "s" : ""} total</p>
        </div>
        <button className="btn-add" onClick={openAdd} disabled={accounts.length === 0}>
          <Plus size={15} strokeWidth={2.5} /> Add Transaction
        </button>
      </div>

      {accounts.length === 0 && !loading && (
        <div className="msg-warn">
          You need at least one account before adding transactions. Go to <b>Accounts</b> in the sidebar to create one.
        </div>
      )}

      {/* Filters */}
      <div className="tx-filters">
        <div className="search-wrap">
          <Search size={14} className="search-ico" />
          <input
            className="search-inp"
            placeholder="Search transactions…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="type-tabs">
          {(["all", "income", "expense"] as const).map(t => (
            <button key={t} className={`type-tab ${filterType === t ? "active" : ""}`} onClick={() => setFilterType(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <p style={{ padding: "2rem", textAlign: "center", color: "var(--t3)", fontSize: 13 }}>Loading…</p>
        ) : filtered.length === 0 ? (
          <p style={{ padding: "2.5rem", textAlign: "center", color: "var(--t3)", fontSize: 13 }}>
            {txns.length === 0 ? "No transactions yet. Add your first one above." : "No results match your filter."}
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="tx-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Account</th>
                  <th>Type</th>
                  <th style={{ textAlign: "right" }}>Amount</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(tx => (
                  <tr key={tx.id}>
                    <td className="tx-date">{new Date(tx.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                    <td className="tx-desc">
                      {tx.description}
                      {tx.is_recurring && <span className="chip-rec">Recurring</span>}
                    </td>
                    <td>
                      {tx.categories ? (
                        <span className="cat-chip" style={{ background: tx.categories.color ? `${tx.categories.color}22` : "var(--plt)", color: tx.categories.color ?? "var(--p)" }}>
                          {tx.categories.name}
                        </span>
                      ) : <span className="tx-none">—</span>}
                    </td>
                    <td className="tx-acc">{tx.accounts?.name ?? "—"}</td>
                    <td>
                      <span className={`type-badge ${tx.type}`}>
                        {tx.type === "income" ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                        {tx.type}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }} className={`tx-amt ${tx.type}`}>
                      {tx.type === "expense" ? "-" : "+"}{formatCurrency(tx.amount, currency)}
                    </td>
                    <td className="tx-actions">
                      <button className="icon-btn" onClick={() => openEdit(tx)} title="Edit"><Pencil size={13} /></button>
                      <button className="icon-btn danger" onClick={() => handleDelete(tx.id)} title="Delete"><Trash2 size={13} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="modal-bg" onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="modal">
            <div className="modal-hdr">
              <h3>{editId ? "Edit Transaction" : "Add Transaction"}</h3>
              <button className="modal-close" onClick={closeModal}><X size={16} /></button>
            </div>

            {error && <div className="msg-err" style={{ margin: "0 0 12px" }}>{error}</div>}

            {/* Type toggle */}
            <div className="type-toggle">
              <button className={`tt-btn ${form.type === "expense" ? "active exp" : ""}`} onClick={() => setForm(f => ({ ...f, type: "expense", category_id: "" }))}>
                <TrendingDown size={14} /> Expense
              </button>
              <button className={`tt-btn ${form.type === "income" ? "active inc" : ""}`} onClick={() => setForm(f => ({ ...f, type: "income", category_id: "" }))}>
                <TrendingUp size={14} /> Income
              </button>
            </div>

            <div className="modal-grid">
              <div className="fld" style={{ gridColumn: "1/-1" }}>
                <label>Description</label>
                <input type="text" placeholder="e.g. Groceries at Tesco" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="fld">
                <label>Amount</label>
                <input type="number" min="0" step="0.01" placeholder="0.00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
              </div>
              <div className="fld">
                <label>Date</label>
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div className="fld">
                <label>Category</label>
                <select value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}>
                  <option value="">— No category —</option>
                  {filteredCats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="fld">
                <label>Account</label>
                <select value={form.account_id} onChange={e => setForm(f => ({ ...f, account_id: e.target.value }))}>
                  <option value="">— Select account —</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div className="fld" style={{ gridColumn: "1/-1" }}>
                <label>Notes (optional)</label>
                <input type="text" placeholder="Any extra notes…" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <div className="fld chk-fld" style={{ gridColumn: "1/-1" }}>
                <label className="chk-label">
                  <input type="checkbox" checked={form.is_recurring} onChange={e => setForm(f => ({ ...f, is_recurring: e.target.checked }))} />
                  Recurring transaction
                </label>
              </div>
            </div>

            <div className="modal-ft">
              <button className="btn-ghost" onClick={closeModal}>Cancel</button>
              <button className="btn-p" style={{ width: "auto", padding: "10px 28px", marginBottom: 0 }} onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : editId ? "Save Changes" : "Add Transaction"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
