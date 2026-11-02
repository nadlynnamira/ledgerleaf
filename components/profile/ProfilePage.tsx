"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { User, Mail, Calendar, Shield, Key, LogOut, Save, X, Camera, Loader, CheckCircle, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

type Props = {
  userId: string;
  userName: string;
  userEmail: string;
  createdAt: string;
  avatarUrl?: string;
  activationCode?: string;
};

// ─── Crop Modal ────────────────────────────────────────────────────────────
function CropModal({
  src,
  onCancel,
  onCrop,
}: {
  src: string;
  onCancel: () => void;
  onCrop: (blob: Blob) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ mx: 0, my: 0, ox: 0, oy: 0 });
  const [imgLoaded, setImgLoaded] = useState(false);

  const SIZE = 280; // canvas/preview size in px
  const OUTPUT = 400; // exported image size

  // Load image
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      // Center image on load
      const scale = Math.max(SIZE / img.width, SIZE / img.height);
      setZoom(scale);
      setOffset({ x: 0, y: 0 });
      setImgLoaded(true);
    };
    img.src = src;
  }, [src]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, SIZE, SIZE);

    // Draw image centered with zoom + offset
    const w = img.width * zoom;
    const h = img.height * zoom;
    const x = SIZE / 2 - w / 2 + offset.x;
    const y = SIZE / 2 - h / 2 + offset.y;
    ctx.drawImage(img, x, y, w, h);

    // Dark vignette outside circle
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, 0, SIZE, SIZE);
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2 - 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Circle border
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.8)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2 - 1, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }, [zoom, offset]);

  useEffect(() => { if (imgLoaded) draw(); }, [draw, imgLoaded]);

  function onMouseDown(e: React.MouseEvent) {
    setDragging(true);
    dragStart.current = { mx: e.clientX, my: e.clientY, ox: offset.x, oy: offset.y };
  }
  function onMouseMove(e: React.MouseEvent) {
    if (!dragging) return;
    const dx = e.clientX - dragStart.current.mx;
    const dy = e.clientY - dragStart.current.my;
    setOffset({ x: dragStart.current.ox + dx, y: dragStart.current.oy + dy });
  }
  function onMouseUp() { setDragging(false); }

  function onTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    setDragging(true);
    dragStart.current = { mx: t.clientX, my: t.clientY, ox: offset.x, oy: offset.y };
  }
  function onTouchMove(e: React.TouchEvent) {
    if (!dragging) return;
    const t = e.touches[0];
    const dx = t.clientX - dragStart.current.mx;
    const dy = t.clientY - dragStart.current.my;
    setOffset({ x: dragStart.current.ox + dx, y: dragStart.current.oy + dy });
  }

  function handleCrop() {
    const img = imgRef.current;
    if (!img) return;

    const out = document.createElement("canvas");
    out.width = OUTPUT;
    out.height = OUTPUT;
    const ctx = out.getContext("2d");
    if (!ctx) return;

    // Circle clip
    ctx.beginPath();
    ctx.arc(OUTPUT / 2, OUTPUT / 2, OUTPUT / 2, 0, Math.PI * 2);
    ctx.clip();

    // Scale offset from preview SIZE → OUTPUT
    const scale = OUTPUT / SIZE;
    const w = img.width * zoom * scale;
    const h = img.height * zoom * scale;
    const x = OUTPUT / 2 - w / 2 + offset.x * scale;
    const y = OUTPUT / 2 - h / 2 + offset.y * scale;
    ctx.drawImage(img, x, y, w, h);

    out.toBlob(blob => { if (blob) onCrop(blob); }, "image/png", 0.95);
  }

  return (
    <div className="modal-bg" style={{ zIndex: 700 }}>
      <div className="modal" style={{ maxWidth: 380 }}>
        <div className="modal-hdr">
          <h3>Crop Photo</h3>
          <button className="modal-close" onClick={onCancel}><X size={15} /></button>
        </div>

        <p style={{ fontSize: 12, color: "var(--t3)", marginBottom: 16 }}>
          Drag to reposition · Use the slider to zoom in or out
        </p>

        {/* Canvas preview */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
          <canvas
            ref={canvasRef}
            width={SIZE}
            height={SIZE}
            style={{
              borderRadius: "50%",
              cursor: dragging ? "grabbing" : "grab",
              display: "block",
              touchAction: "none",
              border: "2px solid var(--bdr)",
            }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onMouseUp}
          />
        </div>

        {/* Zoom slider */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <button
            onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--t3)", display: "flex", padding: 4 }}
          >
            <ZoomOut size={16} />
          </button>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.05}
            value={zoom}
            onChange={e => setZoom(Number(e.target.value))}
            style={{ flex: 1, accentColor: "var(--p)" }}
          />
          <button
            onClick={() => setZoom(z => Math.min(4, z + 0.1))}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--t3)", display: "flex", padding: 4 }}
          >
            <ZoomIn size={16} />
          </button>
          <button
            onClick={() => {
              const img = imgRef.current;
              if (!img) return;
              setZoom(Math.max(SIZE / img.width, SIZE / img.height));
              setOffset({ x: 0, y: 0 });
            }}
            title="Reset"
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--t3)", display: "flex", padding: 4 }}
          >
            <RotateCcw size={14} />
          </button>
        </div>

        <div className="modal-ft">
          <button className="btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="btn-add" onClick={handleCrop} style={{ margin: 0 }}>
            <Camera size={13} /> Use This Photo
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Profile Page ──────────────────────────────────────────────────────────
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
  const [cropSrc, setCropSrc] = useState<string | null>(null);
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

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset so same file can be re-selected
    e.target.value = "";
    if (file.size > 10 * 1024 * 1024) { setAvatarError("Image must be under 10MB."); return; }
    if (!file.type.startsWith("image/")) { setAvatarError("Please select an image file."); return; }
    setAvatarError("");
    const reader = new FileReader();
    reader.onload = ev => { if (ev.target?.result) setCropSrc(ev.target.result as string); };
    reader.readAsDataURL(file);
  }

  async function uploadCroppedBlob(blob: Blob) {
    setCropSrc(null);
    setAvatarUploading(true);
    setAvatarError("");

    const path = `${userId}/avatar.png`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, blob, { upsert: true, contentType: "image/png" });
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
      {cropSrc && (
        <CropModal
          src={cropSrc}
          onCancel={() => setCropSrc(null)}
          onCrop={uploadCroppedBlob}
        />
      )}

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
              onChange={handleFileChange}
            />
          </div>
          {avatarError && <div className="msg-err" style={{ fontSize: 11, marginTop: 6, textAlign: "center" }}>{avatarError}</div>}
          {avatarUploading && <div style={{ fontSize: 11, color: "var(--t3)", marginTop: 4 }}>Uploading…</div>}
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
