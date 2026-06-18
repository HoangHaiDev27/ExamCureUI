"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Play,
  Sparkles,
} from "lucide-react";
import { SchoolMark } from "@/components/SchoolMark";
import { ButtonLink } from "@/components/Button";
import type { Difficulty, School, Subject } from "@/lib/types";

export interface RecItem {
  reason: string;
  school: School;
  subject: Subject;
}

const DIFF_DOT: Record<Difficulty, string> = {
  "Cơ bản": "var(--color-green)",
  "Trung bình": "var(--color-blue)",
  "Nâng cao": "var(--color-orange)",
};

export function RecommendedCarousel({ items }: { items: RecItem[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 8);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [update]);

  function move(dir: number) {
    const el = ref.current;
    if (!el) return;
    const amount = Math.max(296, el.clientWidth * 0.85);
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  }

  return (
    <div className="mt-8 flex items-stretch gap-2 sm:gap-3">
      <ArrowButton side="left" disabled={!canLeft} onClick={() => move(-1)} />

      <div
        ref={ref}
        onScroll={update}
        className="no-scrollbar flex flex-1 snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-1"
      >
        {items.map((it, i) => (
          <Card key={`${it.school.id}-${it.subject.id}-${i}`} item={it} />
        ))}
      </div>

      <ArrowButton side="right" disabled={!canRight} onClick={() => move(1)} />
    </div>
  );
}

function ArrowButton({
  side,
  disabled,
  onClick,
}: {
  side: "left" | "right";
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={side === "left" ? "Đề trước" : "Đề tiếp theo"}
      className="hidden h-10 w-10 shrink-0 select-none place-items-center self-center rounded-full border border-line-strong bg-paper text-ink shadow-[var(--shadow-1)] transition-colors hover:border-ink-3 hover:bg-paper-2 disabled:cursor-default disabled:opacity-35 disabled:hover:border-line-strong disabled:hover:bg-paper sm:grid"
    >
      {side === "left" ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
    </button>
  );
}

function Card({ item }: { item: RecItem }) {
  const { school, subject, reason } = item;
  return (
    <article className="group flex w-[278px] shrink-0 snap-start flex-col overflow-hidden rounded-[10px] border border-line bg-paper shadow-[var(--shadow-1)] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[var(--shadow-2)]">
      <div style={{ height: 3, background: school.theme.brand }} />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-2.5">
          <SchoolMark theme={school.theme} abbr={school.abbr} size={34} />
          <span className="flex-1 truncate text-[12px] font-semibold uppercase tracking-wide text-ink-3">
            {school.abbr}
          </span>
          <span className="rounded-full bg-orange-soft px-2 py-0.5 text-[11px] font-semibold text-orange-dark">
            Đề xuất
          </span>
        </div>

        <h3 className="mt-3 text-[16px] font-semibold leading-snug text-ink">
          {subject.name}
        </h3>
        <span className="mt-1.5 inline-flex w-fit rounded-[5px] border border-line bg-paper-2 px-1.5 py-0.5 font-mono text-[11px] font-medium text-ink-2">
          {subject.code}
        </span>

        <p className="mt-3 flex items-start gap-1.5 text-[12.5px] leading-relaxed text-ink-2">
          <Sparkles size={14} className="mt-0.5 shrink-0 text-orange" />
          {reason}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[12.5px] text-ink-2">
          <span className="inline-flex items-center gap-1">
            <Clock size={13} className="text-ink-3" /> {subject.durationMin}′
          </span>
          <span className="inline-flex items-center gap-1">
            <FileText size={13} className="text-ink-3" /> {subject.questionCount} câu
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: DIFF_DOT[subject.difficulty] }} />
            {subject.difficulty}
          </span>
        </div>

        <div className="mt-auto pt-4">
          <ButtonLink
            href={`/exam/${school.id}/${subject.id}`}
            variant="primary"
            size="md"
            className="w-full"
          >
            <Play size={15} fill="currentColor" /> Vào thi thử
          </ButtonLink>
        </div>
      </div>
    </article>
  );
}
