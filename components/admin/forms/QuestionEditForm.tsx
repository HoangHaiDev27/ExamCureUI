"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import type { AdminQuestion } from "@/lib/admin";
import { Button, INPUT, RADIO, TEXTAREA } from "../ui";

export interface QuestionEditValues {
  prompt: string;
  explanation: string;
  options: Array<{ position: number; content: string; isCorrect: boolean }>;
}

const letter = (position: number) => String.fromCharCode(65 + position);

export function QuestionEditForm({
  question,
  index,
  onCancel,
  onSave,
}: {
  question: AdminQuestion;
  index: number;
  onCancel: () => void;
  /** Resolves true when saved (the parent then closes the form). */
  onSave: (values: QuestionEditValues) => Promise<boolean> | boolean;
}) {
  const uid = useId();
  const sorted = [...question.options].sort((a, b) => a.position - b.position);
  const [prompt, setPrompt] = useState(question.prompt);
  const [explanation, setExplanation] = useState(question.explanation);
  const [contents, setContents] = useState(() => [0, 1, 2, 3].map((p) => sorted.find((o) => o.position === p)?.content ?? ""));
  const [correct, setCorrect] = useState(() => sorted.find((o) => o.is_correct)?.position ?? 0);
  const [errors, setErrors] = useState<{ prompt?: string; options?: string; explanation?: string }>({});
  const [busy, setBusy] = useState(false);
  const firstRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    firstRef.current?.focus({ preventScroll: true });
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    const p = prompt.trim();
    const e = explanation.trim();
    const trimmed = contents.map((c) => c.trim());
    const missing = trimmed.findIndex((c) => !c);
    const next = {
      ...(p ? {} : { prompt: "Nhập nội dung câu hỏi" }),
      ...(missing >= 0 ? { options: `Nhập nội dung đáp án ${letter(missing)}` } : {}),
      ...(e ? {} : { explanation: "Nhập lời giải để sinh viên hiểu vì sao đúng" }),
    };
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    try {
      await onSave({
        prompt: p,
        explanation: e,
        options: trimmed.map((content, position) => ({ position, content, isCorrect: position === correct })),
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={(event) => void submit(event)} className="flex flex-col gap-5" noValidate>
      <p className="text-xs font-medium text-ink-3">Sửa câu {index + 1}</p>
      <div>
        <label htmlFor={`${uid}-prompt`} className="block text-sm font-medium">Câu hỏi</label>
        <textarea
          ref={firstRef}
          id={`${uid}-prompt`}
          rows={3}
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          aria-invalid={errors.prompt ? true : undefined}
          aria-describedby={errors.prompt ? `${uid}-prompt-err` : undefined}
          className={`${TEXTAREA} mt-2`}
        />
        {errors.prompt && <p id={`${uid}-prompt-err`} className="mt-1.5 text-sm text-red-600">{errors.prompt}</p>}
      </div>
      <fieldset aria-describedby={errors.options ? `${uid}-opt-err` : undefined}>
        <legend className="text-sm font-medium">Đáp án</legend>
        <p className="mt-1 text-sm text-ink-3">Chọn ô tròn ở đáp án đúng.</p>
        <div className="mt-3 flex flex-col gap-2">
          {[0, 1, 2, 3].map((position) => (
            <div key={position} className="flex items-center gap-3">
              <input
                type="radio"
                name={`${uid}-correct`}
                checked={correct === position}
                onChange={() => setCorrect(position)}
                aria-label={`Đáp án ${letter(position)} là đáp án đúng`}
                className={RADIO}
              />
              <span className="w-4 shrink-0 text-sm font-medium text-ink-3">{letter(position)}</span>
              <input
                value={contents[position]}
                onChange={(event) => setContents((list) => list.map((c, i) => (i === position ? event.target.value : c)))}
                aria-label={`Nội dung đáp án ${letter(position)}`}
                className={INPUT}
              />
            </div>
          ))}
        </div>
        {errors.options && <p id={`${uid}-opt-err`} className="mt-1.5 text-sm text-red-600">{errors.options}</p>}
      </fieldset>
      <div>
        <label htmlFor={`${uid}-exp`} className="block text-sm font-medium">Giải thích</label>
        <textarea
          id={`${uid}-exp`}
          rows={2}
          value={explanation}
          onChange={(event) => setExplanation(event.target.value)}
          aria-invalid={errors.explanation ? true : undefined}
          aria-describedby={errors.explanation ? `${uid}-exp-err` : undefined}
          className={`${TEXTAREA} mt-2`}
        />
        {errors.explanation && <p id={`${uid}-exp-err`} className="mt-1.5 text-sm text-red-600">{errors.explanation}</p>}
      </div>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onCancel} className="min-h-11 md:min-h-10">Huỷ</Button>
        <Button variant="primary" type="submit" busy={busy} className="min-h-11 md:min-h-10">Lưu câu hỏi</Button>
      </div>
    </form>
  );
}
