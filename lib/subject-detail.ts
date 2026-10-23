import { difficultyLabel, type ExamSummary } from "./catalog";
import { examHref } from "./dashboard-helpers";

/** "Kỳ 1, 2" from term numbers; "" when there are none. */
export function termsLabel(terms: readonly number[] | null | undefined): string {
  const list = [...new Set((terms ?? []).filter((t) => Number.isFinite(t)))].sort((a, b) => a - b);
  return list.length ? `Kỳ ${list.join(", ")}` : "";
}

/** Link that opens one exact exam in the exam room. */
export function examStartHref(schoolCode: string, subjectCode: string, examId: string): string {
  return `${examHref(schoolCode, subjectCode)}?exam=${encodeURIComponent(examId)}`;
}

export interface ExamRowView {
  id: string;
  index: number;
  title: string;
  questionCount: number;
  durationMinutes: number;
  /** null hides the chip */
  difficulty: string | null;
  bestScore: number | null;
  attemptCount: number;
  /** "Đã làm N lần" or "" when never attempted */
  attemptsLabel: string;
}

/** Tolerates responses from an older backend that lack the newer fields. */
export function examRow(exam: Partial<ExamSummary> & Pick<ExamSummary, "id" | "title" | "durationMinutes" | "questionCount">, position: number): ExamRowView {
  const attemptCount = Number.isFinite(exam.attemptCount) ? Math.max(0, exam.attemptCount as number) : 0;
  return {
    id: exam.id,
    index: position + 1,
    title: exam.title,
    questionCount: exam.questionCount,
    durationMinutes: exam.durationMinutes,
    difficulty: difficultyLabel(exam.difficulty),
    bestScore: typeof exam.bestScore === "number" ? exam.bestScore : null,
    attemptCount,
    attemptsLabel: attemptCount > 0 ? `Đã làm ${attemptCount} lần` : "",
  };
}
