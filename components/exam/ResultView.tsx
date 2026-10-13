"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  CircleCheck,
  CircleX,
  Clock3,
  MinusCircle,
  RotateCcw,
  Target,
} from "lucide-react";
import type { School } from "@/lib/types";
import type { AttemptDetail } from "@/lib/catalog";
import { subjectRouteId } from "@/lib/catalog";
import { optionIndex, summarizeAttempt } from "@/lib/exam-helpers";
import { SchoolMark } from "@/components/SchoolMark";
import { classify, TONE_COLOR } from "@/lib/grade";
import { examCodeFor } from "@/lib/student";

const LETTERS = ["A", "B", "C", "D"];

function fmtDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m} phút ${s.toString().padStart(2, "0")} giây`;
}

export function ResultView({
  school,
  attempt,
}: {
  school: School;
  attempt: AttemptDetail;
}) {
  const { subject, questions } = attempt;
  const total = questions.length;
  const { theme } = school;
  const examCode = examCodeFor(attempt.exam.id);
  const hasSubject = Boolean(subject.code);
  const retakeHref = hasSubject
    ? `/exam/${subject.schoolCode}/${subjectRouteId(subject.schoolCode, subject.code)}?exam=${attempt.exam.id}`
    : "/dashboard?tab=lich-su";
  const [open, setOpen] = useState<number | null>(null);

  const { correct, wrong, blank, accuracy } = useMemo(() => summarizeAttempt(questions), [questions]);
  const score10 = attempt.score;

  const grade = classify(score10);
  const gradeColor = TONE_COLOR[grade.tone];

  return (
    <div className="min-h-[100dvh] bg-paper-2">
      {/* Branded result header */}
      <header className="border-b border-line bg-paper">
        <div style={{ height: 4, background: theme.brand }} />
        <div className="mx-auto flex max-w-[1100px] items-center gap-3 px-5 py-3.5 lg:px-8">
          <SchoolMark theme={theme} abbr={school.abbr} size={38} />
          <div className="min-w-0">
            <p className="truncate text-[14px] font-semibold leading-tight">
              {subject.name || "Môn học không còn tồn tại"}{hasSubject && <span className="text-ink-3"> · {subject.code}</span>}
            </p>
            <p className="text-[12px] text-ink-3">
              {school.abbr} · {theme.systemName} · Mã đề {examCode}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Link
              href={retakeHref}
              className="inline-flex h-9 items-center gap-1.5 rounded-[6px] border border-line-strong bg-paper px-3.5 text-[13px] font-medium text-ink hover:bg-paper-2"
            >
              <RotateCcw size={15} /> Làm lại
            </Link>
            <Link
              href="/dashboard?tab=mon-hoc"
              className="inline-flex h-9 items-center rounded-[6px] px-3.5 text-[13px] font-medium text-white"
              style={{ background: theme.brand }}
            >
              Về danh sách môn
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1100px] px-5 py-7 lg:px-8">
        <p className="text-[13px] font-medium uppercase tracking-wide text-ink-3">
          Kết quả thi thử
        </p>

        {/* Summary */}
        <div className="mt-3 grid gap-4 lg:grid-cols-[300px_1fr]">
          {/* Score block */}
          <div className="animate-rise rounded-[10px] border border-line bg-paper p-6 text-center shadow-[var(--shadow-1)]">
            <p className="text-[13px] text-ink-2">Điểm số (thang 10)</p>
            <p
              className="tnum mt-1 font-display text-[64px] font-semibold leading-none"
              style={{ color: gradeColor }}
            >
              {score10.toFixed(1)}
            </p>
            <div
              className="mt-3 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[13px] font-semibold"
              style={{ background: `${gradeColor}1a`, color: gradeColor }}
            >
              <span className="grid h-5 w-5 place-items-center rounded-full text-[11px] text-white" style={{ background: gradeColor }}>
                {grade.letter}
              </span>
              Xếp loại: {grade.label}
            </div>
            <div className="mt-5 flex items-center justify-center gap-2 text-[13px] text-ink-2">
              <Clock3 size={15} className="text-ink-3" />
              Thời gian làm bài: {fmtDuration(attempt.spentSec)}
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={<CircleCheck size={18} />} tone="green" value={correct} label="Câu đúng" sub={`trên ${total} câu`} />
            <StatCard icon={<CircleX size={18} />} tone="danger" value={wrong} label="Câu sai" />
            <StatCard icon={<MinusCircle size={18} />} tone="muted" value={blank} label="Bỏ trống" />
            <StatCard icon={<Target size={18} />} tone="blue" value={`${accuracy}%`} label="Độ chính xác" sub="trên số câu đã làm" />
          </div>
        </div>

        {/* Distribution + review */}
        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_360px]">
          {/* Per-question review */}
          <section className="order-2 lg:order-1">
            <div className="flex items-baseline justify-between">
              <h2 className="text-[15px] font-semibold">Xem lại từng câu</h2>
              <span className="text-[13px] text-ink-3">{total} câu</span>
            </div>
            <div className="mt-3 divide-y divide-line overflow-hidden rounded-[10px] border border-line bg-paper">
              {questions.map((q, i) => {
                const chosen = optionIndex(q.options, q.selectedPosition);
                const answerIdx = optionIndex(q.options, q.correctPosition);
                const isCorrect = q.isCorrect;
                const isBlank = q.selectedPosition === null;
                const expanded = open === i;
                return (
                  <div key={q.id}>
                    <button
                      onClick={() => setOpen(expanded ? null : i)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-paper-2"
                    >
                      <StatusBadge state={isBlank ? "blank" : isCorrect ? "correct" : "wrong"} index={i + 1} />
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-1 text-[14px] text-ink">{q.prompt ?? "(Câu hỏi không còn tồn tại)"}</span>
                        <span className="mt-0.5 block text-[12.5px] text-ink-3">
                          {isBlank ? (
                            "Bỏ trống"
                          ) : (
                            <>
                              Bạn chọn{" "}
                              <b style={{ color: isCorrect ? "var(--color-green)" : "var(--color-danger)" }}>
                                {LETTERS[chosen] ?? "?"}
                              </b>
                              {!isCorrect && (
                                <>
                                  {" · Đáp án đúng "}
                                  <b className="text-green">{LETTERS[answerIdx] ?? "?"}</b>
                                </>
                              )}
                            </>
                          )}
                        </span>
                      </span>
                      <ChevronDown
                        size={17}
                        className={`shrink-0 text-ink-3 transition-transform ${expanded ? "rotate-180" : ""}`}
                      />
                    </button>

                    {expanded && (
                      <div className="border-t border-line bg-paper-2 px-4 py-4">
                        <div className="space-y-2">
                          {q.options.map((opt, oi) => {
                            const isAns = oi === answerIdx;
                            const isChosenWrong = oi === chosen && !isCorrect;
                            return (
                              <div
                                key={oi}
                                className="flex items-center gap-3 rounded-[6px] border px-3 py-2 text-[14px]"
                                style={{
                                  borderColor: isAns
                                    ? "var(--color-green)"
                                    : isChosenWrong
                                      ? "var(--color-danger)"
                                      : "var(--color-line)",
                                  background: isAns
                                    ? "var(--color-green-soft)"
                                    : isChosenWrong
                                      ? "var(--color-danger-soft)"
                                      : "var(--color-paper)",
                                }}
                              >
                                <span
                                  className="grid h-6 w-6 shrink-0 place-items-center rounded-[5px] text-[12px] font-semibold"
                                  style={{
                                    background: isAns
                                      ? "var(--color-green)"
                                      : isChosenWrong
                                        ? "var(--color-danger)"
                                        : "var(--color-paper-3)",
                                    color: isAns || isChosenWrong ? "#fff" : "var(--color-ink-2)",
                                  }}
                                >
                                  {LETTERS[oi]}
                                </span>
                                <span className="flex-1 whitespace-pre-line text-ink">{opt.content}</span>
                                {isAns && <Check size={16} className="shrink-0 text-green" />}
                                {isChosenWrong && <CircleX size={16} className="shrink-0 text-danger" />}
                              </div>
                            );
                          })}
                        </div>
                        {q.explanation && (
                          <div className="mt-3 rounded-[7px] border border-blue-soft bg-blue-soft px-3.5 py-3">
                            <p className="text-[12px] font-semibold uppercase tracking-wide text-blue-dark">
                              Lời giải
                            </p>
                            <p className="mt-1 text-[13.5px] leading-relaxed text-ink">{q.explanation}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Study tip */}
          <section className="order-1 lg:order-2">
            <div className="lg:sticky lg:top-6">
              <div className="rounded-[10px] border border-line bg-paper p-4 text-[13px] text-ink-2 shadow-[var(--shadow-1)]">
                <p className="font-medium text-ink">Gợi ý ôn tập</p>
                <p className="mt-1 leading-relaxed">
                  {wrong + blank > 0
                    ? `Bạn còn ${wrong + blank} câu chưa đúng. Mở phần "Xem lại từng câu" để đọc lời giải chi tiết và làm lại đề khác cùng học phần.`
                    : "Xuất sắc! Bạn đã trả lời đúng toàn bộ. Thử sức với đề khó hơn cùng học phần để duy trì phong độ."}
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  icon,
  value,
  label,
  sub,
  tone,
}: {
  icon: React.ReactNode;
  value: number | string;
  label: string;
  sub?: string;
  tone: "green" | "danger" | "blue" | "muted";
}) {
  const color =
    tone === "green"
      ? "var(--color-green)"
      : tone === "danger"
        ? "var(--color-danger)"
        : tone === "blue"
          ? "var(--color-blue)"
          : "var(--color-ink-3)";
  return (
    <div className="rounded-[10px] border border-line bg-paper p-4 shadow-[var(--shadow-1)]">
      <span style={{ color }}>{icon}</span>
      <p className="tnum mt-2 text-[28px] font-semibold leading-none text-ink">{value}</p>
      <p className="mt-1 text-[13px] font-medium text-ink-2">{label}</p>
      {sub && <p className="text-[12px] text-ink-3">{sub}</p>}
    </div>
  );
}

function StatusBadge({
  state,
  index,
}: {
  state: "correct" | "wrong" | "blank";
  index: number;
}) {
  const map = {
    correct: { bg: "var(--color-green-soft)", bd: "var(--color-green)", fg: "var(--color-green)" },
    wrong: { bg: "var(--color-danger-soft)", bd: "var(--color-danger)", fg: "var(--color-danger)" },
    blank: { bg: "var(--color-paper-3)", bd: "var(--color-line-strong)", fg: "var(--color-ink-3)" },
  }[state];
  return (
    <span
      className="tnum grid h-8 w-8 shrink-0 place-items-center rounded-[6px] border text-[13px] font-semibold"
      style={{ background: map.bg, borderColor: map.bd, color: map.fg }}
    >
      {index}
    </span>
  );
}
