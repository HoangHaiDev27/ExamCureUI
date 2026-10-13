import { ChevronDown, LogOut, UserRound } from "lucide-react";
import { initials } from "@/lib/auth";

/** Placeholder used while a section is loading. */
export function SectionLoading({ label = "Đang tải…", rows = 3 }: { label?: string; rows?: number }) {
  return (
    <div role="status" aria-live="polite" className="space-y-2.5 p-5">
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-10 animate-pulse rounded-[8px] bg-paper-2" aria-hidden="true" />
      ))}
    </div>
  );
}

export function SectionError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-wrap items-center justify-between gap-3 p-5 text-[13.5px] text-danger">
      <span>{message}</span>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex h-9 items-center rounded-[6px] border border-line bg-paper px-3 text-[13px] font-semibold text-ink-2 transition-colors hover:bg-paper-2"
      >
        Thử lại
      </button>
    </div>
  );
}

export function SectionEmpty({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="p-8 text-center">
      <p className="text-[14.5px] font-medium text-ink">{title}</p>
      {hint && <p className="mt-1 text-[13px] text-ink-3">{hint}</p>}
    </div>
  );
}

export function DashboardAccountControl({
  name,
  mssv,
  avatarUrl,
  menuOpen,
  onToggle,
  onAccount,
  onSignOut,
  trailing,
}: {
  name: string;
  mssv: string;
  avatarUrl?: string;
  menuOpen: boolean;
  onToggle: () => void;
  onAccount: () => void;
  onSignOut: () => void;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="relative">
      <button type="button" onClick={onToggle} aria-expanded={menuOpen} aria-haspopup="menu" className="flex w-full items-center gap-3 rounded-[8px] border border-line bg-paper-2 p-3 text-left transition-colors hover:border-line-strong hover:bg-paper-3">
        <Avatar size={38} name={name} avatarUrl={avatarUrl} />
        <div className="min-w-0 flex-1"><p className="truncate text-[13.5px] font-semibold leading-tight text-ink">{name}</p><p className="mt-0.5 truncate text-[11px] text-ink-3">{mssv}</p></div>
        {trailing || <ChevronDown size={16} className={`shrink-0 text-ink-3 transition-transform ${menuOpen ? "rotate-180" : ""}`} />}
      </button>
      {menuOpen && (
        <div role="menu" className="absolute bottom-[calc(100%+8px)] left-0 z-20 w-full overflow-hidden rounded-[9px] border border-line bg-paper p-1 shadow-[var(--shadow-pop)]">
          <button type="button" role="menuitem" onClick={onAccount} className="flex w-full items-center gap-2 rounded-[6px] px-3 py-2.5 text-left text-[13px] font-medium text-ink-2 hover:bg-paper-2 hover:text-ink"><UserRound size={15} /> Thông tin tài khoản</button>
          <button type="button" role="menuitem" onClick={onSignOut} className="flex w-full items-center gap-2 rounded-[6px] px-3 py-2.5 text-left text-[13px] font-medium text-danger hover:bg-danger-soft"><LogOut size={15} /> Đăng xuất</button>
        </div>
      )}
    </div>
  );
}

export function Avatar({ size = 36, name = "Student", avatarUrl }: { size?: number; name?: string; avatarUrl?: string }) {
  if (avatarUrl) {
    return <img src={avatarUrl} alt="" width={size} height={size} className="shrink-0 rounded-full object-cover" referrerPolicy="no-referrer" />;
  }
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full bg-ink font-semibold text-white uppercase"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}

export function SettingToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[9px] border border-line bg-paper-2 px-3.5 py-3">
      <div className="min-w-0">
        <p className="text-[13.5px] font-semibold text-ink">{label}</p>
        <p className="mt-0.5 text-[12px] leading-relaxed text-ink-3">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2 ${checked ? "bg-orange" : "bg-line-strong"}`}
      >
        <span className={`inline-block h-[18px] w-[18px] transform rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-[22px]" : "translate-x-[3px]"}`} />
      </button>
    </div>
  );
}

export function Stat({
  icon,
  value,
  label,
  sub,
  tone,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  sub?: string;
  tone: "ink" | "green" | "blue" | "orange";
}) {
  const color =
    tone === "green"
      ? "var(--color-green)"
      : tone === "blue"
        ? "var(--color-blue)"
        : tone === "orange"
          ? "var(--color-orange)"
          : "var(--color-ink)";
  return (
    <div className="dashboard-metric group relative overflow-hidden rounded-[12px] border border-line bg-paper p-4 shadow-[var(--shadow-1)] transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-1 hover:border-orange-border hover:shadow-[var(--shadow-2)]">
      <span className="absolute inset-x-0 top-0 h-[3px]" style={{ background: color, opacity: 0.5 }} aria-hidden="true" />
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-[7px] bg-paper-2 transition-colors group-hover:bg-orange-soft" style={{ color }}>{icon}</span>
        {sub && <span className="text-right text-[10.5px] font-medium text-ink-3">{sub}</span>}
      </div>
      <p className="tnum mt-3 font-display text-[28px] font-semibold leading-none" style={{ color }}>
        {value}
      </p>
      <p className="mt-1.5 text-[13px] font-medium text-ink-2">{label}</p>
    </div>
  );
}

/** Grade bands, aligned to classify() thresholds in lib/grade.ts — the chart background doubles as a scoresheet. */
const CHART_GRADE_BANDS = [
  { from: 4, to: 5, tone: "var(--color-danger)", label: "D · Yếu" },
  { from: 5, to: 7, tone: "#c98a06", label: "C · TB" },
  { from: 7, to: 8, tone: "var(--color-blue)", label: "B · Khá" },
  { from: 8, to: 10, tone: "var(--color-green)", label: "A · Giỏi" },
];

/** SVG line chart — trend line in brand accent, plotted over the student's own grade bands. */
export function ProgressChart({ data }: { data: number[] }) {
  const W = 560;
  const H = 188;
  const pad = { l: 30, r: 54, t: 14, b: 24 };
  const min = 4;
  const max = 10;
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;

  const x = (i: number) => pad.l + (i / (data.length - 1)) * innerW;
  const y = (v: number) => pad.t + (1 - (v - min) / (max - min)) * innerH;

  const linePts = data.map((v, i) => `${x(i)},${y(v)}`).join(" ");
  const areaPts = `${pad.l},${pad.t + innerH} ${linePts} ${pad.l + innerW},${pad.t + innerH}`;
  const gridYs = [4, 5, 7, 8, 10];

  return (
    <div className="mt-3 overflow-hidden">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" preserveAspectRatio="xMidYMid meet">
        {CHART_GRADE_BANDS.map((band) => (
          <rect
            key={band.label}
            x={pad.l}
            y={y(band.to)}
            width={innerW}
            height={y(band.from) - y(band.to)}
            fill={band.tone}
            opacity={0.06}
          />
        ))}
        {gridYs.map((g) => (
          <g key={g}>
            <line x1={pad.l} x2={W - pad.r} y1={y(g)} y2={y(g)} stroke="var(--color-line)" strokeWidth="1" />
            <text x={4} y={y(g) + 4} fontSize="11" fill="var(--color-ink-3)" className="tnum">{g}</text>
          </g>
        ))}
        {CHART_GRADE_BANDS.map((band) => (
          <text
            key={`label-${band.label}`}
            x={W - pad.r + 8}
            y={(y(band.from) + y(band.to)) / 2 + 3.5}
            fontSize="10"
            fontWeight="600"
            fill={band.tone}
            opacity={0.75}
          >
            {band.label}
          </text>
        ))}
        <polygon points={areaPts} fill="var(--color-orange-soft)" opacity="0.6" />
        <polyline points={linePts} fill="none" stroke="var(--color-orange)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((v, i) => (
          <g key={i}>
            <circle cx={x(i)} cy={y(v)} r={i === data.length - 1 ? 5 : 3.5} fill="#fff" stroke="var(--color-orange)" strokeWidth="2.5" />
            <text x={x(i)} y={H - 8} fontSize="10.5" textAnchor="middle" fill="var(--color-ink-3)">
              {i + 1}
            </text>
          </g>
        ))}
        <text x={x(data.length - 1) - 10} y={y(data[data.length - 1]) - 10} fontSize="12" fontWeight="600" textAnchor="end" fill="var(--color-orange)" className="tnum">
          {data[data.length - 1].toFixed(1)}
        </text>
      </svg>
    </div>
  );
}
