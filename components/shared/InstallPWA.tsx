"use client";
import { useState, useEffect } from "react";
import { X, Monitor, Smartphone, Share } from "lucide-react";

type Platform = "android" | "ios" | "desktop" | null;

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  if (/android/i.test(ua)) return "android";
  return "desktop";
}

export default function InstallPWA() {
  const [show, setShow] = useState(false);
  const [platform, setPlatform] = useState<Platform>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Don't show if already installed as PWA
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }
    // Don't show if dismissed before
    try {
      if (localStorage.getItem("ll_install_dismissed")) return;
    } catch {}

    setPlatform(detectPlatform());
    // Show after 3 seconds so it doesn't interrupt page load
    const t = setTimeout(() => setShow(true), 3000);
    return () => clearTimeout(t);
  }, []);

  function dismiss() {
    setShow(false);
    try { localStorage.setItem("ll_install_dismissed", "1"); } catch {}
  }

  if (isInstalled || !show || !platform) return null;

  return (
    <div style={{
      position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)",
      zIndex: 9999, width: "calc(100% - 32px)", maxWidth: 420,
      background: "var(--card)", border: "1.5px solid var(--bdr)",
      borderRadius: 16, boxShadow: "0 8px 32px rgba(0,0,0,.18)",
      padding: "18px 20px", animation: "slideUp .3s ease",
    }}>
      <style>{`@keyframes slideUp{from{opacity:0;transform:translateX(-50%) translateY(20px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`}</style>

      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        <img src="/icon-192.png" alt="Ledgerleaf" style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "var(--t1)" }}>Install Ledgerleaf</div>
            <button onClick={dismiss} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--t3)", padding: 2, display: "flex" }}>
              <X size={16} />
            </button>
          </div>
          <p style={{ fontSize: 12, color: "var(--t3)", margin: "0 0 12px", lineHeight: 1.5 }}>
            Install as an app for quick access — no app store needed.
          </p>

          {platform === "android" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                <Smartphone size={14} color="var(--p)" style={{ flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 12, color: "var(--t2)", lineHeight: 1.5 }}>
                  Tap the <b>⋮ menu</b> in Chrome → <b>"Add to Home Screen"</b> or <b>"Install app"</b>
                </span>
              </div>
            </div>
          )}

          {platform === "ios" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                <Share size={14} color="var(--p)" style={{ flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 12, color: "var(--t2)", lineHeight: 1.5 }}>
                  Open in <b>Safari</b> → tap the <b>Share button</b> (↑) → <b>"Add to Home Screen"</b>
                </span>
              </div>
            </div>
          )}

          {platform === "desktop" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                <Monitor size={14} color="var(--p)" style={{ flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 12, color: "var(--t2)", lineHeight: 1.5 }}>
                  Click the <b>install icon</b> (⊕) in your browser's address bar, or go to <b>browser menu → "Install Ledgerleaf"</b>
                </span>
              </div>
            </div>
          )}

          <button
            onClick={dismiss}
            style={{ marginTop: 12, fontSize: 12, color: "var(--t4)", background: "none", border: "none", cursor: "pointer", padding: 0, textDecoration: "underline" }}
          >
            Don't show again
          </button>
        </div>
      </div>
    </div>
  );
}
