/**
 * Unsubmitted exam answers kept in sessionStorage so a remount, reload or
 * transient auth failure never loses the student's work. This is a draft only:
 * grading and results stay on the server.
 */
export interface ExamDraft {
  answers: number[];
  flagged: boolean[];
  /** Epoch ms when the student started this exam session. */
  startedAt: number;
  /** Idempotency key sent with every submit/retry of this session. */
  clientAttemptId: string;
}

export const draftKey = (userId: string, examId: string) =>
  `examcure:exam-draft:${userId}:${examId}`;

export function newDraft(total: number, now: number, clientAttemptId: string): ExamDraft {
  return {
    answers: Array(total).fill(-1),
    flagged: Array(total).fill(false),
    startedAt: now,
    clientAttemptId,
  };
}

/** Parses a stored draft; returns null unless it matches the exam's question count. */
export function parseDraft(raw: string | null, total: number): ExamDraft | null {
  if (!raw) return null;
  try {
    const d = JSON.parse(raw) as Partial<ExamDraft>;
    if (
      !Array.isArray(d.answers) ||
      !Array.isArray(d.flagged) ||
      d.answers.length !== total ||
      d.flagged.length !== total ||
      !d.answers.every((a) => Number.isInteger(a) && a >= -1 && a <= 3) ||
      typeof d.startedAt !== "number" ||
      !Number.isFinite(d.startedAt) ||
      typeof d.clientAttemptId !== "string" ||
      !d.clientAttemptId
    )
      return null;
    return {
      answers: d.answers as number[],
      flagged: d.flagged.map(Boolean),
      startedAt: d.startedAt,
      clientAttemptId: d.clientAttemptId,
    };
  } catch {
    return null;
  }
}

/** Seconds left; 0 when the time is already up. A start in the future counts as just started. */
export function remainingSec(startedAt: number, durationSec: number, now: number): number {
  const elapsed = Math.max(0, Math.floor((now - startedAt) / 1000));
  return Math.max(0, durationSec - elapsed);
}

type Store = Pick<Storage, "getItem" | "setItem" | "removeItem">;
const defaultStore = (): Store | null => {
  try {
    return typeof sessionStorage === "undefined" ? null : sessionStorage;
  } catch {
    return null;
  }
};

export function loadDraft(userId: string, examId: string, total: number, store: Store | null = defaultStore()): ExamDraft | null {
  try {
    return parseDraft(store?.getItem(draftKey(userId, examId)) ?? null, total);
  } catch {
    return null;
  }
}

export function saveDraft(userId: string, examId: string, draft: ExamDraft, store: Store | null = defaultStore()): void {
  try {
    store?.setItem(draftKey(userId, examId), JSON.stringify(draft));
  } catch {
    /* storage unavailable or full — the in-memory state is still authoritative */
  }
}

export function clearDraft(userId: string, examId: string, store: Store | null = defaultStore()): void {
  try {
    store?.removeItem(draftKey(userId, examId));
  } catch {
    /* ignore */
  }
}
