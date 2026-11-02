"use client";
import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { User, Mail, Calendar, Shield, Key, LogOut, Save, X, Camera, Loader, CheckCircle } from "lucide-react";

type Props = {
  userId: string;
  userName: string;
  userEmail: string;
  createdAt: string;
  avatarUrl?: string;
  activationCode?: string;
};

export default function ProfilePage({ userId, userName, userEmail, createdAt, avatarUrl: initialAvatarUrl, activationCode }: Props) {
  const supabase = createClient();
  const router = useRouter();

  const [editName, setEditName] = useState(false);
  const [name, setName] = useState(userName);
  const [nameSaving, setNameSaving] = useState(false);
  const [nameError, setNameError] = useState("");

  const [pwOpen, setPwOpen] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);

  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl ?? "");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ini = name.charAt(0).toUpperCase();
  const joined = new Date(createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  async function saveName() {
    if (!name.trim()) { setNameError("Name cannot be empty."); return; }
    setNameSaving(true); setNameError("");
    const { error } = await supabase.auth.updateUser({ data: { full_name: name.trim() } });
    if (error) setNameError(error.message);
    else { setEditName(false); router.refresh(); }
    setNameSaving(false);
  }

  async function savePassword() {
    if (!newPw) { setPwError("New password is required."); return; }
    if (newPw.length < 6) { setPwError("Password must be at least 6 characters."); return; }
    if (newPw !== confirmPw) { setPwError("Passwords do not match."); return; }
    setPwSaving(true); setPwError(""); setPwSuccess(false);
    const { error } = await supabase.auth.updateUser({ password: newPw });
    if (error) setPwError(error.message);
    else { setPwSuccess(true); setNewPw(""); setConfirmPw(""); setTimeout(() => setPwSuccess(false), 3000); }
    setPwSaving(false);
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setAvatarError("Image must be under 2MB."); return; }
    if (!file.type.startsWith("image/")) { setAvatarError("Please select an image file."); return; }

    setAvatarUploading(true); setAvatarError("");
    const ext = file.name.split(".").pop();
    const path = `${userId}/avatar.${ext}`;

    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (upErr) { setAvatarError(upErr.message); setAvatarUploading(false); return; }

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    const publicUrl = `${data.publicUrl}?t=${Date.now()}`;

    const { error: updateErr } = await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });
    if (updateErr) { setAvatarError(updateErr.message); setAvatarUploading(false); return; }

    setAvatarUrl(publicUrl);
    setAvatarUploading(false);
    router.refresh();
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div>
      <div className="pg-hdr">
        <div>
          <h2 className="pg-h2">Profile</h2>
          <p className="pg-sub">Manage your account information and security</p>
        </div>
      </div>

      <div className="prof-page-wrap">
        {/* Avatar card */}
        <div className="card prof-card">
          <div className="prof-av-wrap">
            {avatarUrl ? (
              <img src={avatarUrl} alt={name} className="prof-page-av-img" />
            ) : (
              <div className="prof-page-av">{ini}</div>
            )}
            <button
              className="prof-av-cam"
              onClick={() => fileInputRef.current?.click()}
              title="Upload photo"
              disabled={avatarUploading}
            >
              {avatarUploading ? <Loader size={13} className="spin" /> : <Camera size={13} />}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleAvatarChange}
            />
          </div>
          {avatarError && <div className="msg-err" style={{ fontSize: 11, marginTop: 6, textAlign: "center" }}>{avatarError}</div>}
          <div className="prof-page-name">{name}</div>
          <div className="prof-page-email">{userEmail}</div>
          <div className="prof-page-joined">Member since {joined}</div>
        </div>

        {/* Info card */}
        <div className="card" style={{ flex: 1 }}>
          <div className="card-ttl" style={{ marginBottom: 20 }}>Account Details</div>

          {/* Display name */}
          <div className="prof-field">
            <div className="prof-field-lbl"><User size={13} strokeWidth={2} /> Display Name</div>
            {editName ? (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input className="prof-inp" value={name} onChange={e => setName(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") saveName(); if (e.key === "Escape") { setEditName(false); setName(userName); } }}
                  autoFocus />
                <button className="btn-p" style={{ width: "auto", padding: "8px 16px", marginBottom: 0 }} onClick={saveName} disabled={nameSaving}>
                  <Save size={13} /> {nameSaving ? "…" : "Save"}
                </button>
                <button className="btn-ghost" style={{ padding: "8px 12px" }} onClick={() => { setEditName(false); setName(userName); }}>
                  <X size={13} />
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span className="prof-field-val">{name}</span>
                <button className="btn-ghost" style={{ padding: "5px 12px", fontSize: 11 }} onClick={() => setEditName(true)}>Edit</button>
              </div>
            )}
            {nameError && <div className="msg-err" style={{ marginTop: 6, fontSize: 12 }}>{nameError}</div>}
          </div>

          {/* Email */}
          <div className="prof-field">
            <div className="prof-field-lbl"><Mail size={13} strokeWidth={2} /> Email Address</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span className="prof-field-val">{userEmail}</span>
              <span className="bill-badge due-later" style={{ fontSize: 10 }}>Verified</span>
            </div>
          </div>

          {/* Member since */}
          <div className="prof-field">
            <div className="prof-field-lbl"><Calendar size={13} strokeWidth={2} /> Member Since</div>
            <span className="prof-field-val">{joined}</span>
          </div>

          {/* User ID */}
          <div className="prof-field" style={{ borderBottom: "none" }}>
            <div className="prof-field-lbl"><Shield size={13} strokeWidth={2} /> User ID</div>
            <span className="prof-field-val" style={{ fontFamily: "monospace", fontSize: 11, color: "var(--t3)" }}>{userId}</span>
          </div>
        </div>
      </div>

      {/* Security card */}
      <div className="card" style={{ marginTop: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div className="card-ttl" style={{ marginBottom: 0 }}>Security</div>
          {!pwOpen && (
            <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => setPwOpen(true)}>
              <Key size={13} /> Change Password
            </button>
          )}
        </div>

        {!pwOpen ? (
          <div className="prof-field" style={{ borderBottom: "none" }}>
            <div className="prof-field-lbl"><Key size={13} strokeWidth={2} /> Password</div>
            <span className="prof-field-val">••••••••</span>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 400 }}>
            {pwSuccess && <div className="msg-ok">Password updated successfully!</div>}
            {pwError && <div className="msg-err">{pwError}</div>}
            <div className="fld">
              <label>New Password</label>
              <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="At least 6 characters" autoFocus />
            </div>
            <div className="fld">
              <label>Confirm New Password</label>
              <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") savePassword(); }} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn-p" style={{ width: "auto", padding: "10px 24px", marginBottom: 0 }} onClick={savePassword} disabled={pwSaving}>
                {pwSaving ? "Saving…" : "Update Password"}
              </button>
              <button className="btn-ghost" onClick={() => { setPwOpen(false); setPwError(""); setNewPw(""); setConfirmPw(""); }}>Cancel</button>
            </div>
          </div>
        )}
      </div>

      {/* Activation status */}
      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-ttl" style={{ marginBottom: 14 }}>Activation</div>
        <div className="prof-field" style={{ borderBottom: "none" }}>
          <div className="prof-field-lbl"><CheckCircle size={13} strokeWidth={2} /> Status</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "var(--gr)" }}>
              <CheckCircle size={14} /> Activated
            </span>
            {activationCode && (
              <span style={{ fontFamily: "monospace", fontSize: 12, color: "var(--t3)", letterSpacing: "0.04em" }}>{activationCode}</span>
            )}
          </div>
        </div>
      </div>

      {/* Danger zone */}
      <div className="card" style={{ marginTop: 16, borderColor: "var(--rd)" }}>
        <div className="card-ttl" style={{ color: "var(--rd)", marginBottom: 12 }}>Sign Out</div>
        <p style={{ fontSize: 13, color: "var(--t3)", marginBottom: 14 }}>You will be returned to the login screen.</p>
        <button className="btn-ghost" style={{ color: "var(--rd)", borderColor: "var(--rd)", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }} onClick={handleLogout}>
          <LogOut size={14} /> Sign Out
        </button>
      </div>
    </div>
  );
}
