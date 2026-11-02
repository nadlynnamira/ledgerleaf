"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUI } from "@/store/ui";
import { formatCurrency } from "@/lib/utils";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { fetchAssets, insertAsset, updateAsset, deleteAsset, type AssetInsert } from "@/lib/queries/assets";
import type { Asset } from "@/types";

const ASSET_CATS = [
  { value: "property", label: "Property / Real Estate" },
  { value: "vehicle", label: "Vehicle" },
  { value: "investment", label: "Investments" },
  { value: "cash", label: "Cash & Bank" },
  { value: "retirement", label: "Retirement" },
  { value: "other", label: "Other Asset" },
];
const LIAB_CATS = [
  { value: "mortgage", label: "Mortgage" },
  { value: "loan", label: "Loan" },
  { value: "credit_card", label: "Credit Card" },
  { value: "other_liability", label: "Other Liability" },
];
const PRESET_ICONS = ["🏠","🚗","📈","💰","🏦","🎓","💼","⛵","💍","🌍","🏋️","🖥️","🛡️","🐾"];
const PRESET_COLORS = ["#16a34a","#0d9488","#2563eb","#7c3aed","#db2777","#ea580c","#ca8a04","#64748b"];

type Tab = "asset" | "liability";
type Form = { name: string; type: Tab; value: string; category: string; icon: string; color: string; notes: string };
const EMPTY: Form = { name: "", type: "asset", value: "", category: "other", icon: PRESET_ICONS[0], color: PRESET_COLORS[0], notes: "" };

export default function AssetsPage({ userId }: { userId: string }) {
  const { currency } = useUI();
  const supabase = createClient();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("asset");
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);

  const load = useCallback(async () => {
    setLoading(true);
    setAssets(await fetchAssets(supabase, userId));
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const assetList = assets.filter(a => a.type === "asset");
  const liabList  = assets.filter(a => a.type === "liability");
  const totalAssets = assetList.reduce((s, a) => s + a.value, 0);
  const totalLiabs  = liabList.reduce((s, a) => s + a.value, 0);
  const netWorth = totalAssets - totalLiabs;
  const visible = tab === "asset" ? assetList : liabList;

  const catLabel = (cat: string) => [...ASSET_CATS, ...LIAB_CATS].find(c => c.value === cat)?.label ?? cat;

  function openAdd() { setEditId(null); setForm({ ...EMPTY, type: tab, category: tab === "asset" ? "other" : "other_liability" }); setError(""); setModalOpen(true); }
  function openEdit(a: Asset) {
    setEditId(a.id);
    setForm({ name: a.name, type: a.type as Tab, value: String(a.value), category: a.category, icon: a.icon ?? PRESET_ICONS[0], color: a.color ?? PRESET_COLORS[0], notes: a.notes ?? "" });
    setError(""); setModalOpen(true);
  }
  function closeModal() { setModalOpen(false); setEditId(null); setError(""); }

  async function handleSave() {
    if (!form.name.trim()) { setError("Name is required."); return; }
    const val = parseFloat(form.value);
    if (isNaN(val) || val < 0) { setError("Enter a valid value."); return; }
    setSaving(true); setError("");
    try {
      const payload: AssetInsert = {
        user_id: userId, name: form.name.trim(), type: form.type,
        value: val, category: form.category as Asset["category"],
        icon: form.icon, color: form.color, notes: form.notes.trim() || null,
      };
      if (editId) await updateAsset(supabase, editId, payload);
      else await insertAsset(supabase, payload);
      closeModal(); await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally { setSaving(false); }
  }

  async function handleDelete(a: Asset) {
    if (!confirm(`Delete "${a.name}"?`)) return;
    await deleteAsset(supabase, a.id);
    await load();
  }

  const cats = form.type === "asset" ? ASSET_CATS : LIAB_CATS;

  return (
    <div>
      <div className="pg-hdr">
        <div>
          <h2 className="pg-h2">Assets & Liabilities</h2>
          <p className="pg-sub">
            Net Worth: <strong style={{ color: netWorth >= 0 ? "var(--gr)" : "var(--rd)" }}>{formatCurrency(netWorth, currency)}</strong>
          </p>
        </div>
        <button className="btn-add" onClick={openAdd}><Plus size={15} strokeWidth={2.5} /> Add</button>
      </div>

      {/* Net worth strip */}
      {assets.length > 0 && (
        <div className="bgt-summ" style={{ marginBottom: 16 }}>
          <div className="bgt-summ-item">
            <span className="bgt-summ-lbl">Total Assets</span>
            <span className="bgt-summ-val" style={{ color: "var(--gr)" }}>{formatCurrency(totalAssets, currency)}</span>
          </div>
          <div className="bgt-summ-div" />
          <div className="bgt-summ-item">
            <span className="bgt-summ-lbl">Total Liabilities</span>
            <span className="bgt-summ-val" style={{ color: "var(--rd)" }}>{formatCurrency(totalLiabs, currency)}</span>
          </div>
          <div className="bgt-summ-div" />
          <div className="bgt-summ-item">
            <span className="bgt-summ-lbl">Net Worth</span>
            <span className="bgt-summ-val" style={{ color: netWorth >= 0 ? "var(--gr)" : "var(--rd)" }}>{formatCurrency(netWorth, currency)}</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="type-tabs" style={{ marginBottom: 16 }}>
        <button className={`type-tab${tab === "asset" ? " active" : ""}`} onClick={() => setTab("asset")}>
          Assets <span className="tab-ct">{assetList.length}</span>
        </button>
        <button className={`type-tab${tab === "liability" ? " active" : ""}`} onClick={() => setTab("liability")}>
          Liabilities <span className="tab-ct">{liabList.length}</span>
        </button>
      </div>

      {loading ? (
        <p style={{ color: "var(--t3)", fontSize: 13 }}>Loading…</p>
      ) : visible.length === 0 ? (
        <div className="acc-empty">
          <div className="acc-empty-ico">{tab === "asset" ? "📈" : "📉"}</div>
          <div className="acc-empty-ttl">No {tab === "asset" ? "assets" : "liabilities"} tracked</div>
          <p className="acc-empty-sub">
            {tab === "asset" ? "Add property, investments, vehicles, and other things you own."
              : "Add mortgages, loans, credit cards, and other obligations."}
          </p>
          <button className="btn-add" onClick={openAdd}><Plus size={15} strokeWidth={2.5} /> Add</button>
        </div>
      ) : (
        <div className="asset-list">
          {visible.map(a => (
            <div key={a.id} className="asset-row">
              <div className="asset-ico" style={{ background: a.color ? `${a.color}22` : "var(--plt)" }}>{a.icon ?? "📦"}</div>
              <div className="asset-info">
                <div className="asset-name">{a.name}</div>
                <div className="asset-cat">{catLabel(a.category)}</div>
              </div>
              <div className="asset-value" style={{ color: a.type === "asset" ? "var(--gr)" : "var(--rd)" }}>
                {a.type === "liability" ? "−" : "+"}{formatCurrency(a.value, currency)}
              </div>
              <div className="asset-acts">
                <button className="icon-btn" onClick={() => openEdit(a)} title="Edit"><Pencil size={13} /></button>
                <button className="icon-btn danger" onClick={() => handleDelete(a)} title="Delete"><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="modal-bg" onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="modal">
            <div className="modal-hdr">
              <h3>{editId ? "Edit" : "Add Asset / Liability"}</h3>
              <button className="modal-close" onClick={closeModal}><X size={16} /></button>
            </div>
            {error && <div className="msg-err" style={{ margin: "0 0 12px" }}>{error}</div>}

            <div className="type-toggle" style={{ marginBottom: 16 }}>
              <button className={`tt-btn${form.type === "asset" ? " active inc" : ""}`}
                onClick={() => setForm(f => ({ ...f, type: "asset", category: "other" }))}>Asset</button>
              <button className={`tt-btn${form.type === "liability" ? " active exp" : ""}`}
                onClick={() => setForm(f => ({ ...f, type: "liability", category: "other_liability" }))}>Liability</button>
            </div>

            <div className="modal-grid">
              <div className="fld" style={{ gridColumn: "1/-1" }}>
                <label>Name</label>
                <input type="text" placeholder="e.g. Home" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus />
              </div>
              <div className="fld">
                <label>{form.type === "asset" ? "Value" : "Balance Owed"}</label>
                <input type="number" min="0" step="0.01" placeholder="0.00" value={form.value}
                  onChange={e => setForm(f => ({ ...f, value: e.target.value }))} />
              </div>
              <div className="fld">
                <label>Category</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {cats.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
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
              <div className="fld" style={{ gridColumn: "1/-1" }}>
                <label>Notes <span style={{ color:"var(--t4)", fontWeight:400 }}>(optional)</span></label>
                <input type="text" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>

            <div className="modal-ft">
              <button className="btn-ghost" onClick={closeModal}>Cancel</button>
              <button className="btn-p" style={{ width: "auto", padding: "10px 28px", marginBottom: 0 }}
                onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : editId ? "Save" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
