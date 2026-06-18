"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
import type { Question, School, Subject } from "@/lib/types";
import { SchoolMark } from "@/components/SchoolMark";
import { classify, TONE_COLOR } from "@/lib/grade";
import { examCodeFor } from "@/lib/student";

const LETTERS = ["A", "B", "C", "D"];

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

interface Attempt {
  answers: number[];
  flagged: boolean[];
  spentSec: number;
}

/** Deterministic demo attempt — used for SSR & direct visits. */
function demoAttempt(subjectId: string, questions: Question[], durationSec: number): Attempt {
  const answers = questions.map((q, i) => {
    const r = hash(subjectId + "q" + i) % 100;
    if (r < 6) return -1; // bỏ trống
    if (r < 82) return q.answer; // đúng
    return (q.answer + 1) % q.options.length; // sai
  });
  return {
    answers,
    flagged: questions.map((_, i) => hash(subjectId + "f" + i) % 5 === 0),
    spentSec: Math.round(durationSec * 0.68),
  };
}

function fmtDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m} phút ${s.toString().padStart(2, "0")} giây`;
}

/** Bell-ish cohort distribution over score buckets 0..10. */
function distribution(subjectId: string): number[] {
  const mean = 6 + (hash(subjectId) % 18) / 10; // 6.0–7.7
  const bins: number[] = [];
  for (let x = 0; x <= 10; x++) {
    const d = x - mean;
    const v = Math.exp(-(d * d) / 4.2); // gaussian
    bins.push(Math.round(v * 1000));
  }
  return bins;
}

export function ResultView({
  school,
  subject,
  questions,
}: {
  school: School;
  subject: Subject;
  questions: Question[];
}) {
  const total = questions.length;
  const { theme } = school;
  const durationSec = subject.durationMin * 60;
  const examCode = examCodeFor(subject.id);

  const [attempt, setAttempt] = useState<Attempt>(() =>
    demoAttempt(subject.id, questions, durationSec)
  );
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(`thithu:attempt:${school.id}:${subject.id}`);
      if (raw) {
        const a = JSON.parse(raw) as Attempt;
        if (Array.isArray(a.answers) && a.answers.length === total) {
          setTimeout(() => {
            setAttempt(a);
          }, 0);
        }
      }
    } catch {
      /* ignore */
    }
  }, [school.id, subject.id, total]);

  const { correct, wrong, blank, score10, accuracy } = useMemo(() => {
    let c = 0,
      w = 0,
      b = 0;
    attempt.answers.forEach((ans, i) => {
      if (ans < 0) b++;
      else if (ans === questions[i].answer) c++;
      else w++;
    });
    const score = Math.round((c / total) * 100) / 10;
    const answered = c + w;
    return {
      correct: c,
      wrong: w,
      blank: b,
      score10: score,
      accuracy: answered ? Math.round((c / answered) * 100) : 0,
    };
  }, [attempt, questions, total]);

  const grade = classify(score10);
  const gradeColor = TONE_COLOR[grade.tone];

  const bins = useMemo(() => distribution(subject.id), [subject.id]);
  const maxBin = Math.max(...bins);
  const studentBucket = Math.min(10, Math.round(score10));
  const totalCohort = bins.reduce((a, b) => a + b, 0);
  const below = bins.slice(0, studentBucket).reduce((a, b) => a + b, 0);
  const percentile = Math.round((below / totalCohort) * 100);

  return (
    <div className="min-h-[100dvh] bg-paper-2">
      {/* Branded result header */}
      <header className="border-b border-line bg-paper">
        <div style={{ height: 4, background: theme.brand }} />
        <div className="mx-auto flex max-w-[1100px] items-center gap-3 px-5 py-3.5 lg:px-8">
          <SchoolMark theme={theme} abbr={school.abbr} size={38} />
          <div className="min-w-0">
            <p className="truncate text-[14px] font-semibold leading-tight">
              {subject.name} <span className="text-ink-3">· {subject.code}</span>
            </p>
            <p className="text-[12px] text-ink-3">
              {school.abbr} · {theme.systemName} · Mã đề {examCode}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Link
              href={`/exam/${school.id}/${subject.id}`}
              className="inline-flex h-9 items-center gap-1.5 rounded-[6px] border border-line-strong bg-paper px-3.5 text-[13px] font-medium text-ink hover:bg-paper-2"
            >
              <RotateCcw size={15} /> Thi lại
            </Link>
            <Link
              href={`/schools/${school.id}/subjects`}
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
                const chosen = attempt.answers[i];
                const isCorrect = chosen === q.answer;
                const isBlank = chosen < 0;
                const expanded = open === i;
                return (
                  <div key={q.id}>
                    <button
                      onClick={() => setOpen(expanded ? null : i)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-paper-2"
                    >
                      <StatusBadge state={isBlank ? "blank" : isCorrect ? "correct" : "wrong"} index={i + 1} />
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-1 text-[14px] text-ink">{q.prompt}</span>
                        <span className="mt-0.5 block text-[12.5px] text-ink-3">
                          {isBlank ? (
                            "Bỏ trống"
                          ) : (
                            <>
                              Bạn chọn{" "}
                              <b style={{ color: isCorrect ? "var(--color-green)" : "var(--color-danger)" }}>
                                {LETTERS[chosen]}
                              </b>
                              {!isCorrect && (
                                <>
                                  {" · Đáp án đúng "}
                                  <b className="text-green">{LETTERS[q.answer]}</b>
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
                        {q.code && (
                          <pre className="mb-3 overflow-x-auto rounded-[7px] border border-line bg-[#1a1d21] p-3.5 font-mono text-[13px] leading-relaxed text-[#e6e8eb]">
                            <code>{q.code}</code>
                          </pre>
                        )}
                        {q.formula && (
                          <div className="mb-3 rounded-[7px] border-l-[3px] border-line-strong bg-paper px-3.5 py-2.5">
                            <p className="whitespace-pre-line font-display text-[15px] italic text-ink">
                              {q.formula}
                            </p>
                          </div>
                        )}
                        <div className="space-y-2">
                          {q.options.map((opt, oi) => {
                            const isAns = oi === q.answer;
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
                                <span className="flex-1 whitespace-pre-line text-ink">{opt}</span>
                                {isAns && <Check size={16} className="shrink-0 text-green" />}
                                {isChosenWrong && <CircleX size={16} className="shrink-0 text-danger" />}
                              </div>
                            );
                          })}
                        </div>
                        <div className="mt-3 rounded-[7px] border border-blue-soft bg-blue-soft px-3.5 py-3">
                          <p className="text-[12px] font-semibold uppercase tracking-wide text-blue-dark">
                            Lời giải
                          </p>
                          <p className="mt-1 text-[13.5px] leading-relaxed text-ink">{q.explain}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Distribution */}
          <section className="order-1 lg:order-2">
            <div className="lg:sticky lg:top-6">
              <h2 className="text-[15px] font-semibold">Phổ điểm thí sinh</h2>
              <p className="mt-0.5 text-[12.5px] text-ink-3">
                So với thí sinh cùng môn {subject.code} tại {school.abbr}
              </p>

              <div className="mt-3 rounded-[10px] border border-line bg-paper p-4 shadow-[var(--shadow-1)]">
                <div className="flex h-[140px] items-end gap-[3px]">
                  {bins.map((v, x) => {
                    const isMe = x === studentBucket;
                    return (
                      <div key={x} className="flex flex-1 flex-col items-center justify-end">
                        <div
                          className="w-full rounded-t-[3px] transition-all"
                          style={{
                            height: `${Math.max(4, (v / maxBin) * 120)}px`,
                            background: isMe ? theme.brand : "var(--color-paper-3)",
                            border: isMe ? "none" : "1px solid var(--color-line)",
                          }}
                          title={`${x} điểm`}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="mt-1.5 flex gap-[3px]">
                  {bins.map((_, x) => (
                    <span key={x} className="tnum flex-1 text-center text-[10px] text-ink-3">
                      {x}
                    </span>
                  ))}
                </div>

                <div className="mt-3 rounded-[7px] bg-paper-2 px-3 py-2.5 text-center">
                  <p className="text-[13px] text-ink-2">
                    Bạn đạt <b className="tnum text-ink">{score10.toFixed(1)}</b> điểm — cao hơn{" "}
                    <b className="tnum" style={{ color: theme.brand }}>
                      ~{percentile}%
                    </b>{" "}
                    thí sinh
                  </p>
                </div>
              </div>

              <div className="mt-3 rounded-[10px] border border-line bg-paper p-4 text-[13px] text-ink-2 shadow-[var(--shadow-1)]">
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
