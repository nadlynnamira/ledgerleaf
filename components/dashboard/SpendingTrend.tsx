"use client";
import { useUI } from "@/store/ui";
import type { WeekPoint } from "@/lib/queries/dashboard";

const SVG_W = 600;
const X_POSITIONS = [65, 232, 399, 566];
const Y_TOP = 13;
const Y_BOTTOM = 133;
const Y_RANGE = Y_BOTTOM - Y_TOP; // 120

function toY(amount: number, max: number) {
  if (max === 0) return Y_BOTTOM;
  return Y_BOTTOM - (amount / max) * Y_RANGE;
}

function cubicPath(pts: { x: number; y: number }[]) {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x},${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const cp = (pts[i].x - pts[i - 1].x) / 2;
    d += ` C ${pts[i - 1].x + cp},${pts[i - 1].y} ${pts[i].x - cp},${pts[i].y} ${pts[i].x},${pts[i].y}`;
  }
  return d;
}

export default function SpendingTrend({ weeks }: { weeks: WeekPoint[] }) {
  const { currency } = useUI();
  const max = Math.max(...weeks.map((w) => w.amount), 100);
  const pts = weeks.map((w, i) => ({ x: X_POSITIONS[i], y: toY(w.amount, max) }));
  const linePath = cubicPath(pts);
  const areaPath = linePath
    ? `${linePath} L ${pts[pts.length - 1].x},${Y_BOTTOM} L ${pts[0].x},${Y_BOTTOM} Z`
    : "";

  const symbols: Record<string, string> = { USD: "$", MYR: "RM", EUR: "€", GBP: "£", SGD: "S$" };
  const sym = symbols[currency] ?? currency;
  const yLabels = Array.from({ length: 6 }, (_, i) => {
    const val = (max / 5) * i;
    const label = val >= 1000 ? `${sym}${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}K` : `${sym}${Math.round(val)}`;
    return { y: Y_BOTTOM - i * (Y_RANGE / 5), label };
  });

  return (
    <div className="card">
      <div className="card-ttl">Spending Trend <span className="card-sub">Last 4 Weeks</span></div>
      <svg width="100%" viewBox={`0 0 ${SVG_W} 158`} role="img" aria-label="Weekly spending trend">
        <defs>
          <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--p)" stopOpacity={0.15} />
            <stop offset="100%" stopColor="var(--p)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="lg2" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--p3)" />
            <stop offset="100%" stopColor="var(--pdk)" />
          </linearGradient>
        </defs>
        {yLabels.map(({ y, label }) => (
          <g key={label}>
            <line x1="60" y1={y} x2="578" y2={y} stroke="var(--bdr)" strokeWidth={0.7} strokeDasharray="3,3" />
            <text x="54" y={y + 4} className="ax" textAnchor="end">{label}</text>
          </g>
        ))}
        {areaPath && <path d={areaPath} fill="url(#ag)" />}
        {linePath && <path d={linePath} fill="none" stroke="url(#lg2)" strokeWidth="2.5" strokeLinecap="round" />}
        {pts.map((p, i) => (
          i === pts.length - 1
            ? <circle key={i} cx={p.x} cy={p.y} r="4.5" fill="var(--p)" stroke="var(--p)" strokeWidth="2" />
            : <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="var(--card)" stroke="var(--p)" strokeWidth="2" />
        ))}
        {weeks.map((w, i) => (
          <text key={w.label} x={X_POSITIONS[i]} y="151" className="ax" textAnchor="middle">{w.label}</text>
        ))}
      </svg>
    </div>
  );
}
