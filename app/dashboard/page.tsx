import Link from "next/link";
import {
  ArrowUpRight,
  BarChart3,
  BookOpen,
  ChevronRight,
  FileCheck2,
  GraduationCap,
  History,
  LayoutDashboard,
  Play,
  Target,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { getSchool } from "@/lib/schools";
import { getSubjects } from "@/lib/subjects";
import { SchoolMark } from "@/components/SchoolMark";
import { Logo } from "@/components/Logo";
import { STUDENT, mssvFor } from "@/lib/student";
import { classify, TONE_COLOR } from "@/lib/grade";

const HOME_SCHOOL = "fptu";

const NAV = [
  { label: "Tổng quan", icon: LayoutDashboard, href: "#tong-quan", active: true },
  { label: "Trường của tôi", icon: GraduationCap, href: "#truong" },
  { label: "Môn của tôi", icon: BookOpen, href: "#mon" },
  { label: "Lịch sử thi", icon: History, href: "#lich-su" },
  { label: "Thống kê", icon: BarChart3, href: "#thong-ke" },
];

const TREND = [6.2, 6.6, 6.4, 7.3, 7.0, 7.7, 8.1, 8.4];

const HISTORY = [
  { code: "CSD201", name: "Cấu trúc dữ liệu & Giải thuật", school: "fptu", score: 8.4, when: "Hôm nay, 09:42" },
  { code: "DBI202", name: "Cơ sở dữ liệu", school: "fptu", score: 7.8, when: "Hôm qua, 20:15" },
  { code: "MAE101", name: "Giải tích 1", school: "hust", score: 6.5, when: "3 ngày trước" },
  { code: "PRO192", name: "Lập trình hướng đối tượng", school: "fptu", score: 9.0, when: "5 ngày trước" },
  { code: "ECO111", name: "Kinh tế vi mô", school: "neu", score: 7.2, when: "1 tuần trước" },
];

export default function DashboardPage() {
  const home = getSchool(HOME_SCHOOL)!;
  const mssv = mssvFor(HOME_SCHOOL);
  const suggested = getSubjects(HOME_SCHOOL).slice(0, 5);
  const mySchools = [home, getSchool("hust")!, getSchool("neu")!];

  return (
    <div className="min-h-[100dvh] bg-paper-2">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur-[6px]">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-4 px-5 lg:px-8">
          <Logo size={28} />
          <div className="ml-auto flex items-center gap-3">
            <Link
              href="/schools"
              className="hidden h-9 items-center gap-1.5 rounded-[6px] border border-line-strong bg-paper px-3 text-[13px] font-medium text-ink-2 hover:text-ink sm:inline-flex"
            >
              Đổi trường
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="text-right">
                <p className="text-[13px] font-medium leading-tight text-ink">{STUDENT.shortName}</p>
                <p className="tnum text-[11.5px] leading-tight text-ink-3">{mssv}</p>
              </div>
              <Avatar />
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1280px] gap-7 px-5 py-7 lg:px-8">
        {/* Sidebar */}
        <aside className="hidden w-[244px] flex-none lg:block">
          <div className="sticky top-24">
            <div className="rounded-[10px] border border-line bg-paper p-4 shadow-[var(--shadow-1)]">
              <div className="flex items-center gap-3">
                <Avatar size={44} />
                <div className="min-w-0">
                  <p className="truncate text-[14.5px] font-semibold text-ink">{STUDENT.name}</p>
                  <p className="tnum text-[12px] text-ink-3">{mssv}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 rounded-[6px] bg-paper-2 px-2.5 py-2">
                <SchoolMark theme={home.theme} abbr={home.abbr} size={26} />
                <span className="truncate text-[12.5px] font-medium text-ink-2">{home.abbr} · {STUDENT.className}</span>
              </div>
            </div>

            <nav className="mt-3 space-y-0.5 rounded-[10px] border border-line bg-paper p-2 shadow-[var(--shadow-1)]">
              {NAV.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-[6px] px-3 py-2.5 text-[14px] font-medium transition-colors ${
                    item.active
                      ? "bg-orange-soft text-orange-dark"
                      : "text-ink-2 hover:bg-paper-2 hover:text-ink"
                  }`}
                >
                  <item.icon size={17} className={item.active ? "text-orange" : "text-ink-3"} />
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main */}
        <main className="min-w-0 flex-1">
          <div id="tong-quan">
            <h1 className="font-display text-[26px] font-semibold text-ink sm:text-[30px]">
              Chào {STUDENT.shortName}, sẵn sàng luyện thi chưa?
            </h1>
            <p className="mt-1 text-[15px] text-ink-2">
              Bạn đang luyện theo môi trường thi của{" "}
              <span className="font-medium text-ink">{home.name}</span>.
            </p>
          </div>

          {/* Stat strip */}
          <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat icon={<FileCheck2 size={18} />} value="48" label="Đề đã làm" sub="+6 tuần này" tone="ink" />
            <Stat icon={<Target size={18} />} value="7.8" label="Điểm trung bình" sub="thang 10" tone="green" />
            <Stat icon={<BookOpen size={18} />} value="6" label="Môn đang luyện" tone="blue" />
            <Stat icon={<Trophy size={18} />} value="Top 12%" label="Xếp hạng" sub="cùng khóa" tone="orange" />
          </div>

          {/* Chart + my schools */}
          <div className="mt-4 grid gap-4 lg:grid-cols-[1.5fr_1fr]" id="thong-ke">
            <section className="rounded-[10px] border border-line bg-paper p-5 shadow-[var(--shadow-1)]">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-[15px] font-semibold text-ink">Tiến bộ điểm số</h2>
                  <p className="text-[12.5px] text-ink-3">8 lần thi thử gần nhất</p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-green-soft px-2.5 py-1 text-[12.5px] font-medium text-green">
                  <TrendingUp size={14} /> +2.2 điểm
                </span>
              </div>
              <ProgressChart data={TREND} />
            </section>

            <section className="rounded-[10px] border border-line bg-paper p-5 shadow-[var(--shadow-1)]" id="truong">
              <div className="flex items-center justify-between">
                <h2 className="text-[15px] font-semibold text-ink">Trường của tôi</h2>
                <Link href="/schools" className="text-[13px] font-medium text-orange hover:text-orange-dark">
                  Tất cả
                </Link>
              </div>
              <div className="mt-3 space-y-2.5">
                {mySchools.map((s, i) => (
                  <Link
                    key={s.id}
                    href={`/schools/${s.id}/subjects`}
                    className="flex items-center gap-3 rounded-[7px] border border-line p-2.5 transition-colors hover:border-orange hover:bg-paper-2"
                  >
                    <SchoolMark theme={s.theme} abbr={s.abbr} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-semibold text-ink">{s.name}</p>
                      <p className="text-[12px] text-ink-3">{i === 0 ? "Trường chính" : "Đang theo dõi"} · {s.theme.systemName}</p>
                    </div>
                    <ChevronRight size={16} className="text-ink-3" />
                  </Link>
                ))}
              </div>
            </section>
          </div>

          {/* Suggested exams */}
          <section className="mt-4 rounded-[10px] border border-line bg-paper shadow-[var(--shadow-1)]" id="mon">
            <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
              <div>
                <h2 className="text-[15px] font-semibold text-ink">Đề gợi ý cho bạn</h2>
                <p className="text-[12.5px] text-ink-3">Dựa trên {home.abbr} — học phần bạn đang luyện</p>
              </div>
              <Link href={`/schools/${home.id}/subjects`} className="text-[13px] font-medium text-orange hover:text-orange-dark">
                Xem tất cả
              </Link>
            </div>
            <div className="divide-y divide-line">
              {suggested.map((s) => {
                const grade = s.lastScore != null ? classify(s.lastScore) : null;
                return (
                  <div key={s.id} className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-paper-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded-[5px] border border-line bg-paper-2 px-1.5 py-0.5 font-mono text-[11px] font-medium text-ink-2">{s.code}</span>
                        <h3 className="truncate text-[14.5px] font-semibold text-ink">{s.name}</h3>
                      </div>
                      <p className="mt-0.5 text-[12.5px] text-ink-3">{s.examCount} đề · {s.durationMin} phút · {s.difficulty}</p>
                    </div>
                    {grade && (
                      <span className="hidden items-center gap-1.5 sm:inline-flex">
                        <span className="text-[12px] text-ink-3">Gần nhất</span>
                        <span className="tnum text-[14px] font-semibold" style={{ color: TONE_COLOR[grade.tone] }}>{s.lastScore?.toFixed(1)}</span>
                      </span>
                    )}
                    <Link
                      href={`/exam/${home.id}/${s.id}`}
                      className="inline-flex h-9 items-center gap-1.5 rounded-[6px] bg-orange px-3.5 text-[13px] font-medium text-white shadow-[0_1px_2px_rgba(7,141,248,0.32)] transition-colors hover:bg-orange-dark"
                    >
                      <Play size={14} fill="currentColor" /> Vào thi
                    </Link>
                  </div>
                );
              })}
            </div>
          </section>

          {/* History */}
          <section className="mt-4 rounded-[10px] border border-line bg-paper shadow-[var(--shadow-1)]" id="lich-su">
            <div className="border-b border-line px-5 py-3.5">
              <h2 className="text-[15px] font-semibold text-ink">Lịch sử thi gần đây</h2>
            </div>
            <div className="divide-y divide-line">
              {HISTORY.map((h, i) => {
                const sc = getSchool(h.school)!;
                const grade = classify(h.score);
                return (
                  <div key={i} className="flex items-center gap-4 px-5 py-3">
                    <SchoolMark theme={sc.theme} abbr={sc.abbr} size={32} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-medium text-ink">
                        <span className="font-mono text-[12px] text-ink-3">{h.code}</span> · {h.name}
                      </p>
                      <p className="text-[12px] text-ink-3">{sc.abbr} · {h.when}</p>
                    </div>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="tnum text-[15px] font-semibold" style={{ color: TONE_COLOR[grade.tone] }}>{h.score.toFixed(1)}</span>
                      <span className="rounded-[4px] px-1.5 py-0.5 text-[11px] font-semibold text-white" style={{ background: TONE_COLOR[grade.tone] }}>{grade.letter}</span>
                    </span>
                    <Link href={`/exam/${h.school}/${h.school}-${h.code.toLowerCase()}/result`} className="hidden text-ink-3 hover:text-orange sm:block">
                      <ArrowUpRight size={17} />
                    </Link>
                  </div>
                );
              })}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function Avatar({ size = 36 }: { size?: number }) {
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full bg-ink font-semibold text-white"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      aria-hidden
    >
      MQ
    </span>
  );
}

function Stat({
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
    <div className="rounded-[10px] border border-line bg-paper p-4 shadow-[var(--shadow-1)]">
      <span style={{ color }}>{icon}</span>
      <p className="tnum mt-2 text-[26px] font-semibold leading-none" style={{ color }}>
        {value}
      </p>
      <p className="mt-1 text-[13px] font-medium text-ink-2">{label}</p>
      {sub && <p className="text-[12px] text-ink-3">{sub}</p>}
    </div>
  );
}

/** SVG line chart — blue, no chart library (avoids generic look). */
function ProgressChart({ data }: { data: number[] }) {
  const W = 560;
  const H = 180;
  const pad = { l: 28, r: 12, t: 14, b: 24 };
  const min = 4;
  const max = 10;
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;

  const x = (i: number) => pad.l + (i / (data.length - 1)) * innerW;
  const y = (v: number) => pad.t + (1 - (v - min) / (max - min)) * innerH;

  const linePts = data.map((v, i) => `${x(i)},${y(v)}`).join(" ");
  const areaPts = `${pad.l},${pad.t + innerH} ${linePts} ${pad.l + innerW},${pad.t + innerH}`;
  const gridYs = [4, 6, 8, 10];

  return (
    <div className="mt-3 overflow-hidden">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" preserveAspectRatio="xMidYMid meet">
        {gridYs.map((g) => (
          <g key={g}>
            <line x1={pad.l} x2={W - pad.r} y1={y(g)} y2={y(g)} stroke="var(--color-line)" strokeWidth="1" />
            <text x={4} y={y(g) + 4} fontSize="11" fill="var(--color-ink-3)" className="tnum">{g}</text>
          </g>
        ))}
        <polygon points={areaPts} fill="rgba(29,141,201,0.10)" />
        <polyline points={linePts} fill="none" stroke="var(--color-blue)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((v, i) => (
          <g key={i}>
            <circle cx={x(i)} cy={y(v)} r={i === data.length - 1 ? 5 : 3.5} fill="#fff" stroke="var(--color-blue)" strokeWidth="2.5" />
            <text x={x(i)} y={H - 8} fontSize="10.5" textAnchor="middle" fill="var(--color-ink-3)">
              {i + 1}
            </text>
          </g>
        ))}
        <text x={x(data.length - 1)} y={y(data[data.length - 1]) - 12} fontSize="12" fontWeight="600" textAnchor="middle" fill="var(--color-blue)" className="tnum">
          {data[data.length - 1].toFixed(1)}
        </text>
      </svg>
    </div>
  );
}
