import type {
  AttemptReviewQuestion,
  ExamDetail,
  SubmitAttemptInput,
} from "./catalog";

export interface RoomQuestion {
  id: string;
  prompt: string;
  options: string[];
  code?: string;
  formula?: string;
}

/** Room questions plus, per question, the real option position of each rendered option. */
export function toRoomQuestions(exam: Pick<ExamDetail, "questions">): {
  questions: RoomQuestion[];
  positions: number[][];
} {
  const questions: RoomQuestion[] = [];
  const positions: number[][] = [];
  for (const q of exam.questions) {
    const sorted = [...q.options].sort((a, b) => a.position - b.position);
    questions.push({ id: q.id, prompt: q.prompt, options: sorted.map((o) => o.content) });
    positions.push(sorted.map((o) => o.position));
  }
  return { questions, positions };
}

/** `answers[i]` is the chosen option index (-1 = blank); it is translated to the real position. */
export function buildSubmitPayload(
  questions: Pick<RoomQuestion, "id">[],
  positions: number[][],
  answers: number[],
  spentSec: number,
): SubmitAttemptInput {
  return {
    answers: questions.map((q, i) => {
      const index = answers[i] ?? -1;
      return {
        questionId: q.id,
        selectedPosition: index >= 0 ? (positions[i]?.[index] ?? null) : null,
      };
    }),
    spentSec: Math.max(0, Math.floor(spentSec)),
  };
}

export function summarizeAttempt(
  questions: Pick<AttemptReviewQuestion, "isCorrect" | "selectedPosition">[],
) {
  let correct = 0,
    wrong = 0,
    blank = 0;
  for (const q of questions) {
    if (q.selectedPosition === null) blank++;
    else if (q.isCorrect) correct++;
    else wrong++;
  }
  const answered = correct + wrong;
  return {
    correct,
    wrong,
    blank,
    total: questions.length,
    accuracy: answered ? Math.round((correct / answered) * 100) : 0,
  };
}

/** Index of the option with the given position, or -1. */
export function optionIndex(options: { position: number }[], position: number | null): number {
  return position === null ? -1 : options.findIndex((o) => o.position === position);
}

export { materialRouteSubject } from "./route-ids";
