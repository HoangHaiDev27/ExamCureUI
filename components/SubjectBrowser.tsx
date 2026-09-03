"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  ChevronRight,
  Clock,
  FileText,
  GraduationCap,
  Layers3,
  MessageSquareText,
  MessagesSquare,
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

const FPT_TERM_ACTIVITY: Record<number, {
  topics: string;
  posts: string;
  latest: string;
  time: string;
  author: string;
  avatar: string;
  avatarColor: string;
}> = {
  1: { topics: "482", posts: "844", latest: "MED201c · SU26 · RE", time: "23/8/26", author: "Hương Mai", avatar: "H", avatarColor: "#f59e0b" },
  2: { topics: "562", posts: "889", latest: "PRN212 · SU26 · B1 · PE", time: "24/8/26", author: "twoduck", avatar: "T", avatarColor: "#0ea5e9" },
  3: { topics: "541", posts: "1.5K", latest: "WED201c · SU26 · RE", time: "23/8/26", author: "Nezuko94", avatar: "N", avatarColor: "#8b5cf6" },
  4: { topics: "532", posts: "1.4K", latest: "SWE201c · SU26 · RE", time: "24/8/26", author: "minhha289", avatar: "M", avatarColor: "#64748b" },
  5: { topics: "607", posts: "1.2K", latest: "ITE302c · SU26 · RE", time: "23/8/26", author: "minhha289", avatar: "M", avatarColor: "#64748b" },
  6: { topics: "83", posts: "174", latest: "ENW492c · SU26 · RE · R", time: "Thứ ba lúc 11:31", author: "phongmnse170341", avatar: "P", avatarColor: "#475569" },
  7: { topics: "274", posts: "890", latest: "WDU202c · SU26 · RE", time: "23/8/26", author: "Hương Mai", avatar: "H", avatarColor: "#f59e0b" },
  8: { topics: "276", posts: "2K", latest: "WDU203c · SU26 · RE", time: "23/8/26", author: "minhha289", avatar: "M", avatarColor: "#64748b" },
  9: { topics: "145", posts: "1.3K", latest: "HCM202 · SU26 · C1FE", time: "Hôm qua, lúc 06:16", author: "Ericpham04", avatar: "P", avatarColor: "#0f9fad" },
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
  const [term, setTerm] = useState<number | null>(null);
  const isFpt = school.id === "fptu";

  const faculties = useMemo(
    () => Array.from(new Set(subjects.map((s) => s.faculty))),
    [subjects]
  );

  const filtered = useMemo(() => {
    const q = norm(query.trim());
    return subjects.filter((s) => {
      if (diff && s.difficulty !== diff) return false;
      if (faculty && s.faculty !== faculty) return false;
      if (term && s.semester !== `Kỳ ${term}`) return false;
      if (!q) return true;
      return norm(s.name).includes(q) || norm(s.code).includes(q);
    });
  }, [subjects, query, diff, faculty, term]);

  const fptGroups = useMemo(() => {
    if (!isFpt) return [];
    return Array.from({ length: 9 }, (_, index) => {
      const number = index + 1;
      return {
        number,
        subjects: filtered.filter((subject) => subject.semester === `Kỳ ${number}`),
      };
    }).filter((group) => group.subjects.length > 0);
  }, [filtered, isFpt]);

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
            {isFpt ? "Danh mục môn học Đại học FPT" : "Học phần đang mở thi thử"}
          </h1>
          <p className="mt-1.5 text-[15px] text-ink-2">
            {isFpt ? (
              <>Tra cứu đầy đủ môn học theo 9 kỳ, xem tài liệu và luyện thi trên <span className="font-medium text-ink">{school.theme.systemName}</span>.</>
            ) : (
              <>Chọn học phần để xem tài liệu ôn tập và vào phòng thi mô phỏng <span className="font-medium text-ink">{school.theme.systemName}</span>.</>
            )}
          </p>
        </div>
        <div className="flex gap-6 rounded-[8px] border border-line bg-paper px-5 py-3 shadow-[var(--shadow-1)]">
          <div>
            <p className="tnum text-[22px] font-semibold leading-none text-ink">{subjects.length}</p>
            <p className="text-[12px] text-ink-2">học phần</p>
          </div>
          <div className="border-l border-line pl-6">
            <p className="tnum text-[22px] font-semibold leading-none text-orange">
              {isFpt ? 9 : subjects.reduce((a, s) => a + s.examCount, 0)}
            </p>
            <p className="text-[12px] text-ink-2">{isFpt ? "kỳ học" : "đề thi"}</p>
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
        {isFpt ? (
          <div className="flex flex-col gap-2.5">
            <div className="flex flex-wrap gap-2" aria-label="Lọc theo kỳ">
              <FilterChip active={!term} onClick={() => setTerm(null)}>Tất cả 9 kỳ</FilterChip>
              {Array.from({ length: 9 }, (_, index) => index + 1).map((number) => (
                <FilterChip key={number} active={term === number} onClick={() => setTerm(term === number ? null : number)}>
                  Kỳ {number}
                </FilterChip>
              ))}
            </div>
            <div className="flex flex-wrap gap-2" aria-label="Lọc theo nhóm môn">
              <span className="mr-1 self-center text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-3">Nhóm môn</span>
              {faculties.map((f) => (
                <FilterChip key={f} active={faculty === f} onClick={() => setFaculty(faculty === f ? null : f)}>
                  {f}
                </FilterChip>
              ))}
            </div>
          </div>
        ) : (
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
        )}
      </div>

      {isFpt ? (
        <FptSubjectDirectory school={school} groups={fptGroups} resultCount={filtered.length} />
      ) : (
      /* Table */
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
      )}
    </main>
  );
}

function FptSubjectDirectory({
  school,
  groups,
  resultCount,
}: {
  school: School;
  groups: { number: number; subjects: Subject[] }[];
  resultCount: number;
}) {
  if (resultCount === 0) {
    return (
      <div className="mt-5 rounded-[10px] border border-line bg-paper px-5 py-16 text-center shadow-[var(--shadow-1)]">
        <p className="text-[15px] font-medium text-ink">Không có môn học phù hợp</p>
        <p className="mt-1 text-[14px] text-ink-2">Thử chọn kỳ khác hoặc tìm bằng mã môn ngắn hơn.</p>
      </div>
    );
  }

  return (
    <section className="mt-5" aria-label="Danh mục môn học FPT theo kỳ">
      <div className="mb-3 flex items-center justify-between gap-4 text-[13px] text-ink-2">
        <span className="inline-flex items-center gap-1.5">
          <Layers3 size={15} className="text-orange" />
          Đang hiển thị <strong className="tnum text-ink">{resultCount}</strong> môn học
        </span>
        <span className="hidden text-ink-3 sm:inline">Chọn mã môn để mở kho ôn tập</span>
      </div>

      <div className="space-y-6">
        {groups.map((group) => (
          <article
            key={group.number}
            aria-labelledby={`fpt-term-${group.number}`}
            className="overflow-hidden rounded-[10px] border border-line bg-paper shadow-[var(--shadow-1)]"
          >
            <header className="flex items-center gap-3 border-b border-line bg-paper-2 px-4 py-4 sm:px-5">
              <span
                className="tnum inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[8px] text-[19px] font-bold text-white shadow-[0_3px_10px_rgba(243,112,33,0.2)]"
                style={{ background: school.theme.brand }}
                aria-hidden="true"
              >
                {group.number}
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-orange-dark">Học kỳ</p>
                <h2 id={`fpt-term-${group.number}`} className="font-display text-[22px] font-semibold leading-tight text-ink sm:text-[24px]">
                  Kỳ {group.number}
                </h2>
              </div>
              <div className="ml-auto flex items-center gap-2 rounded-[6px] border border-line bg-paper px-2.5 py-1.5 text-[12.5px] text-ink-2">
                <GraduationCap size={15} className="text-ink-3" aria-hidden="true" />
                <strong className="tnum font-semibold text-ink">{group.subjects.length}</strong> môn học
              </div>
            </header>

            <FptTermActivity term={group.number} />
            <div className="grid gap-px bg-line sm:grid-cols-2 xl:grid-cols-3">
              {group.subjects.map((subject) => (
                <FptSubjectLink key={subject.id} school={school} subject={subject} />
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function FptTermActivity({ term }: { term: number }) {
  const activity = FPT_TERM_ACTIVITY[term];

  return (
    <div className="grid grid-cols-2 border-b border-line bg-[#fbfcfe] sm:grid-cols-[100px_100px_1fr]">
      <div className="flex items-center gap-2 border-r border-line px-3 py-3 sm:px-4">
        <MessageSquareText size={15} className="shrink-0 text-ink-3" aria-hidden="true" />
        <span>
          <span className="block text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-3">Chủ đề</span>
          <strong className="tnum block text-[14px] leading-tight text-orange-dark">{activity.topics}</strong>
        </span>
      </div>
      <div className="flex items-center gap-2 px-3 py-3 sm:border-r sm:border-line sm:px-4">
        <MessagesSquare size={15} className="shrink-0 text-ink-3" aria-hidden="true" />
        <span>
          <span className="block text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-3">Bài viết</span>
          <strong className="tnum block text-[14px] leading-tight text-orange-dark">{activity.posts}</strong>
        </span>
      </div>
      <Link
        href="/dien-dan"
        className="group col-span-2 flex min-w-0 items-center gap-2.5 border-t border-line px-3 py-2.5 transition-colors hover:bg-orange-soft sm:col-span-1 sm:border-t-0 sm:px-4"
        aria-label={`Bài viết mới nhất kỳ ${term}: ${activity.latest}`}
      >
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white"
          style={{ background: activity.avatarColor }}
          aria-hidden="true"
        >
          {activity.avatar}
        </span>
        <span className="min-w-0 leading-tight">
          <span className="flex items-center gap-1.5">
            <span className="shrink-0 rounded-[4px] bg-danger px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">Đề thi FE</span>
            <span className="truncate text-[12.5px] font-semibold text-ink-2 group-hover:text-orange-dark">{activity.latest}</span>
          </span>
          <span className="mt-1 block truncate text-[11.5px] text-ink-3">
            {activity.time} · <strong className="font-semibold text-ink-2">{activity.author}</strong>
          </span>
        </span>
        <ArrowUpRight size={14} className="ml-auto shrink-0 text-ink-3 group-hover:text-orange" aria-hidden="true" />
      </Link>
    </div>
  );
}

function FptSubjectLink({ school, subject }: { school: School; subject: Subject }) {
  const hasKnownName = !subject.name.startsWith("Học phần ");

  return (
    <Link
      href={`/schools/${school.id}/subjects/${subject.id}`}
      className="group flex min-h-[72px] items-center justify-between gap-3 bg-paper px-4 py-3 transition-colors hover:bg-orange-soft"
      title={`${subject.code} · ${subject.name}`}
    >
      <span className="min-w-0">
        <span className="flex items-center gap-2">
          <span className="font-mono text-[14px] font-bold tracking-[0.02em] text-orange-dark">{subject.code}</span>
          <span className="tnum rounded-[4px] bg-paper-3 px-1.5 py-0.5 text-[10.5px] font-semibold text-ink-3">
            {subject.examCount} đề
          </span>
        </span>
        <span className="mt-0.5 block truncate text-[12.5px] text-ink-2">
          {hasKnownName ? subject.name : subject.faculty}
        </span>
      </span>
      <ArrowUpRight size={16} className="shrink-0 text-ink-3 transition-[color,transform] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-orange" />
    </Link>
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
