"use client";
import { useUI } from "@/store/ui";
import { CURRENCY_SYMBOLS, type Theme, type Currency } from "@/types";
import { X } from "lucide-react";

const THEMES: { key: Theme; name: string; dots: string[]; dark?: boolean }[] = [
  { key: "blush",    name: "Blush Petals",   dots: ["#8F4965","#D982A2","#F9E1E8"] },
  { key: "lavender", name: "Lavender Dream", dots: ["#55427F","#9272D6","#E9DFFF"] },
  { key: "matcha",   name: "Matcha Serenity",dots: ["#42583D","#7F9B67","#E2E9D5"] },
  { key: "butter",   name: "Buttercream",    dots: ["#79602C","#D8AF4F","#FFF0C9"] },
  { key: "peach",    name: "Peach Sorbet",   dots: ["#8B4D39","#E99070","#FFE4D5"] },
  { key: "ocean",    name: "Ocean Mist",     dots: ["#315E6B","#65A8B8","#DCEFF3"] },
  { key: "cocoa",    name: "Cocoa Latte",    dots: ["#5F493A","#A18368","#EAE0D3"] },
  { key: "midnight", name: "Midnight Bloom", dots: ["#F0EBFF","#A99AE6","#494563"], dark: true },
];
const CURRENCIES: { code: Currency; name: string; flag: string }[] = [
  { code: "USD", name: "US Dollar",         flag: "🇺🇸" },
  { code: "MYR", name: "Malaysian Ringgit", flag: "🇲🇾" },
  { code: "EUR", name: "Euro",              flag: "🇪🇺" },
  { code: "GBP", name: "British Pound",     flag: "🇬🇧" },
  { code: "SGD", name: "Singapore Dollar",  flag: "🇸🇬" },
];

export default function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { theme, setTheme, currency, setCurrency } = useUI();

  if (!open) return null;

  return (
    <div className="modal-ov open" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-hd">
          <h2>Settings</h2>
          <button className="modal-close" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          {/* Themes */}
          <section>
            <div className="modal-sec-ttl">Theme</div>
            <div className="theme-grid">
              {THEMES.map(t => (
                <button
                  key={t.key}
                  className={`theme-sw${theme === t.key ? " active" : ""}`}
                  data-t={t.key}
                  onClick={() => {
                    setTheme(t.key);
                    document.documentElement.setAttribute("data-theme", t.key);
                  }}
                  style={t.dark ? { background: "#171725", borderColor: theme === t.key ? "#A99AE6" : "#2E2E4A" } : {}}
                >
                  <div className="sw-dots">
                    {t.dots.map((d, i) => <span key={i} className="sw-dot" style={{ background: d }} />)}
                  </div>
                  <span className="sw-name" style={t.dark ? { color: "#C4BDED" } : {}}>{t.name}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Currency */}
          <section>
            <div className="modal-sec-ttl">Currency</div>
            <div className="cur-list">
              {CURRENCIES.map(c => (
                <div
                  key={c.code}
                  className={`cur-opt${currency === c.code ? " active" : ""}`}
                  onClick={() => setCurrency(c.code)}
                >
                  <span className="flag">{c.flag}</span>
                  <span className="cur-code">{c.code}</span>
                  <span className="cur-name">{c.name}</span>
                  <span className="cur-sym">{CURRENCY_SYMBOLS[c.code]}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
