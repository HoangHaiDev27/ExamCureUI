import type { AttemptItem, CatalogSubject, SubjectMaterial } from "./catalog";
import { subjectRouteId } from "./catalog";

export interface TermGroup<T> {
  term: number;
  subjects: T[];
}

/**
 * Groups subjects by curriculum term. A subject that belongs to several terms
 * appears in each group. Subjects without terms are returned separately.
 */
export function groupByTerm<T extends { code: string; terms: number[] }>(
  subjects: T[],
): { groups: TermGroup<T>[]; untermed: T[] } {
  const byTerm = new Map<number, T[]>();
  const untermed: T[] = [];
  for (const subject of subjects) {
    if (!subject.terms.length) {
      untermed.push(subject);
      continue;
    }
    for (const term of new Set(subject.terms)) {
      const list = byTerm.get(term) ?? [];
      list.push(subject);
      byTerm.set(term, list);
    }
  }
  const byCode = (a: T, b: T) => a.code.localeCompare(b.code);
  return {
    groups: [...byTerm.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([term, list]) => ({ term, subjects: list.sort(byCode) })),
    untermed: untermed.sort(byCode),
  };
}

/**
 * Quick-access subjects: those from recent attempts first (most recent first),
 * then other subjects that have published exams, up to `limit`.
 */
export function selectQuickAccess(
  subjects: CatalogSubject[],
  recentAttempts: Pick<AttemptItem, "subjectId">[],
  limit = 5,
): CatalogSubject[] {
  const byId = new Map(subjects.map((s) => [s.id, s]));
  const picked: CatalogSubject[] = [];
  const seen = new Set<string>();
  const add = (subject: CatalogSubject | undefined) => {
    if (!subject || seen.has(subject.id) || picked.length >= limit) return;
    seen.add(subject.id);
    picked.push(subject);
  };
  for (const attempt of recentAttempts) add(byId.get(attempt.subjectId));
  for (const subject of subjects)
    if (subject.publishedExamCount > 0) add(subject);
  return picked;
}

/** One entry per material id, keeping the highest version number. */
export function dedupeMaterials(materials: SubjectMaterial[]): SubjectMaterial[] {
  const best = new Map<string, SubjectMaterial>();
  for (const m of materials) {
    const current = best.get(m.id);
    if (!current || m.version.version_number > current.version.version_number)
      best.set(m.id, m);
  }
  return [...best.values()];
}

/** Upper-case file extension, e.g. "PPTX". */
export function fileTypeLabel(filename: string): string {
  const dot = filename.lastIndexOf(".");
  return dot >= 0 && dot < filename.length - 1
    ? filename.slice(dot + 1).toUpperCase()
    : "FILE";
}

/** Unit label for extracted material rows: Word documents are split into sections. */
export function materialUnit(filename: string): "slide" | "phần" {
  return filename.toLowerCase().endsWith(".docx") ? "phần" : "slide";
}

/** Slide/section body, or the empty-state placeholder when it has no text. */
export function materialBodyText(text: string, filename: string): string {
  return text || `${materialUnit(filename) === "phần" ? "Phần" : "Slide"} này không có text để hiển thị.`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

/** Last score minus first score of the trend; null with fewer than 2 points. */
export function trendDelta(scores: number[]): number | null {
  if (scores.length < 2) return null;
  return Math.round((scores[scores.length - 1]! - scores[0]!) * 10) / 10;
}

export function examHref(schoolCode: string, subjectCode: string): string {
  return `/exam/${schoolCode}/${subjectRouteId(schoolCode, subjectCode)}`;
}

export function resultHref(item: Pick<AttemptItem, "id" | "schoolCode" | "subjectCode">): string | null {
  if (!item.schoolCode || !item.subjectCode) return null;
  return `${examHref(item.schoolCode, item.subjectCode)}/result?attempt=${item.id}`;
}

export function materialHref(
  schoolCode: string,
  subjectCode: string,
  versionId: string,
): string {
  return `/schools/${schoolCode}/subjects/${subjectRouteId(schoolCode, subjectCode)}/materials/${versionId}`;
}
