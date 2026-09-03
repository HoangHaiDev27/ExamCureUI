"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL, useAuth } from "@/lib/auth";
import {
  BookOpen,
  ChevronRight,
  ClipboardList,
  Clock,
  FileText,
  Layers,
  NotebookText,
  Play,
  PlayCircle,
  Presentation,
  ScrollText,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { Difficulty, School, Subject } from "@/lib/types";
import type { ExamSet, Material, MaterialType } from "@/lib/materials";
import { classify, TONE_COLOR } from "@/lib/grade";

const DIFF_STYLE: Record<Difficulty, string> = {
  "Cơ bản": "border-green text-green bg-green-soft",
  "Trung bình": "border-blue text-blue-dark bg-blue-soft",
  "Nâng cao": "border-orange-border text-orange-dark bg-orange-soft",
};

const MATERIAL: Record<
  MaterialType,
  { label: string; Icon: LucideIcon; badge: string; action: string }
> = {
  summary: { label: "Tóm tắt lý thuyết", Icon: NotebookText, badge: "bg-blue-soft text-blue-dark", action: "Mở tài liệu" },
  cheatsheet: { label: "Cheatsheet", Icon: ScrollText, badge: "bg-green-soft text-green", action: "Mở tài liệu" },
  exercises: { label: "Bài tập có lời giải", Icon: ClipboardList, badge: "bg-blue-soft text-blue-dark", action: "Làm bài tập" },
  slide: { label: "Slide bài giảng", Icon: Presentation, badge: "bg-orange-soft text-orange-dark", action: "Mở slide" },
  video: { label: "Video ôn tập", Icon: PlayCircle, badge: "bg-danger-soft text-danger", action: "Xem video" },
  flashcard: { label: "Flashcard", Icon: Layers, badge: "bg-warning-soft text-warning", action: "Luyện thẻ" },
};

export function SubjectDetail({
  school,
  subject,
  materials,
  examSets,
}: {
  school: School;
  subject: Subject;
  materials: Material[];
  examSets: ExamSet[];
}) {
  const user = useAuth();
  const router = useRouter();
  const [uploadedMaterials, setUploadedMaterials] = useState<Material[] | null>(null);
  const [materialsError, setMaterialsError] = useState<string | null>(null);

  // Redirect if logged-in user belongs to another school
  useEffect(() => {
    if (user && user.schoolId && user.schoolId !== school.id) {
      router.replace(`/schools/${user.schoolId}/subjects/${user.schoolId}-${subject.code.toLowerCase()}`);
    }
  }, [user, school.id, subject.code, router]);

  useEffect(() => {
    if (!user?.token) {
      setUploadedMaterials([]);
      setMaterialsError("Đăng nhập để xem giáo trình do admin đăng.");
      return;
    }
    const controller = new AbortController();
    const query = new URLSearchParams({ schoolCode: school.id, subjectCode: subject.code });
    void fetch(`${API_BASE_URL}/Materials?${query}`, {
      headers: { Authorization: `Bearer ${user.token}` },
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message || "Không thể tải giáo trình.");
        return data as { materials: Array<{
          title: string; createdAt: string; version: { id: string; slide_count: number; original_filename: string; processed_at: string | null };
        }> };
      })
      .then((data) => {
        setUploadedMaterials(data.materials.map((entry) => ({
          id: entry.version.id,
          type: "slide",
          title: entry.title,
          meta: `${entry.version.slide_count} slide`,
          updated: new Date(entry.version.processed_at || entry.createdAt).toLocaleDateString("vi-VN"),
          source: entry.version.original_filename,
        })));
        setMaterialsError(null);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setUploadedMaterials([]);
        setMaterialsError(error instanceof Error ? error.message : "Không thể tải giáo trình.");
      });
    return () => controller.abort();
  }, [user?.token, school.id, subject.code]);

  const courseMaterials = uploadedMaterials || [];

  const grade = subject.lastScore != null ? classify(subject.lastScore) : null;
  const firstExamHref = `/exam/${school.id}/${subject.id}`;

  return (
    <main className="mx-auto max-w-[1180px] px-5 pb-20 lg:px-8">
      {/* Breadcrumb */}
      <nav className="flex flex-wrap items-center gap-1.5 py-5 text-[13px] text-ink-3">
        <Link href="/" className="hover:text-ink">Trang chủ</Link>
        <ChevronRight size={14} />
        <Link href="/schools" className="hover:text-ink">Chọn trường</Link>
        <ChevronRight size={14} />
        <Link href="/schools" className="hover:text-ink">{school.abbr}</Link>
        <ChevronRight size={14} />
        <span className="font-medium text-ink-2">{subject.code}</span>
      </nav>

      {/* Subject header */}
      <header className="overflow-hidden rounded-[12px] border border-line bg-paper shadow-[var(--shadow-1)]">
        <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-center lg:gap-8 lg:p-6">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="rounded-[5px] border border-line bg-paper-2 px-2 py-0.5 font-mono text-[12px] font-semibold text-ink-2">
                {subject.code}
              </span>
              <span className={`inline-flex rounded-[5px] border px-2 py-0.5 text-[12px] font-medium ${DIFF_STYLE[subject.difficulty]}`}>
                {subject.difficulty}
              </span>
            </div>
            <h1 className="mt-2.5 font-display text-[28px] font-semibold leading-tight text-ink sm:text-[34px]">
              {subject.name}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13.5px] text-ink-2">
              <span>{subject.faculty}</span>
              <Dot />
              <span>{subject.semester}</span>
              <Dot />
              <span className="inline-flex items-center gap-1.5">
                <FileText size={14} className="text-ink-3" /> {subject.questionCount} câu / đề
              </span>
              <Dot />
              <span className="inline-flex items-center gap-1.5">
                <Clock size={14} className="text-ink-3" /> {subject.durationMin} phút
              </span>
            </div>
          </div>

          {/* Score + CTA */}
          <div className="flex shrink-0 items-center gap-5 border-t border-line pt-4 lg:flex-col lg:items-end lg:gap-3 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <div className="lg:text-right">
              <p className="text-[12px] text-ink-3">Điểm gần nhất</p>
              {grade ? (
                <span className="mt-0.5 inline-flex items-center gap-1.5">
                  <span className="tnum font-display text-[24px] font-semibold leading-none" style={{ color: TONE_COLOR[grade.tone] }}>
                    {subject.lastScore?.toFixed(1)}
                  </span>
                  <span className="rounded-[4px] px-1.5 py-0.5 text-[11px] font-semibold text-white" style={{ background: TONE_COLOR[grade.tone] }}>
                    {grade.letter}
                  </span>
                </span>
              ) : (
                <p className="mt-0.5 text-[15px] font-medium text-ink-3">Chưa thi</p>
              )}
            </div>
            <Link
              href={firstExamHref}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] bg-orange px-5 text-[14.5px] font-medium text-white shadow-[0_1px_2px_rgba(7,141,248,0.32)] transition-colors hover:bg-orange-dark"
            >
              <Play size={16} fill="currentColor" /> Vào thi ngay
            </Link>
          </div>
        </div>

        {/* Section tabs */}
        <div className="flex gap-1 border-t border-line bg-paper-2 px-3 py-2">
          <TabLink href="#tai-lieu" icon={BookOpen} label="Tài liệu ôn tập" count={courseMaterials.length} />
          <TabLink href="#thi-thu" icon={FileText} label="Phần thi thử" count={examSets.length} />
        </div>
      </header>

      {/* ===== Tài liệu ôn tập ===== */}
      <section id="tai-lieu" className="mt-10 scroll-mt-20">
        <SectionHead
          eyebrow="Ôn trước khi thi"
          title="Tài liệu ôn tập"
          desc="Tổng hợp lý thuyết, công thức và bài tập do giảng viên và cộng đồng đóng góp."
          count={`${courseMaterials.length} tài liệu`}
        />
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {uploadedMaterials === null && <p className="text-[13px] text-ink-3">Đang tải giáo trình...</p>}
          {uploadedMaterials !== null && courseMaterials.map((m) => (
            <MaterialCard key={m.id} school={school} subject={subject} material={m} />
          ))}
        </div>
        {uploadedMaterials?.length === 0 && (
          <p className="mt-5 rounded-[8px] border border-dashed border-line-strong bg-paper px-4 py-3 text-[13px] text-ink-3">
            {materialsError || "Môn học này chưa có giáo trình được admin xuất bản."}
          </p>
        )}
      </section>

      {/* ===== Phần thi thử ===== */}
      <section id="thi-thu" className="mt-12 scroll-mt-20">
        <SectionHead
          eyebrow="Sẵn sàng vào phòng thi"
          title="Phần thi thử"
          desc={`Các đề mô phỏng đúng giao diện ${school.theme.systemName}. Có đồng hồ đếm ngược và chấm điểm tức thì.`}
          count={`${examSets.length} đề`}
        />

        <div className="mt-5 overflow-hidden rounded-[10px] border border-line bg-paper shadow-[var(--shadow-1)]">
          <div className="hidden grid-cols-[1fr_96px_96px_120px_140px_150px] gap-4 border-b border-line bg-paper-2 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-wide text-ink-3 lg:grid">
            <span>Đề thi</span>
            <span className="text-center">Số câu</span>
            <span className="text-center">Thời lượng</span>
            <span className="text-center">Độ khó</span>
            <span className="text-center">Điểm cao nhất</span>
            <span />
          </div>
          {examSets.map((e) => (
            <ExamRow key={e.id} school={school} subject={subject} exam={e} />
          ))}
        </div>
      </section>
    </main>
  );
}

function Dot() {
  return <span className="hidden h-1 w-1 rounded-full bg-line-strong sm:block" aria-hidden />;
}

function TabLink({
  href,
  icon: Icon,
  label,
  count,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  count: number;
}) {
  return (
    <a
      href={href}
      className="inline-flex items-center gap-2 rounded-[7px] px-3.5 py-2 text-[13.5px] font-medium text-ink-2 transition-colors hover:bg-paper hover:text-ink"
    >
      <Icon size={15} className="text-ink-3" />
      {label}
      <span className="tnum rounded-full bg-paper-3 px-1.5 py-0.5 text-[11px] font-semibold text-ink-3">
        {count}
      </span>
    </a>
  );
}

function SectionHead({
  eyebrow,
  title,
  desc,
  count,
}: {
  eyebrow: string;
  title: string;
  desc: string;
  count: string;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="max-w-2xl">
        <p className="text-[12.5px] font-semibold uppercase tracking-wide text-orange">{eyebrow}</p>
        <h2 className="mt-1 font-display text-[24px] font-semibold leading-tight text-ink sm:text-[28px]">
          {title}
        </h2>
        <p className="mt-1.5 text-[14.5px] leading-relaxed text-ink-2">{desc}</p>
      </div>
      <span className="tnum shrink-0 text-[13px] text-ink-3">{count}</span>
    </div>
  );
}

function MaterialCard({
  school,
  subject,
  material: m,
}: {
  school: School;
  subject: Subject;
  material: Material;
}) {
  const cfg = MATERIAL[m.type];
  const Icon = cfg.Icon;

  return (
    <Link
      href={`/schools/${school.id}/subjects/${subject.id}/materials/${m.id}`}
      className="group flex flex-col rounded-[10px] border border-line bg-paper p-4 shadow-[var(--shadow-1)] transition-all hover:-translate-y-0.5 hover:border-line-strong hover:shadow-[var(--shadow-2)]"
    >
      <div className="flex items-center gap-3">
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-[9px] ${cfg.badge}`}>
          <Icon size={20} strokeWidth={1.9} />
        </span>
        <div className="min-w-0">
          <p className="text-[11.5px] font-semibold uppercase tracking-wide text-ink-3">{cfg.label}</p>
          <p className="tnum text-[12.5px] text-ink-2">{m.meta}</p>
        </div>
      </div>

      <h3 className="mt-3 line-clamp-2 text-[15px] font-semibold leading-snug text-ink">
        {m.title}
      </h3>

      <div className="mt-auto flex items-center justify-between gap-2 pt-3.5 text-[12px] text-ink-3">
        <span className="min-w-0 truncate">
          {m.source} · cập nhật {m.updated}
        </span>
      </div>
      <div className="mt-2.5 border-t border-line pt-2.5">
        <span className="inline-flex items-center gap-1 text-[13px] font-medium text-orange transition-colors group-hover:text-orange-dark">
          {cfg.action}
          <ChevronRight size={14} className="transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}

function ExamRow({
  school,
  subject,
  exam: e,
}: {
  school: School;
  subject: Subject;
  exam: ExamSet;
}) {
  const grade = e.bestScore != null ? classify(e.bestScore) : null;

  return (
    <div className="grid grid-cols-1 items-center gap-3 border-b border-line px-5 py-4 transition-colors last:border-0 hover:bg-paper-2 lg:grid-cols-[1fr_96px_96px_120px_140px_150px] lg:gap-4">
      {/* Name */}
      <div className="min-w-0">
        <div className="flex items-center gap-2.5">
          <span className="tnum grid h-7 w-7 shrink-0 place-items-center rounded-[6px] bg-paper-3 text-[12.5px] font-semibold text-ink-2">
            {e.index}
          </span>
          <h3 className="truncate text-[15px] font-semibold text-ink">{e.name}</h3>
          <span className="rounded-[5px] border border-line bg-paper-2 px-1.5 py-0.5 text-[11px] font-medium text-ink-2">
            {e.tag}
          </span>
        </div>
        <p className="mt-1 inline-flex items-center gap-1.5 text-[12.5px] text-ink-3 lg:hidden">
          <Users size={12} /> {e.attempts.toLocaleString("vi-VN")} lượt thi
        </p>
      </div>

      {/* Questions */}
      <div className="flex items-center gap-1.5 text-[13px] text-ink-2 lg:justify-center">
        <FileText size={14} className="text-ink-3 lg:hidden" />
        <span className="tnum font-medium text-ink lg:text-[14px]">{e.questionCount}</span>
        <span className="lg:hidden">câu</span>
      </div>

      {/* Duration */}
      <div className="flex items-center gap-1.5 text-[13px] text-ink-2 lg:justify-center">
        <Clock size={14} className="text-ink-3" />
        <span className="tnum">{e.durationMin}′</span>
      </div>

      {/* Difficulty */}
      <div className="lg:flex lg:justify-center">
        <span className={`inline-flex rounded-[5px] border px-2 py-0.5 text-[12px] font-medium ${DIFF_STYLE[e.difficulty]}`}>
          {e.difficulty}
        </span>
      </div>

      {/* Best score */}
      <div className="lg:flex lg:justify-center">
        {grade ? (
          <span className="inline-flex items-center gap-1.5">
            <span className="tnum text-[15px] font-semibold" style={{ color: TONE_COLOR[grade.tone] }}>
              {e.bestScore?.toFixed(1)}
            </span>
            <span className="rounded-[4px] px-1.5 py-0.5 text-[11px] font-semibold text-white" style={{ background: TONE_COLOR[grade.tone] }}>
              {grade.letter}
            </span>
          </span>
        ) : (
          <span className="text-[13px] text-ink-3">Chưa làm</span>
        )}
      </div>

      {/* Action */}
      <div className="lg:flex lg:justify-end">
        <Link
          href={`/exam/${school.id}/${subject.id}`}
          className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-[7px] bg-orange px-4 text-[14px] font-medium text-white shadow-[0_1px_2px_rgba(7,141,248,0.32)] transition-colors hover:bg-orange-dark lg:w-auto"
        >
          <Play size={15} fill="currentColor" /> Bắt đầu
        </Link>
      </div>
    </div>
  );
}
