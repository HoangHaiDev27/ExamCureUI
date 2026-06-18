"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Flag,
  Grip,
  LayoutGrid,
  List,
  LogOut,
  Send,
  X,
} from "lucide-react";
import type { Question, School, Subject } from "@/lib/types";
import { SchoolMark } from "@/components/SchoolMark";
import { STUDENT, mssvFor, examCodeFor } from "@/lib/student";

const LETTERS = ["A", "B", "C", "D"];

function fmt(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export function ExamRoom({
  school,
  subject,
  questions,
}: {
  school: School;
  subject: Subject;
  questions: Question[];
}) {
  const router = useRouter();
  const total = questions.length;
  const { theme } = school;
  const examCode = examCodeFor(subject.id);
  const mssv = mssvFor(school.id);
  const durationSec = subject.durationMin * 60;

  const [answers, setAnswers] = useState<number[]>(() => Array(total).fill(-1));
  const [flagged, setFlagged] = useState<boolean[]>(() => Array(total).fill(false));
  const [current, setCurrent] = useState(0);
  const [timeLeft, setTimeLeft] = useState(durationSec);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const submittedRef = useRef(false);

  const answeredCount = answers.filter((a) => a >= 0).length;
  const flaggedCount = flagged.filter(Boolean).length;
  const danger = timeLeft <= 300;

  const finish = useCallback(() => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    const attempt = {
      schoolId: school.id,
      subjectId: subject.id,
      answers,
      flagged,
      durationSec,
      spentSec: durationSec - timeLeft,
      submittedAt: Date.now(),
    };
    try {
      sessionStorage.setItem(
        `thithu:attempt:${school.id}:${subject.id}`,
        JSON.stringify(attempt)
      );
    } catch {
      /* ignore storage errors */
    }
    router.push(`/exam/${school.id}/${subject.id}/result`);
  }, [answers, flagged, durationSec, timeLeft, school.id, subject.id, router]);

  // Countdown
  useEffect(() => {
    const id = setInterval(() => {
      setTimeLeft((t) => (t <= 1 ? 0 : t - 1));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // Auto-submit when time runs out
  useEffect(() => {
    if (timeLeft === 0) finish();
  }, [timeLeft, finish]);

  const select = (qi: number, oi: number) =>
    setAnswers((a) => {
      const next = [...a];
      next[qi] = oi;
      return next;
    });

  const toggleFlag = (qi: number) =>
    setFlagged((f) => {
      const next = [...f];
      next[qi] = !next[qi];
      return next;
    });

  const go = useCallback(
    (i: number) => setCurrent(Math.max(0, Math.min(total - 1, i))),
    [total]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (submitOpen) return;
      if (e.key === "ArrowLeft") go(current - 1);
      else if (e.key === "ArrowRight") go(current + 1);
      else {
        const k = e.key.toUpperCase();
        const idx = LETTERS.indexOf(k);
        if (idx >= 0 && idx < questions[current].options.length)
          select(current, idx);
        else if (/^[1-4]$/.test(e.key)) {
          const oi = Number(e.key) - 1;
          if (oi < questions[current].options.length) select(current, oi);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, go, submitOpen, questions]);

  const q = questions[current];

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-paper-2 text-ink">
      <ExamHeader
        school={school}
        subject={subject}
        examCode={examCode}
        mssv={mssv}
        timeLeft={timeLeft}
        danger={danger}
        onExit={() => {
          if (confirm("Thoát khỏi phòng thi? Bài làm hiện tại sẽ không được lưu."))
            router.push(`/schools/${school.id}/subjects`);
        }}
      />

      <div className="flex min-h-0 flex-1">
        {/* Content */}
        <main className="min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
            {/* Question head */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-baseline gap-3">
                <span className="text-[13px] font-semibold uppercase tracking-wide text-ink-3">
                  Câu hỏi
                </span>
                <span className="tnum font-display text-[28px] font-semibold leading-none">
                  {current + 1}
                  <span className="text-[18px] text-ink-3">/{total}</span>
                </span>
              </div>
              <button
                onClick={() => toggleFlag(current)}
                className={`inline-flex h-9 items-center gap-2 rounded-[6px] border px-3 text-[13px] font-medium transition-colors ${
                  flagged[current]
                    ? "border-warning bg-warning-soft text-[#9a6a06]"
                    : "border-line bg-paper text-ink-2 hover:border-line-strong hover:bg-paper-2"
                }`}
              >
                <Flag size={15} fill={flagged[current] ? "currentColor" : "none"} />
                {flagged[current] ? "Đã đánh dấu" : "Đánh dấu xem lại"}
              </button>
            </div>

            <div className="mt-4 rounded-[8px] border border-line bg-paper p-5 shadow-[var(--shadow-1)] sm:p-7">
              <p className="text-[16px] font-medium leading-relaxed text-ink sm:text-[17px]">
                {q.prompt}
              </p>

              {q.code && (
                <pre className="mt-4 overflow-x-auto rounded-[7px] border border-line bg-[#1a1d21] p-4 font-mono text-[13.5px] leading-relaxed text-[#e6e8eb]">
                  <code>{q.code}</code>
                </pre>
              )}

              {q.formula && (
                <div className="mt-4 rounded-[7px] border-l-[3px] border-line-strong bg-paper-2 px-4 py-3">
                  <p className="whitespace-pre-line font-display text-[17px] italic leading-relaxed text-ink">
                    {q.formula}
                  </p>
                </div>
              )}

              {/* Options */}
              <div className="mt-5 space-y-2.5">
                {q.options.map((opt, oi) => {
                  const selected = answers[current] === oi;
                  return (
                    <button
                      key={oi}
                      onClick={() => select(current, oi)}
                      className="group flex w-full items-center gap-3.5 rounded-[7px] border p-3 text-left transition-colors sm:p-3.5"
                      style={{
                        borderColor: selected ? theme.brand : "var(--color-line)",
                        background: selected ? theme.tint : "var(--color-paper)",
                      }}
                    >
                      <span
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-[6px] border text-[14px] font-semibold transition-colors"
                        style={{
                          borderColor: selected ? theme.brand : "var(--color-line-strong)",
                          background: selected ? theme.brand : "var(--color-paper)",
                          color: selected ? theme.onBrand : "var(--color-ink-2)",
                        }}
                      >
                        {LETTERS[oi]}
                      </span>
                      <span className="flex-1 whitespace-pre-line text-[15px] leading-relaxed text-ink">
                        {opt}
                      </span>
                      <span
                        className="grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 transition-colors"
                        style={{
                          borderColor: selected ? theme.brand : "var(--color-line-strong)",
                        }}
                      >
                        {selected && (
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ background: theme.brand }}
                          />
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer nav */}
            <div className="mt-6 flex items-center justify-between gap-3">
              <button
                onClick={() => go(current - 1)}
                disabled={current === 0}
                className="inline-flex h-11 items-center gap-1.5 rounded-[7px] border border-line-strong bg-paper px-4 text-[14px] font-medium text-ink transition-colors hover:bg-paper-2 disabled:opacity-40 disabled:hover:bg-paper"
              >
                <ChevronLeft size={17} /> Câu trước
              </button>

              <span className="hidden text-[13px] text-ink-3 sm:block">
                Chọn đáp án bằng phím <kbd className="rounded border border-line bg-paper-2 px-1.5 py-0.5 text-[11px]">A–D</kbd>{" "}
                · chuyển câu bằng <kbd className="rounded border border-line bg-paper-2 px-1.5 py-0.5 text-[11px]">← →</kbd>
              </span>

              {current === total - 1 ? (
                <button
                  onClick={() => setSubmitOpen(true)}
                  className="inline-flex h-11 items-center gap-1.5 rounded-[7px] px-4 text-[14px] font-medium text-white transition-[filter]"
                  style={{ background: theme.brand }}
                >
                  <Send size={16} /> Nộp bài
                </button>
              ) : (
                <button
                  onClick={() => go(current + 1)}
                  className="inline-flex h-11 items-center gap-1.5 rounded-[7px] border border-line-strong bg-paper px-4 text-[14px] font-medium text-ink transition-colors hover:bg-paper-2"
                >
                  Câu sau <ChevronRight size={17} />
                </button>
              )}
            </div>
          </div>
        </main>

        {/* Navigator — desktop */}
        <aside className="hidden w-[336px] flex-none flex-col overflow-y-auto border-l border-line bg-paper lg:flex">
          <Navigator
            questions={questions}
            total={total}
            current={current}
            answers={answers}
            flagged={flagged}
            answeredCount={answeredCount}
            flaggedCount={flaggedCount}
            theme={theme}
            onJump={(i) => go(i)}
            onSubmit={() => setSubmitOpen(true)}
            examCode={examCode}
          />
        </aside>
      </div>

      {/* Mobile bottom bar */}
      <div className="flex flex-none items-center gap-2 border-t border-line bg-paper px-3 py-2.5 lg:hidden">
        <button
          onClick={() => go(current - 1)}
          disabled={current === 0}
          className="grid h-11 w-11 place-items-center rounded-[7px] border border-line-strong text-ink disabled:opacity-40"
          aria-label="Câu trước"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          onClick={() => setNavOpen(true)}
          className="flex h-11 flex-1 items-center justify-center gap-2 rounded-[7px] border border-line-strong bg-paper-2 text-[14px] font-medium text-ink"
        >
          <Grip size={16} /> Câu {current + 1}/{total} · Đã làm {answeredCount}
        </button>
        {current === total - 1 ? (
          <button
            onClick={() => setSubmitOpen(true)}
            className="h-11 rounded-[7px] px-4 text-[14px] font-medium text-white"
            style={{ background: theme.brand }}
          >
            Nộp bài
          </button>
        ) : (
          <button
            onClick={() => go(current + 1)}
            className="grid h-11 w-11 place-items-center rounded-[7px] border border-line-strong text-ink"
            aria-label="Câu sau"
          >
            <ChevronRight size={18} />
          </button>
        )}
      </div>

      {/* Navigator overlay — mobile */}
      {navOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-ink/40 lg:hidden" onClick={() => setNavOpen(false)}>
          <div className="mt-auto max-h-[80%] overflow-y-auto rounded-t-[12px] bg-paper" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <span className="text-[15px] font-semibold">Bảng câu hỏi</span>
              <button onClick={() => setNavOpen(false)} className="grid h-9 w-9 place-items-center rounded-full hover:bg-paper-3">
                <X size={18} />
              </button>
            </div>
            <Navigator
              questions={questions}
              total={total}
              current={current}
              answers={answers}
              flagged={flagged}
              answeredCount={answeredCount}
              flaggedCount={flaggedCount}
              theme={theme}
              onJump={(i) => {
                go(i);
                setNavOpen(false);
              }}
              onSubmit={() => {
                setNavOpen(false);
                setSubmitOpen(true);
              }}
              examCode={examCode}
            />
          </div>
        </div>
      )}

      {submitOpen && (
        <SubmitModal
          total={total}
          answeredCount={answeredCount}
          flaggedCount={flaggedCount}
          timeLeft={timeLeft}
          theme={theme}
          onClose={() => setSubmitOpen(false)}
          onConfirm={finish}
        />
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- Header */

function Clock({
  timeLeft,
  danger,
  variant = "dark",
}: {
  timeLeft: number;
  danger: boolean;
  variant?: "dark" | "light";
}) {
  const light = variant === "light";
  return (
    <div
      className={`flex items-center gap-2 rounded-[7px] px-3 py-1.5 ${
        danger ? "clock-danger" : ""
      }`}
      style={{
        background: danger
          ? "#e5484d"
          : light
            ? "var(--color-paper-2)"
            : "rgba(0,0,0,0.18)",
        border: light && !danger ? "1px solid var(--color-line)" : "none",
        color: danger ? "#fff" : light ? "var(--color-ink)" : "#fff",
      }}
    >
      <Clock3 size={16} className={danger ? "" : "opacity-80"} />
      <span className="tnum text-[19px] font-semibold leading-none tracking-tight">
        {fmt(timeLeft)}
      </span>
    </div>
  );
}

function ExamHeader({
  school,
  subject,
  examCode,
  mssv,
  timeLeft,
  danger,
  onExit,
}: {
  school: School;
  subject: Subject;
  examCode: string;
  mssv: string;
  timeLeft: number;
  danger: boolean;
  onExit: () => void;
}) {
  const { theme } = school;

  const exitBtn = (light: boolean) => (
    <button
      onClick={onExit}
      title="Thoát phòng thi"
      className="grid h-9 w-9 place-items-center rounded-[6px] transition-colors"
      style={{
        color: light ? "var(--color-ink-2)" : "rgba(255,255,255,0.85)",
        background: light ? "transparent" : "rgba(255,255,255,0.08)",
      }}
    >
      <LogOut size={17} />
    </button>
  );

  const subjLabel = (
    <span className="truncate">
      {subject.name}{" "}
      <span className="opacity-70">· {subject.code}</span>
    </span>
  );

  // ---- MOODLE-style: light chrome, brand top border, breadcrumb ----
  if (theme.layout === "moodle") {
    return (
      <header className="flex-none border-b border-line bg-paper">
        <div style={{ height: 4, background: theme.brand }} />
        <div className="flex h-[60px] items-center gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <SchoolMark theme={theme} abbr={school.abbr} size={38} />
            <div className="min-w-0">
              <p className="truncate text-[14px] font-semibold leading-tight">
                {theme.systemName}
              </p>
              <p className="hidden truncate text-[12px] text-ink-3 sm:block">
                {school.abbr} / Học phần / {subject.code} / Đề {examCode}
              </p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-3 sm:gap-5">
            <div className="hidden text-right md:block">
              <p className="text-[13px] font-medium leading-tight">{STUDENT.name}</p>
              <p className="tnum text-[12px] text-ink-3">{mssv}</p>
            </div>
            <div className="text-right">
              <p className="hidden text-[11px] font-medium uppercase tracking-wide text-ink-3 sm:block">
                Thời gian còn lại
              </p>
              <Clock timeLeft={timeLeft} danger={danger} variant="light" />
            </div>
            {exitBtn(true)}
          </div>
        </div>
        <div className="flex items-center gap-3 border-t border-line bg-paper-2 px-4 py-1.5 text-[12.5px] text-ink-2 sm:px-6">
          <span className="truncate font-medium text-ink">{subjLabel}</span>
          <span className="ml-auto hidden shrink-0 sm:inline">Mã đề: <b className="tnum text-ink">{examCode}</b></span>
        </div>
      </header>
    );
  }

  // ---- BANDED: strong color band on top + white info row below ----
  if (theme.layout === "banded") {
    return (
      <header className="flex-none">
        <div
          className="flex h-[44px] items-center px-4 sm:px-6"
          style={{ background: theme.brand, color: theme.onBrand }}
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <SchoolMark theme={theme} abbr={school.abbr} size={26} />
            <span className="truncate text-[14px] font-semibold">{school.name}</span>
          </div>
          <span className="ml-3 hidden rounded-full bg-white/15 px-2.5 py-0.5 text-[11.5px] font-medium sm:inline">
            {theme.systemName}
          </span>
          <div className="ml-auto">
            <Clock timeLeft={timeLeft} danger={danger} variant="dark" />
          </div>
        </div>
        <div className="flex h-[46px] items-center gap-4 border-b border-line bg-paper px-4 text-[13px] sm:px-6">
          <span className="truncate font-semibold text-ink">{subjLabel}</span>
          <span className="hidden shrink-0 text-ink-2 md:inline">
            Mã đề <b className="tnum text-ink">{examCode}</b>
          </span>
          <div className="ml-auto flex items-center gap-4">
            <span className="hidden text-ink-2 sm:inline">
              {STUDENT.name} · <b className="tnum text-ink">{mssv}</b>
            </span>
            {exitBtn(true)}
          </div>
        </div>
      </header>
    );
  }

  // ---- CLASSIC: single solid brand bar (FPT-style EOS) ----
  return (
    <header
      className="flex-none"
      style={{ background: theme.brand, color: theme.onBrand }}
    >
      <div className="flex h-[58px] items-center gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <SchoolMark theme={theme} abbr={school.abbr} size={36} />
          <div className="min-w-0">
            <p className="truncate text-[14px] font-semibold leading-tight">
              {school.name}
            </p>
            <p className="truncate text-[12px] leading-tight opacity-80">
              {theme.systemName}
            </p>
          </div>
        </div>

        <div className="ml-2 hidden min-w-0 border-l border-white/20 pl-4 lg:block">
          <p className="truncate text-[13px] font-medium leading-tight">{subjLabel}</p>
          <p className="text-[12px] leading-tight opacity-80">
            Mã đề: <span className="tnum">{examCode}</span>
          </p>
        </div>

        <div className="ml-auto flex items-center gap-3 sm:gap-5">
          <div className="hidden text-right sm:block">
            <p className="text-[13px] font-medium leading-tight">{STUDENT.name}</p>
            <p className="tnum text-[12px] leading-tight opacity-80">{mssv}</p>
          </div>
          <Clock timeLeft={timeLeft} danger={danger} variant="dark" />
          {exitBtn(false)}
        </div>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------- Navigator */

function Navigator({
  questions,
  total,
  current,
  answers,
  flagged,
  answeredCount,
  flaggedCount,
  theme,
  onJump,
  onSubmit,
  examCode,
}: {
  questions: Question[];
  total: number;
  current: number;
  answers: number[];
  flagged: boolean[];
  answeredCount: number;
  flaggedCount: number;
  theme: School["theme"];
  onJump: (i: number) => void;
  onSubmit: () => void;
  examCode: string;
}) {
  const pct = Math.round((answeredCount / total) * 100);
  const [view, setView] = useState<"list" | "grid">("list");

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-line px-5 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[14px] font-semibold">Bảng câu hỏi</h2>
          <span className="tnum text-[12px] text-ink-3">Mã đề {examCode}</span>
        </div>
        {/* Legend */}
        <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[12px] text-ink-2">
          <LegendItem swatch={<span className="h-3.5 w-3.5 rounded-[4px] border border-line-strong bg-paper" />}>
            Chưa làm
          </LegendItem>
          <LegendItem swatch={<span className="h-3.5 w-3.5 rounded-[4px] border border-green bg-green-soft" />}>
            Đã làm
          </LegendItem>
          <LegendItem swatch={<span className="h-3.5 w-3.5 rounded-[4px] border border-warning bg-warning-soft" />}>
            Đánh dấu
          </LegendItem>
          <LegendItem
            swatch={
              <span
                className="h-3.5 w-3.5 rounded-[4px]"
                style={{ border: `2px solid ${theme.brand}`, background: theme.tint }}
              />
            }
          >
            Câu hiện tại
          </LegendItem>
        </div>

        {/* View toggle: Mục lục (list) / Lưới (grid) */}
        <div className="mt-3 flex gap-1 rounded-[7px] bg-paper-2 p-1">
          <ViewTab active={view === "list"} onClick={() => setView("list")} icon={List}>
            Mục lục
          </ViewTab>
          <ViewTab active={view === "grid"} onClick={() => setView("grid")} icon={LayoutGrid}>
            Lưới
          </ViewTab>
        </div>
      </div>

      {/* Body: Mục lục (list) hoặc Lưới (grid) */}
      {view === "grid" ? (
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: total }).map((_, i) => {
              const isCurrent = i === current;
              const answered = answers[i] >= 0;
              const isFlag = flagged[i];

              let cls =
                "border-line-strong bg-paper text-ink-2 hover:border-ink-3";
              if (isFlag) cls = "border-warning bg-warning-soft text-[#9a6a06]";
              else if (answered) cls = "border-green bg-green-soft text-green";

              return (
                <button
                  key={i}
                  onClick={() => onJump(i)}
                  className={`tnum relative grid h-10 place-items-center rounded-[6px] border text-[14px] font-medium transition-all ${cls}`}
                  style={
                    isCurrent
                      ? {
                          boxShadow: `0 0 0 2px ${theme.brand}`,
                          borderColor: theme.brand,
                        }
                      : undefined
                  }
                >
                  {i + 1}
                  {isFlag && (
                    <span
                      className="absolute right-0.5 top-0.5"
                      style={{ color: "#d99504" }}
                    >
                      <Bookmark size={9} fill="currentColor" strokeWidth={0} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <ul className="flex-1 space-y-1.5 overflow-y-auto px-3 py-3">
          {questions.map((qq, i) => {
            const isCurrent = i === current;
            const answered = answers[i] >= 0;
            const isFlag = flagged[i];

            let badge = "border-line-strong bg-paper text-ink-3";
            if (isFlag) badge = "border-warning bg-warning-soft text-[#9a6a06]";
            else if (answered) badge = "border-green bg-green-soft text-green";

            return (
              <li key={qq.id}>
                <button
                  onClick={() => onJump(i)}
                  className={`flex w-full items-start gap-2.5 rounded-[7px] border px-2.5 py-2 text-left transition-colors ${
                    isCurrent ? "" : "border-line bg-paper hover:bg-paper-2"
                  }`}
                  style={
                    isCurrent
                      ? { borderColor: theme.brand, background: theme.tint }
                      : undefined
                  }
                >
                  <span
                    className={`tnum mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-[5px] border text-[12px] font-semibold ${badge}`}
                  >
                    {i + 1}
                  </span>
                  <span
                    className={`line-clamp-2 flex-1 text-[12.5px] leading-snug ${
                      isCurrent ? "font-medium text-ink" : "text-ink-2"
                    }`}
                  >
                    {qq.prompt}
                  </span>
                  {isFlag ? (
                    <Bookmark
                      size={13}
                      className="mt-0.5 shrink-0"
                      style={{ color: "#d99504" }}
                      fill="currentColor"
                      strokeWidth={0}
                    />
                  ) : answered ? (
                    <span className="mt-0.5 inline-flex h-5 shrink-0 items-center rounded-[4px] bg-green-soft px-1.5 text-[11px] font-semibold text-green">
                      {LETTERS[answers[i]]}
                    </span>
                  ) : (
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full border border-line-strong" aria-hidden />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* Footer: progress + submit */}
      <div className="border-t border-line px-5 py-4">
        <div className="flex items-center justify-between text-[12.5px]">
          <span className="text-ink-2">
            Đã làm <b className="tnum text-ink">{answeredCount}</b>/{total}
          </span>
          {flaggedCount > 0 && (
            <span className="text-ink-2">
              Đánh dấu <b className="tnum text-[#9a6a06]">{flaggedCount}</b>
            </span>
          )}
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-paper-3">
          <div
            className="h-full rounded-full bg-green transition-[width] duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
        <button
          onClick={onSubmit}
          className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-[7px] text-[15px] font-medium text-white transition-[filter] hover:brightness-105"
          style={{ background: theme.brand }}
        >
          <Send size={16} /> Nộp bài
        </button>
      </div>
    </div>
  );
}

function LegendItem({
  swatch,
  children,
}: {
  swatch: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <span className="flex items-center gap-1.5">
      {swatch}
      {children}
    </span>
  );
}

function ViewTab({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof List;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-[5px] text-[12.5px] font-medium transition-colors ${
        active
          ? "bg-paper text-ink shadow-[var(--shadow-1)]"
          : "text-ink-3 hover:text-ink-2"
      }`}
    >
      <Icon size={14} />
      {children}
    </button>
  );
}

/* ----------------------------------------------------------- Submit modal */

function SubmitModal({
  total,
  answeredCount,
  flaggedCount,
  timeLeft,
  theme,
  onClose,
  onConfirm,
}: {
  total: number;
  answeredCount: number;
  flaggedCount: number;
  timeLeft: number;
  theme: School["theme"];
  onClose: () => void;
  onConfirm: () => void;
}) {
  const unanswered = total - answeredCount;
  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-center bg-ink/45 p-4 animate-fadein"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-[10px] bg-paper shadow-[var(--shadow-pop)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-[17px] font-semibold">Xác nhận nộp bài</h2>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full text-ink-3 hover:bg-paper-3">
            <X size={17} />
          </button>
        </div>

        <div className="px-5 py-5">
          <div className="grid grid-cols-3 divide-x divide-line rounded-[8px] border border-line">
            <Stat label="Tổng câu" value={total} />
            <Stat label="Đã làm" value={answeredCount} tone="green" />
            <Stat label="Chưa làm" value={unanswered} tone={unanswered > 0 ? "danger" : "muted"} />
          </div>

          {unanswered > 0 ? (
            <div className="mt-4 flex items-start gap-2.5 rounded-[7px] border border-warning bg-warning-soft px-3.5 py-3 text-[13.5px] text-[#7a5304]">
              <AlertTriangle size={17} className="mt-0.5 shrink-0" />
              <p>
                Bạn còn <b className="tnum">{unanswered} câu chưa làm</b>
                {flaggedCount > 0 && (
                  <>
                    {" "}và <b className="tnum">{flaggedCount} câu đã đánh dấu</b> xem lại
                  </>
                )}
                . Sau khi nộp, bạn không thể chỉnh sửa bài làm.
              </p>
            </div>
          ) : (
            <p className="mt-4 text-[13.5px] text-ink-2">
              Bạn đã hoàn thành tất cả các câu hỏi. Sau khi nộp, bài làm sẽ được
              chấm và không thể chỉnh sửa.
            </p>
          )}

          <p className="mt-4 flex items-center gap-2 text-[13px] text-ink-3">
            <Clock3 size={15} /> Thời gian còn lại:{" "}
            <span className="tnum font-medium text-ink">{fmt(timeLeft)}</span>
          </p>
        </div>

        <div className="flex gap-3 border-t border-line bg-paper-2 px-5 py-4">
          <button
            onClick={onClose}
            className="h-11 flex-1 rounded-[7px] border border-line-strong bg-paper text-[15px] font-medium text-ink transition-colors hover:bg-paper-3"
          >
            Tiếp tục làm bài
          </button>
          <button
            onClick={onConfirm}
            className="h-11 flex-1 rounded-[7px] text-[15px] font-medium text-white transition-[filter] hover:brightness-105"
            style={{ background: theme.brand }}
          >
            Nộp bài
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "green" | "danger" | "muted";
}) {
  const color =
    tone === "green"
      ? "var(--color-green)"
      : tone === "danger"
        ? "var(--color-danger)"
        : tone === "muted"
          ? "var(--color-ink-3)"
          : "var(--color-ink)";
  return (
    <div className="px-3 py-3 text-center">
      <p className="tnum text-[24px] font-semibold leading-none" style={{ color }}>
        {value}
      </p>
      <p className="mt-1 text-[12px] text-ink-2">{label}</p>
    </div>
  );
}
