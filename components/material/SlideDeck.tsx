"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Presentation } from "lucide-react";
import type { Question } from "@/lib/types";

export function SlideDeck({
  questions,
  title,
  subtitle,
}: {
  questions: Question[];
  title: string;
  subtitle: string;
}) {
  const total = questions.length + 1; // +1 slide bìa
  const [i, setI] = useState(0);

  const go = useCallback(
    (next: number) =>
      setI((prev) => Math.min(total - 1, Math.max(0, prev + next))),
    [total]
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  const q = i === 0 ? null : questions[i - 1];

  return (
    <div className="mx-auto max-w-[760px]">
      {/* Stage — 16:10 */}
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[14px] border border-line bg-paper shadow-[var(--shadow-2)]">
        {i === 0 ? (
          <div className="flex h-full flex-col justify-center bg-ink px-8 py-10 text-center sm:px-12">
            <span className="mx-auto inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[12px] font-medium text-[#cdd3dc]">
              <Presentation size={14} /> Slide tổng ôn
            </span>
            <h2 className="mt-5 font-display text-[28px] font-semibold leading-tight text-white sm:text-[36px]">
              {title}
            </h2>
            <p className="mt-3 text-[14px] text-[#aab2bf]">{subtitle}</p>
          </div>
        ) : (
          <div className="flex h-full flex-col px-7 py-7 sm:px-10 sm:py-9">
            <span className="text-[12px] font-semibold uppercase tracking-wide text-orange">
              Ý chính {i} / {questions.length}
            </span>
            <p className="mt-3 text-[18px] font-semibold leading-snug text-ink sm:text-[21px]">
              {q!.prompt}
            </p>
            {q!.formula && (
              <p className="mt-3 whitespace-pre-line font-display text-[16px] italic text-ink-2">
                {q!.formula}
              </p>
            )}
            {q!.code && (
              <pre className="mt-3 overflow-x-auto rounded-[8px] bg-ink p-3 font-mono text-[12px] leading-relaxed text-[#e6e9ef]">
                {q!.code}
              </pre>
            )}
            <div className="mt-auto border-t border-line pt-3.5">
              <p className="text-[14px] font-medium text-green">
                ✓ {q!.options[q!.answer]}
              </p>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-2">
                {q!.explain}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => go(-1)}
          disabled={i === 0}
          className="inline-flex h-10 w-10 items-center justify-center rounded-[8px] border border-line-strong bg-paper text-ink-2 transition-colors hover:border-ink-3 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Slide trước"
        >
          <ChevronLeft size={18} />
        </button>

        {/* Dots */}
        <div className="flex flex-1 flex-wrap items-center justify-center gap-1.5">
          {Array.from({ length: total }, (_, d) => (
            <button
              key={d}
              type="button"
              onClick={() => setI(d)}
              aria-label={`Tới slide ${d + 1}`}
              className={`h-2 rounded-full transition-all ${
                d === i ? "w-6 bg-orange" : "w-2 bg-line-strong hover:bg-ink-3"
              }`}
            />
          ))}
        </div>

        <span className="tnum min-w-[52px] text-center text-[13px] font-medium text-ink-2">
          {i + 1} / {total}
        </span>

        <button
          type="button"
          onClick={() => go(1)}
          disabled={i === total - 1}
          className="inline-flex h-10 w-10 items-center justify-center rounded-[8px] bg-orange text-white shadow-[0_1px_2px_rgba(7,141,248,0.32)] transition-colors hover:bg-orange-dark disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Slide sau"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
