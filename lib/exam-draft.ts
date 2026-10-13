/**
 * Unsubmitted exam answers kept in sessionStorage so a remount, reload or
 * transient auth failure never loses the student's work. Draft only:
 * grading and results stay on the server. Answers are keyed by question id.
 */
export interface StoredDraft {
  /** questionId -> selected option position (null = blank). */
  answers: Record<string, number | null>;
  /** Flagged question ids. */
  flagged: string[];
  startedAt: number;
  clientAttemptId: string;
}

export const draftKey = (userId: string, examId: string) =>
  `examcure:exam-draft:${userId}:${examId}`;

export function newStored(now: number, clientAttemptId: string): StoredDraft {
  return { answers: {}, flagged: [], startedAt: now, clientAttemptId };
}

export function parseDraft(raw: string | null): StoredDraft | null {
  if (!raw) return null;
  try {
    const d = JSON.parse(raw) as Partial<StoredDraft>;
    if (
      !d || typeof d.answers !== "object" || d.answers === null || Array.isArray(d.answers) ||
      !Array.isArray(d.flagged) ||
      typeof d.startedAt !== "number" || !Number.isFinite(d.startedAt) ||
      typeof d.clientAttemptId !== "string" || !d.clientAttemptId
    )
      return null;
    const answers: Record<string, number | null> = {};
    for (const [k, v] of Object.entries(d.answers))
      if (v === null || (Number.isInteger(v) && (v as number) >= 0 && (v as number) <= 3)) answers[k] = v as number | null;
    return {
      answers,
      flagged: d.flagged.filter((x): x is string => typeof x === "string"),
      startedAt: d.startedAt,
      clientAttemptId: d.clientAttemptId,
    };
  } catch {
    return null;
  }
}

/** Maps a stored draft onto the current questions: unknown ids ignored, missing ones blank. */
export function restoreState(
  stored: StoredDraft,
  questionIds: string[],
  positions: number[][],
): { answers: number[]; flagged: boolean[] } {
  const flaggedSet = new Set(stored.flagged);
  return {
    answers: questionIds.map((id, i) => {
      const pos = stored.answers[id];
      if (pos === undefined || pos === null) return -1;
      return positions[i]?.indexOf(pos) ?? -1;
    }),
    flagged: questionIds.map((id) => flaggedSet.has(id)),
  };
}

export function snapshotState(
  stored: Pick<StoredDraft, "startedAt" | "clientAttemptId">,
  questionIds: string[],
  positions: number[][],
  answers: number[],
  flagged: boolean[],
): StoredDraft {
  const out: Record<string, number | null> = {};
  questionIds.forEach((id, i) => {
    const idx = answers[i] ?? -1;
    out[id] = idx >= 0 ? (positions[i]?.[idx] ?? null) : null;
  });
  return {
    answers: out,
    flagged: questionIds.filter((_, i) => flagged[i]),
    startedAt: stored.startedAt,
    clientAttemptId: stored.clientAttemptId,
  };
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

export function loadDraft(userId: string, examId: string, store: Store | null = defaultStore()): StoredDraft | null {
  try {
    return parseDraft(store?.getItem(draftKey(userId, examId)) ?? null);
  } catch {
    return null;
  }
}

export function saveDraft(userId: string, examId: string, draft: StoredDraft, store: Store | null = defaultStore()): void {
  try {
    store?.setItem(draftKey(userId, examId), JSON.stringify(draft));
  } catch {
    /* storage unavailable or full */
  }
}

export function clearDraft(userId: string, examId: string, store: Store | null = defaultStore()): void {
  try {
    store?.removeItem(draftKey(userId, examId));
  } catch {
    /* ignore */
  }
}
