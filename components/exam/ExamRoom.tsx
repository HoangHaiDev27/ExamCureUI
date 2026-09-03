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
  Check,
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
  const [isLocked, setIsLocked] = useState(false);
  const [finishChecked, setFinishChecked] = useState(false);
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
    
    if (school.id === "fptu") {
      setIsLocked(true);
    } else {
      router.push(`/exam/${school.id}/${subject.id}/result`);
    }
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
    if (timeLeft === 0) {
      setTimeout(() => {
        finish();
      }, 0);
    }
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
      if (e.key === "ArrowLeft" || e.key === "PageUp") go(current - 1);
      else if (e.key === "ArrowRight" || e.key === "PageDown") go(current + 1);
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

  if (isLocked) {
    return (
      <div className="flex h-[100dvh] flex-col items-center justify-center bg-[#2b3542] text-white p-6 font-mono">
        <div className="w-full max-w-md rounded-lg border-2 border-slate-700 bg-[#1e2530] p-6 shadow-2xl text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green/10 text-green mb-4 border border-green">
            <Check size={28} strokeWidth={3} />
          </div>
          <h1 className="text-xl font-bold text-[#25a26a] tracking-wider uppercase">Finish successfully!</h1>
          <div className="my-5 border-y border-slate-700 py-4 text-left space-y-2 text-slate-300 text-sm font-sans">
            <p><strong>Thí sinh:</strong> {STUDENT.name}</p>
            <p><strong>MSSV:</strong> {mssv}</p>
            <p><strong>Học phần:</strong> {subject.name} ({subject.code})</p>
            <p><strong>Số câu đã trả lời:</strong> {answeredCount}/{total}</p>
            <p><strong>Mã đề thi:</strong> {examCode}</p>
          </div>
          <p className="text-xs text-slate-400 mb-6 font-sans leading-relaxed">
            Bài thi của bạn đã được nộp thành công trên hệ thống EOS. Vui lòng giữ nguyên màn hình và báo cho giám thị phòng thi.
          </p>
          <button
            onClick={() => {
              router.push(`/exam/${school.id}/${subject.id}/result`);
            }}
            className="w-full h-11 rounded-md bg-[#d85f18] text-[14px] font-bold uppercase tracking-wider text-white transition-all hover:bg-orange-dark shadow-md"
          >
            Exit
          </button>
        </div>
      </div>
    );
  }

  if (school.id === "fptu") {
    return (
      <div className="flex h-[100dvh] flex-col overflow-hidden bg-[#f0f0f0] text-black font-sans select-none p-2 border border-slate-350">
        
        {/* TOP EOS HEADER */}
        <div className="flex flex-none items-start justify-between bg-[#f0f0f0] p-3 border border-slate-300 rounded shadow-sm gap-4 mb-2">
          {/* Info grid (Left column) */}
          <div className="grid grid-cols-3 gap-x-8 gap-y-1.5 text-[12.5px] leading-tight text-slate-800 font-mono">
            <div>
              <span className="text-slate-500">Machine:</span> <span className="font-semibold text-slate-900">DESKTOP-G3FCS4L</span>
            </div>
            <div>
              <span className="text-slate-500">Duration:</span> <span className="font-semibold text-slate-900">{subject.durationMin} minutes</span>
            </div>
            <div>
              <span className="text-slate-500">Q mark:</span> <span className="font-bold text-[#0000ff]">1</span>
            </div>

            <div>
              <span className="text-slate-500">Student:</span> <span className="font-bold text-[#0000ff]">{mssv}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-slate-500">Open Code:</span> 
              <input type="text" disabled className="w-14 h-4.5 border border-slate-300 bg-slate-100 rounded px-1 text-[10px]" />
              <button disabled className="h-4.5 border border-slate-400 bg-slate-200 text-slate-400 px-1 text-[10px] rounded">Show Question</button>
            </div>
            <div>
              <span className="text-slate-500">Total Marks:</span> <span className="font-bold text-[#0000ff]">{total}</span>
            </div>

            <div>
              <span className="text-slate-500">Server:</span> <span className="font-semibold text-slate-900">Eng_EOS_14032</span>
            </div>
            <div>
              <span className="text-slate-500">Exam Code:</span> <span className="font-bold text-[#0000ff]">{examCode}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px]">
              <span className="text-slate-500">Vol:</span> 
              <select disabled className="border border-slate-300 bg-white h-4.5 text-[9px] rounded px-0.5"><option>8</option></select>
              <span className="text-slate-500">Font:</span> 
              <select disabled className="border border-slate-300 bg-white h-4.5 text-[9px] rounded px-0.5"><option>Microsoft Sans Serif</option></select>
              <span className="text-slate-500">Size:</span> 
              <select disabled className="border border-slate-300 bg-white h-4.5 text-[9px] rounded px-0.5"><option>10</option></select>
            </div>
          </div>

          {/* TIMER IN THE MIDDLE */}
          <div className="flex items-center gap-3.5 bg-white border border-slate-300 rounded px-6 py-1.5 shadow-inner">
            <span className="text-[13px] font-bold text-slate-500 font-mono">Time Left:</span>
            <span className="text-[40px] font-bold leading-none text-[#0000ff] font-mono tracking-tight min-w-[110px] text-center">
              {fmt(timeLeft)}
            </span>
            {/* Vietnam Flag */}
            <div className="relative w-[60px] h-[36px] bg-[#da251d] flex items-center justify-center border border-[#a01a14] rounded shadow-sm">
              <svg className="w-5 h-5 text-[#ffff00] fill-current" viewBox="0 0 24 24">
                <path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.787 1.4 8.168L12 18.896l-7.334 3.857 1.4-8.168L.132 9.21l8.2-1.192z"/>
              </svg>
            </div>
          </div>

          {/* FINISH CHECKBOX & BUTTON (TOP RIGHT) */}
          <div className="flex flex-col items-end justify-center bg-white/40 border border-slate-300 rounded p-2.5 gap-2 min-w-[180px]">
            <label className="flex items-center gap-1.5 text-[12px] font-medium text-slate-700 cursor-pointer">
              <input 
                type="checkbox" 
                checked={finishChecked} 
                onChange={(e) => setFinishChecked(e.target.checked)}
                className="w-4 h-4 rounded text-orange focus:ring-orange cursor-pointer border-slate-300"
              />
              <span className="font-mono">I want to finish the exam.</span>
            </label>
            <button
              onClick={() => {
                if (finishChecked) setSubmitOpen(true);
              }}
              className={`h-7 w-20 border text-[11px] font-bold uppercase rounded shadow transition-all ${
                finishChecked 
                  ? "bg-[#ffff99] hover:bg-[#ffff66] text-black border-slate-400 active:scale-95 cursor-pointer" 
                  : "bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed"
              }`}
            >
              Finish
            </button>
          </div>
        </div>

        {/* TAB STRIP */}
        <div className="flex flex-none items-end border-b border-slate-300 px-2 mt-1">
          <div className="bg-white border-x border-t border-slate-300 rounded-t px-4 py-1.5 text-[12.5px] font-bold text-slate-800 shadow-sm relative -bottom-px font-mono">
            Multiple Choices
          </div>
        </div>

        {/* MAIN CONTAINER */}
        <div className="flex-1 min-h-0 flex bg-white border border-slate-300 rounded-b shadow-inner p-3 gap-3">
          
          {/* Question selection box */}
          <div className="w-[140px] flex-none flex flex-col border border-slate-300 rounded bg-[#fcfcfc] p-3 shadow-sm">
            <span className="text-[12.5px] font-bold text-[#0000ff] uppercase tracking-wider mb-3 font-mono">Answer</span>
            
            {/* Options Checkboxes */}
            <div className="flex-1 space-y-3.5">
              {q.options.map((_, oi) => {
                const selected = answers[current] === oi;
                return (
                  <button
                    key={oi}
                    onClick={() => select(current, oi)}
                    className="flex items-center gap-3 w-full text-left py-1 hover:bg-slate-50 rounded px-1 cursor-pointer transition-colors group"
                  >
                    <span className={`w-4.5 h-4.5 border rounded flex items-center justify-center transition-all ${
                      selected 
                        ? "border-[#0000ff] bg-[#0000ff]/10 text-[#0000ff]" 
                        : "border-slate-400 bg-white group-hover:border-slate-500"
                    }`}>
                      {selected && <div className="w-2.5 h-2.5 bg-[#0000ff] rounded-[1px]" />}
                    </span>
                    <span className="text-[13px] font-bold text-slate-700 font-mono">{LETTERS[oi]}</span>
                  </button>
                );
              })}
            </div>

            {/* Next Button */}
            <button
              onClick={() => go(current + 1)}
              disabled={current === total - 1}
              className="mt-auto h-8 w-full border border-slate-400 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[12px] font-bold rounded shadow transition-all active:scale-[0.98] disabled:opacity-40 disabled:hover:bg-slate-100 disabled:active:scale-100 font-mono"
            >
              Next
            </button>
          </div>

          {/* Question prompt and details */}
          <div className="flex-1 flex flex-col border border-slate-300 rounded bg-white p-5 shadow-sm overflow-y-auto">
            <span className="text-[13.5px] font-bold text-slate-700 border-b border-slate-150 pb-2 mb-3 font-mono">
              Multiple choices {current + 1}/{total}
            </span>
            <p className="text-[12px] italic text-slate-400 mb-2 font-mono">(Choose 1 answer)</p>
            
            {/* Prompt text */}
            <p className="text-[15.5px] font-medium leading-relaxed text-slate-800 mb-4 whitespace-pre-wrap font-sans">
              {q.prompt}
            </p>

            {q.code && (
              <pre className="mb-4 overflow-x-auto rounded border border-slate-200 bg-[#f8f9fa] p-3 font-mono text-[12.5px] leading-relaxed text-slate-700">
                <code>{q.code}</code>
              </pre>
            )}

            {/* Listed options text */}
            <div className="space-y-2.5 border-t border-slate-100 pt-4 mt-2 font-sans">
              {q.options.map((opt, oi) => (
                <div key={oi} className="text-[14.5px] text-slate-700 leading-relaxed pl-1 flex items-start gap-1">
                  <span className="font-bold text-slate-900 shrink-0 font-mono">{LETTERS[oi]}.</span>
                  <span className="whitespace-pre-wrap">{opt}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* BOTTOM QUESTION GRID BAR */}
        <div className="flex flex-none items-center justify-between bg-[#f0f0f0] p-3 border border-slate-300 rounded shadow-sm gap-4 mt-2">
          {/* Numbers list 1 -> 24 */}
          <div className="flex flex-wrap items-center gap-1 max-w-[80%]">
            {Array.from({ length: total }).map((_, i) => {
              const isCurrent = i === current;
              const answered = answers[i] >= 0;
              return (
                <button
                  key={i}
                  onClick={() => go(i)}
                  className={`tnum w-7.5 h-7.5 border flex items-center justify-center text-[12.5px] font-bold font-mono rounded cursor-pointer transition-all ${
                    isCurrent
                      ? "border-[#0000ff] bg-[#0000ff]/10 text-[#0000ff] ring-2 ring-[#0000ff]/20 font-black scale-105"
                      : answered
                        ? "border-[#1e6b43] bg-[#22c55e] text-white hover:opacity-90"
                        : "border-slate-300 bg-[#e0e0e0] text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>

          {/* FINISH CHECKBOX & BUTTON (BOTTOM RIGHT) */}
          <div className="flex items-center gap-3.5 bg-white/40 border border-slate-300 rounded px-3 py-1.5">
            <label className="flex items-center gap-1.5 text-[12px] font-medium text-slate-700 cursor-pointer font-mono">
              <input 
                type="checkbox" 
                checked={finishChecked} 
                onChange={(e) => setFinishChecked(e.target.checked)}
                className="w-4 h-4 rounded text-orange focus:ring-orange cursor-pointer border-slate-300"
              />
              <span>I want to finish the exam.</span>
            </label>
            <button
              onClick={() => {
                if (finishChecked) setSubmitOpen(true);
              }}
              className={`h-7 w-20 border text-[11px] font-bold uppercase rounded shadow transition-all ${
                finishChecked 
                  ? "bg-[#ffff99] hover:bg-[#ffff66] text-black border-slate-400 active:scale-95 cursor-pointer" 
                  : "bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed"
              }`}
            >
              Finish
            </button>
          </div>
        </div>

        {submitOpen && (
          <SubmitModal
            total={total}
            answeredCount={answeredCount}
            flaggedCount={flaggedCount}
            timeLeft={timeLeft}
            theme={theme}
            onClose={() => setSubmitOpen(false)}
            onConfirm={finish}
            schoolId={school.id}
          />
        )}
      </div>
    );
  }

  return (
    <div className={`flex h-[100dvh] flex-col overflow-hidden text-ink ${school.id === "fptu" ? "bg-[#f0f2f5]" : "bg-paper-2"}`}>
      <ExamHeader
        school={school}
        subject={subject}
        examCode={examCode}
        mssv={mssv}
        timeLeft={timeLeft}
        danger={danger}
        onExit={() => {
          if (confirm("Thoát khỏi phòng thi? Bài làm hiện tại sẽ không được lưu."))
            router.push("/dashboard");
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
                  className="inline-flex h-11 items-center gap-1.5 rounded-[7px] px-4 text-[14px] font-medium text-white transition-[filter] hover:brightness-105"
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
            schoolId={school.id}
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
              schoolId={school.id}
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
          schoolId={school.id}
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

  // ---- FPTU EOS CUSTOM HEADER ----
  if (school.id === "fptu") {
    return (
      <header className="flex-none bg-[#2b3542] text-white border-b border-[#1a222d] shadow-md font-sans">
        <div className="flex h-[64px] items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center rounded bg-orange px-2.5 py-1 text-[13px] font-bold tracking-wider text-white">
              EOS CLIENT
            </div>
            <div className="hidden border-l border-white/20 pl-4 lg:block">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-medium">Học phần</span>
              <span className="text-[13.5px] font-semibold block text-slate-100">{subject.name} ({subject.code})</span>
            </div>
            <div className="hidden border-l border-white/20 pl-4 sm:block">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-medium">Mã đề</span>
              <span className="tnum text-[13.5px] font-mono font-bold text-orange block">{examCode}</span>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <div className="border-r border-white/20 pr-4 text-right hidden md:block">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-medium">Thí sinh</span>
              <span className="text-[13.5px] font-semibold block text-slate-100">{STUDENT.name} ({mssv})</span>
            </div>
            <div className="text-right">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-medium">Thời gian còn lại</span>
              <Clock timeLeft={timeLeft} danger={danger} variant="dark" />
            </div>
            {exitBtn(false)}
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
  schoolId,
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
  schoolId: string;
}) {
  const pct = Math.round((answeredCount / total) * 100);
  const [view, setView] = useState<"list" | "grid">("list");

  if (schoolId === "fptu") {
    return (
      <div className="flex h-full flex-col bg-[#f8f9fa] border-l border-slate-200 font-sans">
        <div className="border-b border-slate-200 bg-white px-5 py-4">
          <h2 className="text-[13.5px] font-bold text-slate-700 uppercase tracking-wider">Answer Sheet</h2>
          <div className="mt-2 flex items-center justify-between text-[12px] text-slate-500 font-mono">
            <span>Mã đề: <b className="text-orange">{examCode}</b></span>
            <span>Đã làm: <b className="text-slate-800">{answeredCount}/{total}</b></span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-[#25a26a] transition-[width] duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: total }).map((_, i) => {
              const isCurrent = i === current;
              const ansIndex = answers[i];
              const answered = ansIndex >= 0;
              const label = answered ? LETTERS[ansIndex] : "--";

              return (
                <button
                  key={i}
                  onClick={() => onJump(i)}
                  className={`flex items-center justify-between rounded-md border px-3 py-2 text-[13px] font-medium transition-all ${
                    isCurrent
                      ? "border-orange bg-orange/5 text-orange-dark shadow-sm ring-1 ring-orange"
                      : answered
                        ? "border-[#cce8db] bg-[#eefcf6] text-[#1b6b3a]"
                        : "border-slate-200 bg-white text-slate-400 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <span className="font-mono font-semibold">Q{(i + 1).toString().padStart(2, "0")}</span>
                  <span className={`w-6 h-6 rounded flex items-center justify-center font-bold font-mono text-[13px] ${
                    isCurrent
                      ? "bg-orange text-white"
                      : answered
                        ? "bg-[#25a26a] text-white"
                        : "bg-slate-100 text-slate-400"
                  }`}>
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-t border-slate-200 bg-white px-5 py-4">
          <button
            onClick={onSubmit}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#d85f18] text-[14px] font-bold uppercase tracking-wider text-white transition-all hover:bg-orange-dark shadow-md"
          >
            I want to finish the exam
          </button>
        </div>
      </div>
    );
  }

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
  schoolId,
}: {
  total: number;
  answeredCount: number;
  flaggedCount: number;
  timeLeft: number;
  theme: School["theme"];
  onClose: () => void;
  onConfirm: () => void;
  schoolId?: string;
}) {
  const unanswered = total - answeredCount;
  const isFPTU = schoolId === "fptu";

  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-center bg-ink/45 p-4 animate-fadein"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-[10px] bg-paper shadow-[var(--shadow-pop)] font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-[15px] font-bold text-slate-800 uppercase tracking-wider">
            {isFPTU ? "Confirm Finish Exam" : "Xác nhận nộp bài"}
          </h2>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full text-ink-3 hover:bg-paper-3">
            <X size={17} />
          </button>
        </div>

        <div className="px-5 py-5">
          <div className="grid grid-cols-3 divide-x divide-line rounded-[8px] border border-line">
            <Stat label={isFPTU ? "Total Q" : "Tổng câu"} value={total} />
            <Stat label={isFPTU ? "Answered" : "Đã làm"} value={answeredCount} tone="green" />
            <Stat label={isFPTU ? "Unanswered" : "Chưa làm"} value={unanswered} tone={unanswered > 0 ? "danger" : "muted"} />
          </div>

          {unanswered > 0 ? (
            <div className="mt-4 flex items-start gap-2.5 rounded-[7px] border border-warning bg-warning-soft px-3.5 py-3 text-[13.5px] text-[#7a5304]">
              <AlertTriangle size={17} className="mt-0.5 shrink-0" />
              <div className="font-sans leading-relaxed">
                {isFPTU ? (
                  <p>
                    You have <b className="tnum">{unanswered} unanswered question(s)</b>. 
                    Are you sure you want to finish the exam? Once submitted, you cannot change your answers.
                  </p>
                ) : (
                  <p>
                    Bạn còn <b className="tnum">{unanswered} câu chưa làm</b>
                    {flaggedCount > 0 && (
                      <>
                        {" "}và <b className="tnum">{flaggedCount} câu đã đánh dấu</b> xem lại
                      </>
                    )}
                    . Sau khi nộp, bạn không thể chỉnh sửa bài làm.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p className="mt-4 text-[13.5px] text-ink-2 font-sans leading-relaxed">
              {isFPTU ? (
                "You have answered all questions. Are you sure you want to finish the exam? Once submitted, you cannot change your answers."
              ) : (
                "Bạn đã hoàn thành tất cả các câu hỏi. Sau khi nộp, bài làm sẽ được chấm và không thể chỉnh sửa."
              )}
            </p>
          )}

          <p className="mt-4 flex items-center gap-2 text-[13px] text-ink-3 font-sans">
            <Clock3 size={15} /> {isFPTU ? "Time remaining:" : "Thời gian còn lại:"}{" "}
            <span className="tnum font-medium text-ink">{fmt(timeLeft)}</span>
          </p>
        </div>

        <div className="flex gap-3 border-t border-line bg-paper-2 px-5 py-4">
          <button
            onClick={onClose}
            className="h-11 flex-1 rounded-[7px] border border-line-strong bg-paper text-[13.5px] font-bold text-slate-700 uppercase tracking-wider transition-colors hover:bg-paper-3"
          >
            {isFPTU ? "Cancel" : "Tiếp tục làm bài"}
          </button>
          <button
            onClick={onConfirm}
            className="h-11 flex-1 rounded-[7px] text-[13.5px] font-bold text-white uppercase tracking-wider transition-[filter] hover:brightness-105"
            style={{ background: isFPTU ? "#d85f18" : theme.brand }}
          >
            {isFPTU ? "Submit" : "Nộp bài"}
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
