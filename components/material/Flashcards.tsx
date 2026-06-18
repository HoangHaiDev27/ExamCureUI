"use client";

import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  CircleCheck,
  Eye,
} from "lucide-react";
import type { Question } from "@/lib/types";

export function Flashcards({ cards }: { cards: Question[] }) {
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<Set<string>>(new Set());

  const card = cards[i];
  const atStart = i === 0;
  const atEnd = i === cards.length - 1;

  function go(next: number) {
    setFlipped(false);
    setI((prev) => Math.min(cards.length - 1, Math.max(0, prev + next)));
  }

  function toggleKnown() {
    setKnown((prev) => {
      const copy = new Set(prev);
      if (copy.has(card.id)) copy.delete(card.id);
      else copy.add(card.id);
      return copy;
    });
  }

  const isKnown = known.has(card.id);

  return (
    <div className="mx-auto max-w-[680px]">
      {/* Progress */}
      <div className="flex items-center justify-between text-[13px] text-ink-2">
        <span className="tnum font-medium">
          Thẻ {i + 1} / {cards.length}
        </span>
        <span className="inline-flex items-center gap-1.5 text-green">
          <CircleCheck size={15} /> Đã thuộc {known.size}
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-paper-3">
        <div
          className="h-full rounded-full bg-orange transition-[width] duration-300"
          style={{ width: `${((i + 1) / cards.length) * 100}%` }}
        />
      </div>

      {/* Card */}
      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className="mt-4 flex min-h-[280px] w-full flex-col rounded-[14px] border border-line bg-paper p-6 text-left shadow-[var(--shadow-2)] transition-colors hover:border-line-strong sm:p-8"
      >
        <span className="text-[11.5px] font-semibold uppercase tracking-wide text-ink-3">
          {flipped ? "Đáp án" : "Câu hỏi"}
        </span>

        {!flipped ? (
          <div className="mt-3 flex flex-1 flex-col">
            <p className="text-[18px] font-medium leading-relaxed text-ink">
              {card.prompt}
            </p>
            {card.formula && (
              <p className="mt-3 whitespace-pre-line font-display text-[17px] italic text-ink-2">
                {card.formula}
              </p>
            )}
            {card.code && (
              <pre className="mt-3 overflow-x-auto rounded-[8px] bg-ink p-3.5 font-mono text-[12.5px] leading-relaxed text-[#e6e9ef]">
                {card.code}
              </pre>
            )}
            <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-[13px] text-ink-3">
              <Eye size={14} /> Bấm để lật xem đáp án
            </span>
          </div>
        ) : (
          <div className="mt-3 flex flex-1 flex-col">
            <p className="text-[20px] font-semibold leading-snug text-green">
              {card.options[card.answer]}
            </p>
            <p className="mt-3 text-[14.5px] leading-relaxed text-ink-2">
              {card.explain}
            </p>
            <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-[13px] text-ink-3">
              <RotateCcw size={14} /> Bấm để lật lại câu hỏi
            </span>
          </div>
        )}
      </button>

      {/* Controls */}
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => go(-1)}
          disabled={atStart}
          className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-[8px] border border-line-strong bg-paper text-[14px] font-medium text-ink-2 transition-colors hover:border-ink-3 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft size={16} /> Trước
        </button>
        <button
          type="button"
          onClick={toggleKnown}
          className={`inline-flex h-11 items-center justify-center gap-1.5 rounded-[8px] border px-4 text-[14px] font-medium transition-colors ${
            isKnown
              ? "border-green bg-green-soft text-green"
              : "border-line-strong bg-paper text-ink-2 hover:border-ink-3 hover:text-ink"
          }`}
        >
          <CircleCheck size={16} /> {isKnown ? "Đã thuộc" : "Đánh dấu thuộc"}
        </button>
        <button
          type="button"
          onClick={() => go(1)}
          disabled={atEnd}
          className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-[8px] bg-orange text-[14px] font-medium text-white shadow-[0_1px_2px_rgba(7,141,248,0.32)] transition-colors hover:bg-orange-dark disabled:cursor-not-allowed disabled:opacity-40"
        >
          Tiếp <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
