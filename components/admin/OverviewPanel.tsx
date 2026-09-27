"use client";

import Link from "next/link";
import { useState, type CSSProperties, type ReactNode } from "react";
import { ArrowDownRight, ArrowRight, ArrowUpRight, ClipboardCheck, FileQuestion, Gauge, Minus, RefreshCw, Users } from "lucide-react";
import { adminApi, fmtDate, fmtScore, type Overview } from "@/lib/admin";
import { Badge, Empty, ErrorBanner, Spinner, Table, Td, useLoader } from "./ui";

type Day = Overview["series"][number];

/* Màu cơ cấu vai trò — thứ tự cố định, đã chạy dataviz validator (CVD ΔE ≥ 9.5).
   Màu cam < 3:1 trên nền trắng nên luôn đi kèm nhãn + số trong chú giải. */
const ROLE_COLORS = { students: "#078df8", teachers: "#0b8a6a", admins: "#d9822b" } as const;

export function OverviewPanel() {
  const { data, error, loading, reload } = useLoader(adminApi.overview, "overview");

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-ink-3">Bảng điều khiển</p>
          <h1 className="mt-1 text-[26px] font-bold text-ink">Tình hình hệ thống thi thử</h1>
        </div>
        <button
          onClick={reload}
          disabled={loading}
          className="inline-flex h-9 items-center gap-2 rounded-[6px] border border-line-strong bg-paper px-3.5 text-[13px] font-medium text-ink transition-colors hover:bg-paper-2 disabled:opacity-60"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Làm mới
        </button>
      </div>
      {error && <ErrorBanner message={error} onRetry={reload} />}
      {loading && !data && <Spinner />}
      {data && <OverviewBody d={data} />}
    </>
  );
}

/* ---------------- Số liệu dẫn xuất ---------------- */

const sumCount = (days: Day[]) => days.reduce((a, s) => a + s.count, 0);
/** Điểm TB có trọng số theo số lượt nộp của từng ngày. */
function weightedAvg(days: Day[]): number | null {
  const n = sumCount(days);
  return n ? days.reduce((a, s) => a + (s.avgScore ?? 0) * s.count, 0) / n : null;
}
const dm = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;

function OverviewBody({ d }: { d: Overview }) {
  const last7 = d.series.slice(-7);
  const prev7 = d.series.slice(-14, -7);
  const subs7 = sumCount(last7);
  const subsPrev = sumCount(prev7);
  const avg7 = weightedAvg(last7);
  const avgPrev = weightedAvg(prev7);

  return (
    <div className="space-y-5">
      {/* KPI */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          i={0}
          href="/admin/bai-thi"
          icon={ClipboardCheck}
          label="Bài nộp · 7 ngày"
          value={subs7.toLocaleString("vi-VN")}
          delta={<CountDelta now={subs7} prev={subsPrev} />}
          foot={<Sparkline values={d.series.map((s) => s.count)} />}
        />
        <Kpi
          i={1}
          href="/admin/bai-thi"
          icon={Gauge}
          label="Điểm trung bình · 7 ngày"
          value={fmtScore(avg7)}
          unit="/10"
          delta={<ScoreDelta now={avg7} prev={avgPrev} />}
          foot={<Sparkline values={d.series.map((s) => s.avgScore)} min={0} max={10} />}
        />
        <Kpi
          i={2}
          href="/admin/nguoi-dung"
          icon={Users}
          label="Người dùng"
          value={d.users.total.toLocaleString("vi-VN")}
          delta={
            d.users.new7d > 0 ? (
              <Chip tone="up">
                <ArrowUpRight size={13} /> +{d.users.new7d} tuần này
              </Chip>
            ) : (
              <Chip tone="flat">Chưa có người mới</Chip>
            )
          }
          foot={<RoleBar u={d.users} thin />}
        />
        <Kpi
          i={3}
          href="/admin/cau-hoi"
          icon={FileQuestion}
          label="Ngân hàng câu hỏi"
          value={d.catalog.questions.toLocaleString("vi-VN")}
          foot={
            <p className="text-[12.5px] text-ink-3">
              <span className="font-semibold text-ink-2 tabular-nums">{d.catalog.schools}</span> trường ·{" "}
              <span className="font-semibold text-ink-2 tabular-nums">{d.catalog.subjects}</span> học phần ·{" "}
              {d.exams.total.toLocaleString("vi-VN")} lượt thi tổng
            </p>
          }
        />
      </div>

      {/* Lượt nộp + cơ cấu người dùng */}
      <div className="grid gap-5 xl:grid-cols-[1.75fr_1fr]">
        <Panel i={4} title="Lượt nộp bài" meta={`14 ngày · ${sumCount(d.series).toLocaleString("vi-VN")} lượt`}>
          <SubmissionBars series={d.series} />
        </Panel>
        <Panel i={5} title="Cơ cấu người dùng" meta={`${d.users.total.toLocaleString("vi-VN")} tài khoản`}>
          <RoleBreakdown u={d.users} />
        </Panel>
      </div>

      {/* Điểm TB + học phần nổi bật */}
      <div className="grid gap-5 xl:grid-cols-2">
        <Panel i={6} title="Điểm trung bình theo ngày" meta={`Toàn thời gian: ${fmtScore(d.exams.avgScore)}/10`}>
          <ScoreLine series={d.series} />
        </Panel>
        <Panel i={7} title="Học phần được thi nhiều nhất" action={{ href: "/admin/hoc-phan", label: "Học phần" }}>
          <TopSubjects items={d.topSubjects} />
        </Panel>
      </div>

      {/* Bài nộp gần đây */}
      <Panel i={8} title="Bài nộp gần đây" action={{ href: "/admin/bai-thi", label: "Xem tất cả" }} flush>
        {d.recent.length === 0 ? (
          <Empty title="Chưa có bài nộp" hint="Khi sinh viên hoàn thành bài thi thử, bài nộp sẽ xuất hiện ở đây." />
        ) : (
          <Table head={["Sinh viên", "Học phần", "Điểm", "Đúng", "Thời điểm"]}>
            {d.recent.map((r) => (
              <tr key={r.id}>
                <Td>
                  <p className="font-medium text-ink">{r.user.fullName || r.user.email}</p>
                  <p className="text-[12.5px] text-ink-3">{r.user.email}</p>
                </Td>
                <Td>
                  {r.subject.name} <span className="text-ink-3">· {r.subject.code}</span>
                </Td>
                <Td>
                  <ScoreBadge score={r.score} grade={r.grade} />
                </Td>
                <Td className="tabular-nums text-ink-2">
                  {r.correct}/{r.total}
                </Td>
                <Td className="whitespace-nowrap text-ink-2">{fmtDate(r.createdAt, true)}</Td>
              </tr>
            ))}
          </Table>
        )}
      </Panel>
    </div>
  );
}

/* ---------------- Khung ---------------- */

const stagger = (i: number): CSSProperties => ({ animationDelay: `${i * 55}ms` });

function Panel({
  i,
  title,
  meta,
  action,
  flush,
  children,
}: {
  i: number;
  title: string;
  meta?: string;
  action?: { href: string; label: string };
  flush?: boolean;
  children: ReactNode;
}) {
  return (
    <section className="animate-rise rounded-[10px] border border-line bg-paper shadow-[var(--shadow-1)]" style={stagger(i)}>
      <header className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 px-5 pt-4 pb-1">
        <h2 className="text-[15px] font-bold text-ink">{title}</h2>
        {meta && <span className="font-mono text-[11.5px] text-ink-3 tabular-nums">{meta}</span>}
        {action && (
          <Link href={action.href} className="inline-flex items-center gap-1 text-[13px] font-medium text-orange hover:underline">
            {action.label} <ArrowRight size={13} />
          </Link>
        )}
      </header>
      <div className={flush ? "pt-2" : "px-5 pt-2 pb-5"}>{children}</div>
    </section>
  );
}

function Kpi({
  i,
  href,
  icon: Icon,
  label,
  value,
  unit,
  delta,
  foot,
}: {
  i: number;
  href: string;
  icon: typeof Users;
  label: string;
  value: string;
  unit?: string;
  delta?: ReactNode;
  foot?: ReactNode;
}) {
  return (
    <Link
      href={href}
      style={stagger(i)}
      className="group animate-rise relative flex flex-col overflow-hidden rounded-[10px] border border-line bg-paper p-5 shadow-[var(--shadow-1)] transition-[border-color,box-shadow] hover:border-orange-border hover:shadow-[var(--shadow-2)]"
    >
      <span className="absolute inset-x-0 top-0 h-[2px] origin-left scale-x-0 bg-orange transition-transform duration-300 group-hover:scale-x-100" aria-hidden />
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-semibold text-ink-2">{label}</span>
        <span className="grid h-8 w-8 place-items-center rounded-[8px] bg-paper-2 text-ink-3 transition-colors group-hover:bg-orange-soft group-hover:text-orange">
          <Icon size={16} />
        </span>
      </div>
      <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <p className="text-[30px] font-bold leading-none tracking-[-0.02em] text-ink tabular-nums">
          {value}
          {unit && <span className="ml-0.5 text-[15px] font-semibold text-ink-3">{unit}</span>}
        </p>
        {delta}
      </div>
      <div className="mt-auto pt-4">{foot}</div>
    </Link>
  );
}

function Chip({ tone, children }: { tone: "up" | "down" | "flat"; children: ReactNode }) {
  const cls = { up: "bg-green-soft text-green", down: "bg-danger-soft text-danger", flat: "bg-paper-3 text-ink-2" }[tone];
  return <span className={`inline-flex items-center gap-0.5 rounded-[4px] px-1.5 py-0.5 text-[12px] font-semibold tabular-nums ${cls}`}>{children}</span>;
}

function CountDelta({ now, prev }: { now: number; prev: number }) {
  if (prev === 0) return now > 0 ? <Chip tone="up">so với 0 tuần trước</Chip> : <Chip tone="flat">Chưa có lượt</Chip>;
  const pct = Math.round(((now - prev) / prev) * 100);
  if (pct === 0) return <Chip tone="flat"><Minus size={13} /> 0% so với tuần trước</Chip>;
  return (
    <Chip tone={pct > 0 ? "up" : "down"}>
      {pct > 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
      {pct > 0 ? "+" : ""}
      {pct}% so với tuần trước
    </Chip>
  );
}

function ScoreDelta({ now, prev }: { now: number | null; prev: number | null }) {
  if (now == null || prev == null) return null;
  const diff = Math.round((now - prev) * 100) / 100;
  if (diff === 0) return <Chip tone="flat"><Minus size={13} /> như tuần trước</Chip>;
  return (
    <Chip tone={diff > 0 ? "up" : "down"}>
      {diff > 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
      {diff > 0 ? "+" : ""}
      {fmtScore(diff)} điểm
    </Chip>
  );
}

/* ---------------- Biểu đồ ---------------- */

/** Sparkline trang trí trong thẻ KPI; số liệu chi tiết nằm ở biểu đồ lớn bên dưới. */
function Sparkline({ values, min, max }: { values: (number | null)[]; min?: number; max?: number }) {
  const nums = values.filter((v): v is number => v != null);
  if (nums.length < 2) return <div className="h-9 border-b border-dashed border-line" aria-hidden />;
  const lo = min ?? Math.min(...nums);
  const hi = Math.max(max ?? Math.max(...nums), lo + 1);
  const W = 100;
  const H = 36;
  const x = (i: number) => (i / (values.length - 1)) * W;
  const y = (v: number) => H - 2 - ((v - lo) / (hi - lo)) * (H - 4);
  // Ngắt đoạn ở ngày không có dữ liệu thay vì nối qua.
  let path = "";
  let pen = false;
  values.forEach((v, i) => {
    if (v == null) return void (pen = false);
    path += `${pen ? "L" : "M"}${x(i).toFixed(2)},${y(v).toFixed(2)}`;
    pen = true;
  });
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-9 w-full overflow-visible" aria-hidden>
      <path d={path} fill="none" stroke="var(--color-orange)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/** Mốc trục Y "tròn" (bước 1/2/5 × 10^k), tối thiểu bước 1 vì đếm số nguyên. */
function niceTicks(max: number): number[] {
  const raw = Math.max(1, max) / 4;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = Math.max(1, [1, 2, 5, 10].map((m) => m * mag).find((s) => s >= raw)!);
  const top = Math.max(step, Math.ceil(max / step) * step);
  const ticks: number[] = [];
  for (let v = 0; v <= top; v += step) ticks.push(v);
  return ticks;
}

const CHART_H = 200;

function SubmissionBars({ series }: { series: Day[] }) {
  const ticks = niceTicks(Math.max(0, ...series.map((s) => s.count)));
  const top = ticks[ticks.length - 1];
  const total = sumCount(series);

  return (
    <div>
      <div className="relative mt-3 flex gap-3">
        {/* Trục Y */}
        <div className="relative w-7 shrink-0" style={{ height: CHART_H }} aria-hidden>
          {ticks.map((t) => (
            <span key={t} className="absolute right-0 font-mono text-[11px] text-ink-3 tabular-nums" style={{ bottom: `calc(${(t / top) * 100}% - 0.5em)` }}>
              {t}
            </span>
          ))}
        </div>
        <div className="relative flex-1" style={{ height: CHART_H }}>
          {/* Lưới */}
          {ticks.map((t) => (
            <div key={t} className={`absolute inset-x-0 border-t ${t === 0 ? "border-line-strong" : "border-dashed border-line"}`} style={{ bottom: `${(t / top) * 100}%` }} aria-hidden />
          ))}
          <div className="absolute inset-0 flex items-end gap-[2px]" role="img" aria-label={`Biểu đồ cột lượt nộp bài 14 ngày, tổng ${total} lượt`}>
            {series.map((s, i) => {
              const today = i === series.length - 1;
              return (
                <div key={s.date} className="group relative flex h-full flex-1 flex-col justify-end px-[3px]">
                  <div
                    className={`rounded-t-[4px] transition-[background-color,height] duration-500 ${
                      s.count ? "bg-orange group-hover:bg-orange-dark" : "bg-paper-3"
                    } ${today || !s.count ? "" : "opacity-85"}`}
                    style={{ height: s.count ? `${(s.count / top) * 100}%` : "2px" }}
                  />
                  <div className="pointer-events-none absolute bottom-[calc(100%+6px)] left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-[6px] bg-ink px-2.5 py-1.5 text-[12px] leading-snug text-white shadow-[var(--shadow-pop)] group-hover:block">
                    <p className="font-semibold">{fmtDate(s.date)}</p>
                    <p className="text-white/75">
                      {s.count} lượt{s.avgScore != null && ` · TB ${fmtScore(s.avgScore)}`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <XLabels series={series} />
    </div>
  );
}

function XLabels({ series }: { series: Day[] }) {
  return (
    <div className="mt-2 flex gap-[2px] pl-10 font-mono text-[11px] text-ink-3 tabular-nums" aria-hidden>
      {series.map((s, i) => {
        const last = i === series.length - 1;
        return (
          <span key={s.date} className={`flex-1 whitespace-nowrap ${last ? "text-right font-semibold text-ink-2" : "text-center"}`}>
            {last ? "Hôm nay" : i % 3 === 1 ? dm(s.date) : ""}
          </span>
        );
      })}
    </div>
  );
}

/** Đường điểm TB 0–10, có mốc đạt 5.0 và crosshair khi rê chuột. */
function ScoreLine({ series }: { series: Day[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const hasData = series.some((s) => s.avgScore != null);
  if (!hasData) return <Empty title="Chưa có dữ liệu điểm" hint="Biểu đồ xuất hiện khi có bài nộp trong 14 ngày qua." />;

  const n = series.length;
  const xPct = (i: number) => ((i + 0.5) / n) * 100;
  const yPct = (v: number) => 100 - (v / 10) * 100;
  let path = "";
  let pen = false;
  series.forEach((s, i) => {
    if (s.avgScore == null) return void (pen = false);
    path += `${pen ? "L" : "M"}${xPct(i).toFixed(2)},${yPct(s.avgScore).toFixed(2)}`;
    pen = true;
  });
  const h = hover != null ? series[hover] : null;

  return (
    <div>
      <div className="relative mt-3 flex gap-3">
        <div className="relative w-7 shrink-0" style={{ height: CHART_H }} aria-hidden>
          {[0, 5, 10].map((t) => (
            <span key={t} className="absolute right-0 font-mono text-[11px] text-ink-3 tabular-nums" style={{ bottom: `calc(${t * 10}% - 0.5em)` }}>
              {t}
            </span>
          ))}
        </div>
        <div className="relative flex-1" style={{ height: CHART_H }} onMouseLeave={() => setHover(null)}>
          <div className="absolute inset-x-0 bottom-0 border-t border-line-strong" aria-hidden />
          <div className="absolute inset-x-0 top-0 border-t border-dashed border-line" aria-hidden />
          <div className="absolute inset-x-0 border-t border-dashed border-ink-3/60" style={{ bottom: "50%" }} aria-hidden />

          {hover != null && (
            <div className="absolute inset-y-0 w-px bg-line-strong" style={{ left: `${xPct(hover)}%` }} aria-hidden />
          )}

          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible" role="img" aria-label="Biểu đồ đường điểm trung bình theo ngày, thang 10">
            <path d={path} fill="none" stroke="var(--color-orange)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          </svg>

          {/* Điểm dữ liệu vẽ bằng HTML để giữ tròn khi SVG co giãn */}
          {series.map((s, i) =>
            s.avgScore == null ? null : (
              <span
                key={s.date}
                className={`absolute -translate-x-1/2 translate-y-1/2 rounded-full border-2 border-paper bg-orange transition-[width,height] ${hover === i ? "h-3 w-3" : "h-2 w-2"}`}
                style={{ left: `${xPct(i)}%`, bottom: `${(s.avgScore / 10) * 100}%` }}
                aria-hidden
              />
            ),
          )}

          {/* Vùng rê chuột: mỗi ngày một cột rộng, lớn hơn điểm dữ liệu */}
          <div className="absolute inset-0 flex">
            {series.map((s, i) => (
              <div key={s.date} className="h-full flex-1" onMouseEnter={() => setHover(i)} />
            ))}
          </div>

          {h && hover != null && (
            <div
              className="pointer-events-none absolute top-1 z-10 whitespace-nowrap rounded-[6px] bg-ink px-2.5 py-1.5 text-[12px] leading-snug text-white shadow-[var(--shadow-pop)]"
              style={{ left: `${xPct(hover)}%`, transform: `translateX(${hover > n / 2 ? "calc(-100% - 10px)" : "10px"})` }}
            >
              <p className="font-semibold">{fmtDate(h.date)}</p>
              <p className="text-white/75">{h.avgScore == null ? "Không có bài nộp" : `TB ${fmtScore(h.avgScore)} · ${h.count} lượt`}</p>
            </div>
          )}
        </div>
      </div>
      <XLabels series={series} />
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 pl-10 text-[12px] text-ink-2">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-[2px] w-4 rounded-full bg-orange" aria-hidden /> Điểm TB trong ngày
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-4 border-t border-dashed border-ink-3" aria-hidden /> Ngưỡng đạt 5.0
        </span>
      </div>
    </div>
  );
}

function RoleBar({ u, thin }: { u: Overview["users"]; thin?: boolean }) {
  const parts = [
    { key: "students", value: u.students },
    { key: "teachers", value: u.teachers },
    { key: "admins", value: u.admins },
  ] as const;
  const total = Math.max(1, u.students + u.teachers + u.admins);
  return (
    <div className={`flex w-full gap-[2px] overflow-hidden rounded-full bg-paper-3 ${thin ? "h-1.5" : "h-3"}`} aria-hidden>
      {parts.map((p) =>
        p.value ? <div key={p.key} className="h-full transition-[width] duration-700" style={{ width: `${(p.value / total) * 100}%`, background: ROLE_COLORS[p.key] }} /> : null,
      )}
    </div>
  );
}

function RoleBreakdown({ u }: { u: Overview["users"] }) {
  const rows = [
    { key: "students", label: "Sinh viên", value: u.students },
    { key: "teachers", label: "Giảng viên", value: u.teachers },
    { key: "admins", label: "Quản trị", value: u.admins },
  ] as const;
  const total = Math.max(1, u.students + u.teachers + u.admins);
  return (
    <div className="mt-3">
      <RoleBar u={u} />
      <ul className="mt-5 divide-y divide-line">
        {rows.map((r) => (
          <li key={r.key} className="flex items-center gap-3 py-2.5 text-[13.5px]">
            <span className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ background: ROLE_COLORS[r.key] }} aria-hidden />
            <span className="flex-1 text-ink">{r.label}</span>
            <span className="font-semibold text-ink tabular-nums">{r.value.toLocaleString("vi-VN")}</span>
            <span className="w-12 text-right font-mono text-[12px] text-ink-3 tabular-nums">{Math.round((r.value / total) * 100)}%</span>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex items-center justify-between rounded-[8px] bg-paper-2 px-3.5 py-3 text-[13px]">
        <span className="text-ink-2">Đăng ký mới trong 7 ngày</span>
        <span className="font-semibold text-ink tabular-nums">+{u.new7d.toLocaleString("vi-VN")}</span>
      </div>
    </div>
  );
}

function TopSubjects({ items }: { items: Overview["topSubjects"] }) {
  if (items.length === 0) return <Empty title="Chưa có lượt thi nào" />;
  const max = items[0].count;
  return (
    <ol className="mt-3 space-y-4">
      {items.map((s, i) => (
        <li key={s.id} className="grid grid-cols-[1.75rem_1fr] gap-x-2">
          <span className="pt-px font-mono text-[12px] text-ink-3 tabular-nums">{String(i + 1).padStart(2, "0")}</span>
          <div className="min-w-0">
            <div className="flex items-baseline justify-between gap-3 text-[13.5px]">
              <span className="min-w-0 truncate text-ink">
                {s.name} <span className="text-ink-3">· {s.code}</span>
              </span>
              <span className="shrink-0 tabular-nums text-ink-2">
                <span className="font-semibold text-ink">{s.count}</span> lượt · TB {fmtScore(s.avgScore)}
              </span>
            </div>
            <div className="mt-1.5 h-1.5 rounded-full bg-paper-3">
              <div className="h-full rounded-full bg-orange transition-[width] duration-700" style={{ width: `${(s.count / max) * 100}%` }} />
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function ScoreBadge({ score, grade }: { score: number; grade: string }) {
  const tone = score >= 8 ? "green" : score >= 5 ? "blue" : score >= 4 ? "warning" : "danger";
  return (
    <Badge tone={tone}>
      {fmtScore(score)} · {grade}
    </Badge>
  );
}
