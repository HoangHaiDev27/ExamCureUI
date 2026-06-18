import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  ClipboardList,
  Clock,
  Layers,
  ListChecks,
  NotebookText,
  Play,
  PlayCircle,
  Presentation,
  ScrollText,
  type LucideIcon,
} from "lucide-react";
import type { Question, School, Subject } from "@/lib/types";
import type { Material, MaterialType } from "@/lib/materials";
import { Flashcards } from "./material/Flashcards";
import { SlideDeck } from "./material/SlideDeck";

const MATERIAL: Record<
  MaterialType,
  { label: string; Icon: LucideIcon; badge: string }
> = {
  summary: { label: "Tóm tắt lý thuyết", Icon: NotebookText, badge: "bg-blue-soft text-blue-dark" },
  cheatsheet: { label: "Cheatsheet", Icon: ScrollText, badge: "bg-green-soft text-green" },
  exercises: { label: "Bài tập có lời giải", Icon: ClipboardList, badge: "bg-blue-soft text-blue-dark" },
  slide: { label: "Slide bài giảng", Icon: Presentation, badge: "bg-orange-soft text-orange-dark" },
  video: { label: "Video ôn tập", Icon: PlayCircle, badge: "bg-danger-soft text-danger" },
  flashcard: { label: "Flashcard", Icon: Layers, badge: "bg-warning-soft text-warning" },
};

export function MaterialViewer({
  school,
  subject,
  material,
  questions,
}: {
  school: School;
  subject: Subject;
  material: Material;
  questions: Question[];
}) {
  const cfg = MATERIAL[material.type];
  const Icon = cfg.Icon;
  const subjectHref = `/schools/${school.id}/subjects/${subject.id}`;

  return (
    <main className="mx-auto max-w-[900px] px-5 pb-20 lg:px-8">
      {/* Breadcrumb */}
      <nav className="flex flex-wrap items-center gap-1.5 py-5 text-[13px] text-ink-3">
        <Link href="/schools" className="hover:text-ink">Chọn trường</Link>
        <ChevronRight size={14} />
        <Link href={`/schools/${school.id}/subjects`} className="hover:text-ink">{school.abbr}</Link>
        <ChevronRight size={14} />
        <Link href={subjectHref} className="hover:text-ink">{subject.code}</Link>
        <ChevronRight size={14} />
        <span className="font-medium text-ink-2">Tài liệu</span>
      </nav>

      <Link
        href={subjectHref}
        className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-ink-2 transition-colors hover:text-ink"
      >
        <ArrowLeft size={15} /> Quay lại {subject.name}
      </Link>

      {/* Header */}
      <header className="mt-3 flex items-start gap-4 rounded-[12px] border border-line bg-paper p-5 shadow-[var(--shadow-1)]">
        <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-[10px] ${cfg.badge}`}>
          <Icon size={24} strokeWidth={1.9} />
        </span>
        <div className="min-w-0">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-ink-3">{cfg.label}</p>
          <h1 className="mt-0.5 font-display text-[24px] font-semibold leading-tight text-ink sm:text-[28px]">
            {material.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-ink-3">
            <span className="tnum">{material.meta}</span>
            <span className="h-1 w-1 rounded-full bg-line-strong" aria-hidden />
            <span>{material.source}</span>
            <span className="h-1 w-1 rounded-full bg-line-strong" aria-hidden />
            <span>cập nhật {material.updated}</span>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="mt-7">
        {material.type === "summary" && <SummaryView questions={questions} />}
        {material.type === "cheatsheet" && <CheatsheetView questions={questions} />}
        {material.type === "exercises" && <ExercisesView questions={questions} />}
        {material.type === "video" && <VideoView material={material} questions={questions} />}
        {material.type === "flashcard" && <Flashcards cards={questions} />}
        {material.type === "slide" && (
          <SlideDeck
            questions={questions}
            title={subject.name}
            subtitle={`${subject.code} · ${school.theme.systemName}`}
          />
        )}
      </div>

      {/* Footer CTA */}
      <div className="mt-10 flex flex-col items-start gap-4 rounded-[12px] border border-line bg-paper-2 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[15.5px] font-semibold text-ink">Đã ôn xong? Thử sức ngay.</p>
          <p className="mt-0.5 text-[13.5px] text-ink-2">
            Vào phòng thi mô phỏng {school.theme.systemName} để kiểm tra kiến thức.
          </p>
        </div>
        <div className="flex shrink-0 gap-2.5">
          <Link
            href={subjectHref}
            className="inline-flex h-10 items-center gap-1.5 rounded-[8px] border border-line-strong bg-paper px-4 text-[14px] font-medium text-ink-2 transition-colors hover:border-ink-3 hover:text-ink"
          >
            Tài liệu khác
          </Link>
          <Link
            href={`/exam/${school.id}/${subject.id}`}
            className="inline-flex h-10 items-center gap-1.5 rounded-[8px] bg-orange px-4 text-[14px] font-medium text-white shadow-[0_1px_2px_rgba(7,141,248,0.32)] transition-colors hover:bg-orange-dark"
          >
            <Play size={15} fill="currentColor" /> Vào thi thử
          </Link>
        </div>
      </div>
    </main>
  );
}

/* ---------- Tóm tắt lý thuyết ---------- */
function SummaryView({ questions }: { questions: Question[] }) {
  return (
    <article className="rounded-[12px] border border-line bg-paper p-6 shadow-[var(--shadow-1)] sm:p-7">
      <h2 className="flex items-center gap-2 text-[16px] font-semibold text-ink">
        <ListChecks size={18} className="text-orange" /> Các ý chính cần nhớ
      </h2>
      <ol className="mt-4 space-y-3.5">
        {questions.map((q, i) => (
          <li key={q.id} className="flex gap-3">
            <span className="tnum mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-orange-soft text-[12px] font-semibold text-orange-dark">
              {i + 1}
            </span>
            <p className="text-[14.5px] leading-relaxed text-ink">{q.explain}</p>
          </li>
        ))}
      </ol>
    </article>
  );
}

/* ---------- Cheatsheet ---------- */
function CheatsheetView({ questions }: { questions: Question[] }) {
  const refs = questions.filter((q) => q.formula || q.code);

  return (
    <div className="space-y-6">
      {refs.length > 0 && (
        <section>
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-ink-3">
            Công thức & cú pháp nhanh
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {refs.map((q) => (
              <div key={q.id} className="rounded-[10px] border border-line bg-paper p-3.5 shadow-[var(--shadow-1)]">
                {q.formula && (
                  <p className="whitespace-pre-line font-display text-[16px] italic text-ink">{q.formula}</p>
                )}
                {q.code && (
                  <pre className="overflow-x-auto rounded-[7px] bg-ink p-3 font-mono text-[12px] leading-relaxed text-[#e6e9ef]">
                    {q.code}
                  </pre>
                )}
                <p className="mt-2 text-[12.5px] leading-relaxed text-ink-2">{q.explain}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-[13px] font-semibold uppercase tracking-wide text-ink-3">Ghi nhớ nhanh</h2>
        <ul className="mt-3 divide-y divide-line overflow-hidden rounded-[10px] border border-line bg-paper shadow-[var(--shadow-1)]">
          {questions.map((q) => (
            <li key={q.id} className="flex gap-3 px-4 py-3">
              <Check size={16} className="mt-0.5 shrink-0 text-green" strokeWidth={2.6} />
              <p className="text-[14px] leading-relaxed text-ink">{q.explain}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/* ---------- Bài tập có lời giải ---------- */
const ALPHA = ["A", "B", "C", "D", "E"];

function ExercisesView({ questions }: { questions: Question[] }) {
  return (
    <div className="space-y-4">
      {questions.map((q, i) => (
        <article key={q.id} className="rounded-[12px] border border-line bg-paper p-5 shadow-[var(--shadow-1)]">
          <div className="flex gap-3">
            <span className="tnum grid h-7 w-7 shrink-0 place-items-center rounded-[7px] bg-paper-3 text-[13px] font-semibold text-ink-2">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-medium leading-relaxed text-ink">{q.prompt}</p>
              {q.formula && (
                <p className="mt-2 whitespace-pre-line font-display text-[16px] italic text-ink-2">{q.formula}</p>
              )}
              {q.code && (
                <pre className="mt-2 overflow-x-auto rounded-[8px] bg-ink p-3.5 font-mono text-[12.5px] leading-relaxed text-[#e6e9ef]">
                  {q.code}
                </pre>
              )}
              <ul className="mt-3 space-y-1.5">
                {q.options.map((opt, oi) => (
                  <li key={oi} className="flex items-start gap-2.5 text-[14px] text-ink-2">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-[5px] border border-line bg-paper-2 text-[11.5px] font-semibold text-ink-3">
                      {ALPHA[oi]}
                    </span>
                    {opt}
                  </li>
                ))}
              </ul>

              <details className="group mt-3.5">
                <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 text-[13.5px] font-medium text-orange hover:text-orange-dark [&::-webkit-details-marker]:hidden">
                  <ChevronRight size={15} className="transition-transform group-open:rotate-90" />
                  Xem đáp án & lời giải
                </summary>
                <div className="mt-2.5 rounded-[8px] border border-green/40 bg-green-soft p-3.5">
                  <p className="text-[13.5px] font-semibold text-green">
                    Đáp án: {ALPHA[q.answer]}. {q.options[q.answer]}
                  </p>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-2">{q.explain}</p>
                </div>
              </details>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

/* ---------- Video ôn tập (bản xem trước) ---------- */
function fmtTime(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function getChapters(questions: Question[]): { id: string; time: string; title: string }[] {
  let t = 0;
  return questions.slice(0, 8).map((q, i) => {
    const start = t;
    t += 90 + ((i * 37) % 150);
    return { id: q.id, time: fmtTime(start), title: q.prompt };
  });
}

function VideoView({ material, questions }: { material: Material; questions: Question[] }) {
  // Mốc thời gian chương suy ra deterministic từ danh sách câu hỏi.
  const chapters = getChapters(questions);

  return (
    <div className="space-y-5">
      {/* Player placeholder */}
      <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-[14px] bg-ink shadow-[var(--shadow-2)]">
        <div className="bg-dotgrid pointer-events-none absolute inset-0 opacity-[0.07]" />
        <div className="relative text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-white/10 text-white ring-1 ring-white/20 transition-colors hover:bg-white/15">
            <PlayCircle size={34} />
          </span>
          <p className="mt-3 text-[13.5px] text-[#aab2bf]">Bản xem trước · {material.meta}</p>
        </div>
        <span className="absolute left-4 top-4 rounded-[5px] bg-black/40 px-2 py-1 text-[11.5px] font-medium text-white/90">
          Video ôn tập
        </span>
      </div>

      {/* Chapters */}
      <section className="overflow-hidden rounded-[12px] border border-line bg-paper shadow-[var(--shadow-1)]">
        <h2 className="flex items-center gap-2 border-b border-line px-5 py-3 text-[14px] font-semibold text-ink">
          <Clock size={16} className="text-ink-3" /> Nội dung theo chương
        </h2>
        <ul className="divide-y divide-line">
          {chapters.map((c, i) => (
            <li key={c.id} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-paper-2">
              <span className="tnum w-12 shrink-0 text-[12.5px] font-medium text-orange">{c.time}</span>
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-paper-3 text-[11.5px] font-semibold text-ink-3">
                {i + 1}
              </span>
              <p className="line-clamp-1 text-[14px] text-ink">{c.title}</p>
            </li>
          ))}
        </ul>
      </section>

      <p className="flex items-center gap-1.5 text-[13px] text-ink-3">
        <ArrowRight size={14} /> Đây là bản xem trước nội dung; bản ghi đầy đủ đang được cập nhật.
      </p>
    </div>
  );
}
