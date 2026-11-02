"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import {
  fetchCategories, insertCategory, updateCategory, deleteCategory,
  type CatInsert,
} from "@/lib/queries/categories";
import type { Category } from "@/types";

const PRESET_COLORS = [
  "#16a34a", "#0d9488", "#2563eb", "#7c3aed",
  "#db2777", "#ea580c", "#ca8a04", "#64748b",
  "#dc2626", "#0891b2", "#9333ea", "#f59e0b",
];

const PRESET_ICONS = [
  "🍔","🏠","🚗","💊","🎮","📚","🛍️","✈️",
  "💡","☕","🎬","🏋️","💄","🐾","🎓","🔧",
  "💵","📈","💼","🎁","💰","🏦","🤝","🎯",
];

type Tab = "expense" | "income";
type FormState = { name: string; type: Tab; color: string; icon: string };
const EMPTY_FORM: FormState = { name: "", type: "expense", color: PRESET_COLORS[0], icon: PRESET_ICONS[0] };

export default function CategoriesPage({ userId }: { userId: string }) {
  const supabase = createClient();

  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("expense");
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const load = useCallback(async () => {
    setLoading(true);
    setCats(await fetchCategories(supabase, userId));
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const visible = cats.filter(c => c.type === tab);
  const expenseCount = cats.filter(c => c.type === "expense").length;
  const incomeCount  = cats.filter(c => c.type === "income").length;

  function openAdd() {
    setEditId(null);
    setForm({ ...EMPTY_FORM, type: tab });
    setError("");
    setModalOpen(true);
  }

  function openEdit(cat: Category) {
    setEditId(cat.id);
    setForm({
      name:  cat.name,
      type:  cat.type as Tab,
      color: cat.color ?? PRESET_COLORS[0],
      icon:  cat.icon  ?? PRESET_ICONS[0],
    });
    setError("");
    setModalOpen(true);
  }

  function closeModal() { setModalOpen(false); setEditId(null); setError(""); }

  async function handleSave() {
    if (!form.name.trim()) { setError("Category name is required."); return; }

    setSaving(true); setError("");
    try {
      const payload: CatInsert = {
        user_id: userId,
        name: form.name.trim(),
        type: form.type,
        color: form.color,
        icon: form.icon,
      };
      if (editId) await updateCategory(supabase, editId, payload);
      else await insertCategory(supabase, payload);
      closeModal();
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally { setSaving(false); }
  }

  async function handleDelete(cat: Category) {
    const label = cat.is_default ? `"${cat.name}" is a default category. ` : "";
    if (!confirm(`${label}Delete "${cat.name}"? Transactions using it will become uncategorized.`)) return;
    try {
      await deleteCategory(supabase, cat.id);
      await load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Could not delete — it may be in use.");
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="pg-hdr">
        <div>
          <h2 className="pg-h2">Categories</h2>
          <p className="pg-sub">{expenseCount} expense · {incomeCount} income</p>
        </div>
        <button className="btn-add" onClick={openAdd}>
          <Plus size={15} strokeWidth={2.5} /> Add Category
        </button>
      </div>

      {/* Type tabs */}
      <div className="type-tabs" style={{ marginBottom: 16 }}>
        <button className={`type-tab${tab === "expense" ? " active" : ""}`} onClick={() => setTab("expense")}>
          Expense <span className="tab-ct">{expenseCount}</span>
        </button>
        <button className={`type-tab${tab === "income" ? " active" : ""}`} onClick={() => setTab("income")}>
          Income <span className="tab-ct">{incomeCount}</span>
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <p style={{ color: "var(--t3)", fontSize: 13, padding: "2rem 0" }}>Loading…</p>
      ) : visible.length === 0 ? (
        <div className="acc-empty">
          <div className="acc-empty-ico">{tab === "expense" ? "🏷️" : "💰"}</div>
          <div className="acc-empty-ttl">No {tab} categories yet</div>
          <p className="acc-empty-sub">Create {tab} categories to organise your {tab === "expense" ? "spending" : "earnings"} by topic.</p>
          <button className="btn-add" onClick={openAdd}><Plus size={15} strokeWidth={2.5} /> Add Category</button>
        </div>
      ) : (
        <div className="cat-grid">
          {visible.map(cat => (
            <div key={cat.id} className="cat-card">
              <div className="cat-card-hd">
                <div
                  className="cat-ico"
                  style={{ background: cat.color ? `${cat.color}22` : "var(--plt)", color: cat.color ?? "var(--p)" }}
                >
                  {cat.icon ?? "🏷️"}
                </div>
                <div className="cat-acts">
                  <button className="icon-btn" onClick={() => openEdit(cat)} title="Edit"><Pencil size={13} /></button>
                  <button className="icon-btn danger" onClick={() => handleDelete(cat)} title="Delete"><Trash2 size={13} /></button>
                </div>
              </div>
              <div className="cat-name">{cat.name}</div>
              {cat.is_default && <span className="cat-default-chip">Default</span>}
              <div className="cat-color-bar" style={{ background: cat.color ?? "var(--p)" }} />
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="modal-bg" onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="modal">
            <div className="modal-hdr">
              <h3>{editId ? "Edit Category" : "Add Category"}</h3>
              <button className="modal-close" onClick={closeModal}><X size={16} /></button>
            </div>

            {error && <div className="msg-err" style={{ margin: "0 0 12px" }}>{error}</div>}

            {/* Type toggle */}
            <div className="type-toggle" style={{ marginBottom: 16 }}>
              <button
                className={`tt-btn${form.type === "expense" ? " active exp" : ""}`}
                onClick={() => setForm(f => ({ ...f, type: "expense" }))}
              >
                Expense
              </button>
              <button
                className={`tt-btn${form.type === "income" ? " active inc" : ""}`}
                onClick={() => setForm(f => ({ ...f, type: "income" }))}
              >
                Income
              </button>
            </div>

            <div className="modal-grid" style={{ gridTemplateColumns: "1fr" }}>
              <div className="fld">
                <label>Name</label>
                <input
                  type="text"
                  placeholder="e.g. Groceries"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  autoFocus
                />
              </div>

              <div className="fld">
                <label>Icon</label>
                <div className="icon-picker">
                  {PRESET_ICONS.map(ico => (
                    <button
                      key={ico}
                      type="button"
                      className={`ico-dot${form.icon === ico ? " sel" : ""}`}
                      onClick={() => setForm(f => ({ ...f, icon: ico }))}
                    >
                      {ico}
                    </button>
                  ))}
                </div>
              </div>

              <div className="fld">
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

              {/* Live preview */}
              <div className="fld">
                <label>Preview</label>
                <div className="cat-preview">
                  <div
                    className="cat-ico"
                    style={{ background: `${form.color}22`, color: form.color, width: 44, height: 44, fontSize: 20 }}
                  >
                    {form.icon}
                  </div>
                  <span className="cat-preview-name">{form.name || "Category name"}</span>
                  <div className="cat-color-bar" style={{ background: form.color, width: 40, height: 4, borderRadius: 2, marginLeft: "auto" }} />
                </div>
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
                {saving ? "Saving…" : editId ? "Save Changes" : "Add Category"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
