"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  CalendarDays,
  ChevronRight,
  Clock,
  FileText,
  Search,
} from "lucide-react";
import type { Difficulty, School, Subject } from "@/lib/types";
import { classify, TONE_COLOR } from "@/lib/grade";
import { useAuth } from "@/lib/auth";

const DIFF_STYLE: Record<Difficulty, string> = {
  "Cơ bản": "border-green text-green bg-green-soft",
  "Trung bình": "border-blue text-blue-dark bg-blue-soft",
  "Nâng cao": "border-orange-border text-orange-dark bg-orange-soft",
};

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d");

export function SubjectBrowser({
  school,
  subjects,
}: {
  school: School;
  subjects: Subject[];
}) {
  const user = useAuth();
  const router = useRouter();

  // Redirect if logged-in user belongs to another school
  useEffect(() => {
    if (user && user.schoolId && user.schoolId !== school.id) {
      router.replace(`/schools/${user.schoolId}/subjects`);
    }
  }, [user, school.id, router]);

  const [query, setQuery] = useState("");
  const [diff, setDiff] = useState<string | null>(null);
  const [faculty, setFaculty] = useState<string | null>(null);

  const faculties = useMemo(
    () => Array.from(new Set(subjects.map((s) => s.faculty))),
    [subjects]
  );

  const filtered = useMemo(() => {
    const q = norm(query.trim());
    return subjects.filter((s) => {
      if (diff && s.difficulty !== diff) return false;
      if (faculty && s.faculty !== faculty) return false;
      if (!q) return true;
      return norm(s.name).includes(q) || norm(s.code).includes(q);
    });
  }, [subjects, query, diff, faculty]);

  return (
    <main className="mx-auto max-w-[1180px] px-5 pb-16 lg:px-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 py-5 text-[13px] text-ink-3">
        <Link href="/" className="hover:text-ink">Trang chủ</Link>
        <ChevronRight size={14} />
        <Link href="/schools" className="hover:text-ink">Chọn trường</Link>
        <ChevronRight size={14} />
        <span className="font-medium text-ink-2">{school.abbr}</span>
      </nav>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-border bg-orange-soft px-3 py-1 text-[12.5px] font-medium text-orange-dark">
            Bước 2 / 2 · Chọn học phần
          </span>
          <h1 className="mt-3 font-display text-[30px] font-semibold leading-tight text-ink sm:text-[36px]">
            Học phần đang mở thi thử
          </h1>
          <p className="mt-1.5 text-[15px] text-ink-2">
            Chọn học phần để xem tài liệu ôn tập và vào phòng thi mô phỏng{" "}
            <span className="font-medium text-ink">{school.theme.systemName}</span>.
          </p>
        </div>
        <div className="flex gap-6 rounded-[8px] border border-line bg-paper px-5 py-3 shadow-[var(--shadow-1)]">
          <div>
            <p className="tnum text-[22px] font-semibold leading-none text-ink">{subjects.length}</p>
            <p className="text-[12px] text-ink-2">học phần</p>
          </div>
          <div className="border-l border-line pl-6">
            <p className="tnum text-[22px] font-semibold leading-none text-orange">
              {subjects.reduce((a, s) => a + s.examCount, 0)}
            </p>
            <p className="text-[12px] text-ink-2">đề thi</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-6 flex flex-col gap-3">
        <div className="relative max-w-xl">
          <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm học phần theo tên hoặc mã (vd: CSD201)…"
            className="h-11 w-full rounded-[7px] border border-line bg-paper pl-11 pr-4 text-[15px] outline-none transition-colors placeholder:text-ink-3 focus:border-orange"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterChip active={!diff && !faculty} onClick={() => { setDiff(null); setFaculty(null); }}>
            Tất cả
          </FilterChip>
          {(["Cơ bản", "Trung bình", "Nâng cao"] as Difficulty[]).map((d) => (
            <FilterChip key={d} active={diff === d} onClick={() => setDiff(diff === d ? null : d)}>
              {d}
            </FilterChip>
          ))}
          <span className="mx-1 self-center text-line-strong">|</span>
          {faculties.map((f) => (
            <FilterChip key={f} active={faculty === f} onClick={() => setFaculty(faculty === f ? null : f)}>
              {f}
            </FilterChip>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="mt-5 overflow-hidden rounded-[10px] border border-line bg-paper shadow-[var(--shadow-1)]">
        {/* Column header — desktop */}
        <div className="hidden grid-cols-[1fr_84px_110px_120px_120px_150px] gap-4 border-b border-line bg-paper-2 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-wide text-ink-3 lg:grid">
          <span>Học phần</span>
          <span className="text-center">Số đề</span>
          <span className="text-center">Thời lượng</span>
          <span className="text-center">Độ khó</span>
          <span className="text-center">Điểm gần nhất</span>
          <span />
        </div>

        {filtered.length === 0 && (
          <div className="px-5 py-16 text-center">
            <p className="text-[15px] font-medium text-ink">Không có học phần phù hợp</p>
            <p className="mt-1 text-[14px] text-ink-2">Thử bỏ bộ lọc hoặc tìm với từ khóa khác.</p>
          </div>
        )}

        {filtered.map((s) => (
          <SubjectRow key={s.id} school={school} subject={s} />
        ))}
      </div>
    </main>
  );
}

function SubjectRow({ school, subject: s }: { school: School; subject: Subject }) {
  const grade = s.lastScore != null ? classify(s.lastScore) : null;

  return (
    <div className="grid grid-cols-1 items-center gap-3 border-b border-line px-5 py-4 transition-colors last:border-0 hover:bg-paper-2 lg:grid-cols-[1fr_84px_110px_120px_120px_150px] lg:gap-4">
      {/* Name */}
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="rounded-[5px] border border-line bg-paper-2 px-1.5 py-0.5 font-mono text-[11.5px] font-medium text-ink-2">
            {s.code}
          </span>
          <h3 className="truncate text-[15.5px] font-semibold text-ink">{s.name}</h3>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-ink-3">
          <span>{s.faculty}</span>
          <span className="inline-flex items-center gap-1">
            <CalendarDays size={12} /> {s.semester}
          </span>
          <span className="inline-flex items-center gap-1">
            <FileText size={12} /> {s.questionCount} câu
          </span>
        </div>
      </div>

      {/* Mobile meta row + desktop columns */}
      <div className="flex items-center gap-1.5 text-[13px] text-ink-2 lg:justify-center">
        <FileText size={14} className="text-ink-3 lg:hidden" />
        <span className="tnum font-medium text-ink lg:text-[14px]">{s.examCount}</span>
        <span className="lg:hidden">đề</span>
      </div>

      <div className="flex items-center gap-1.5 text-[13px] text-ink-2 lg:justify-center">
        <Clock size={14} className="text-ink-3" />
        <span className="tnum">{s.durationMin}′</span>
      </div>

      <div className="lg:flex lg:justify-center">
        <span className={`inline-flex rounded-[5px] border px-2 py-0.5 text-[12px] font-medium ${DIFF_STYLE[s.difficulty]}`}>
          {s.difficulty}
        </span>
      </div>

      <div className="lg:flex lg:justify-center">
        {grade ? (
          <span className="inline-flex items-center gap-1.5">
            <span className="tnum text-[15px] font-semibold" style={{ color: TONE_COLOR[grade.tone] }}>
              {s.lastScore?.toFixed(1)}
            </span>
            <span
              className="rounded-[4px] px-1.5 py-0.5 text-[11px] font-semibold text-white"
              style={{ background: TONE_COLOR[grade.tone] }}
            >
              {grade.letter}
            </span>
          </span>
        ) : (
          <span className="text-[13px] text-ink-3">Chưa thi</span>
        )}
      </div>

      {/* Action */}
      <div className="lg:flex lg:justify-end">
        <Link
          href={`/schools/${school.id}/subjects/${s.id}`}
          className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-[7px] bg-orange px-4 text-[14px] font-medium text-white shadow-[0_1px_2px_rgba(7,141,248,0.32)] transition-colors hover:bg-orange-dark lg:w-auto"
        >
          <BookOpen size={15} /> Vào ôn tập
        </Link>
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-[6px] border px-3 py-1.5 text-[13px] font-medium transition-colors ${
        active
          ? "border-orange bg-orange-soft text-orange-dark"
          : "border-line bg-paper text-ink-2 hover:border-line-strong hover:bg-paper-2"
      }`}
    >
      {children}
    </button>
  );
}
