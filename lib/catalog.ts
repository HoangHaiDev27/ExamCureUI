import { apiRequest } from "./api";

export type DifficultyCode = "basic" | "medium" | "advanced";
export type SubjectKind = "code" | "math" | "econ" | "theory" | "english";

export interface CatalogSubject {
  id: string;
  schoolCode: string;
  code: string;
  name: string;
  description: string | null;
  faculty: string | null;
  terms: number[];
  kind: SubjectKind | null;
  durationMin: number | null;
  questionCount: number | null;
  difficulty: DifficultyCode | null;
  publishedExamCount: number;
  lastScore: number | null;
}
export interface SubjectRef {
  id: string;
  schoolCode: string;
  code: string;
  name: string;
}
export interface ExamSummary {
  id: string;
  title: string;
  durationMinutes: number;
  questionCount: number;
  publishedAt: string | null;
  lastScore: number | null;
}
export interface ExamOption {
  position: number;
  content: string;
}
export interface ExamQuestion {
  id: string;
  prompt: string;
  options: ExamOption[];
}
export interface ExamDetail {
  id: string;
  title: string;
  durationMinutes: number;
  questionCount: number;
  subject: SubjectRef;
  questions: ExamQuestion[];
}
export interface AttemptAnswerInput {
  questionId: string;
  selectedPosition: number | null;
}
export interface SubmitAttemptInput {
  answers: AttemptAnswerInput[];
  spentSec: number;
}
export interface SubmitAttemptResult {
  attemptId: string;
  score: number;
  correctCount: number;
  totalCount: number;
}
export interface AttemptReviewQuestion {
  id: string;
  prompt: string | null;
  options: ExamOption[];
  selectedPosition: number | null;
  correctPosition: number | null;
  isCorrect: boolean;
  explanation: string | null;
}
export interface AttemptDetail {
  id: string;
  score: number;
  correctCount: number;
  totalCount: number;
  spentSec: number;
  submittedAt: string;
  exam: { id: string; title: string | null; durationMinutes: number | null };
  subject: SubjectRef;
  questions: AttemptReviewQuestion[];
}
export interface AttemptItem {
  id: string;
  examId: string;
  examTitle: string | null;
  subjectId: string;
  schoolCode: string | null;
  subjectCode: string | null;
  subjectName: string | null;
  score: number;
  correctCount: number;
  totalCount: number;
  submittedAt: string;
}
export interface Dashboard {
  stats: {
    totalAttempts: number;
    averageScore: number | null;
    attemptsThisWeek: number;
    subjectsInProgress: number;
    rankPercentile: number | null;
  };
  trend: Array<{ score: number; submittedAt: string }>;
  recentAttempts: AttemptItem[];
  weakestSubject: {
    subjectId: string;
    code: string;
    name: string;
    averageScore: number;
  } | null;
}
export interface MyAttemptsPage {
  attempts: AttemptItem[];
  nextBefore: string | null;
}
export interface WrongAnswer {
  questionId: string;
  subjectId: string;
  subjectCode: string | null;
  subjectName: string | null;
  prompt: string;
  yourAnswer: string | null;
  correctAnswer: string | null;
  explanation: string | null;
  submittedAt: string;
}
export interface SchoolMaterial {
  id: string;
  title: string;
  description: string | null;
  createdAt: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  version: {
    id: string;
    version_number: number;
    original_filename: string;
    mime_type: string;
    size_bytes: number;
    slide_count: number;
    processed_at: string | null;
  };
}

/** Per-subject materials list: one entry per ready version, no subject fields. */
export interface SubjectMaterial {
  id: string;
  title: string;
  description: string | null;
  createdAt: string;
  version: {
    id: string;
    version_number: number;
    original_filename: string;
    size_bytes: number;
    slide_count: number;
    processed_at: string | null;
  };
}

const qs = (params: Record<string, string | number | undefined | null>) => {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params))
    if (v !== undefined && v !== null && v !== "") q.set(k, String(v));
  const s = q.toString();
  return s ? `?${s}` : "";
};
const get = <T>(path: string, signal?: AbortSignal) =>
  apiRequest<T>(path, signal ? { signal } : {});

export async function listSubjects(
  schoolCode: string,
  opts: { code?: string; signal?: AbortSignal } = {},
): Promise<CatalogSubject[]> {
  return (
    await get<{ subjects: CatalogSubject[] }>(
      `/Subjects${qs({ schoolCode, code: opts.code })}`,
      opts.signal,
    )
  ).subjects;
}
export async function listSubjectExams(
  subjectId: string,
  signal?: AbortSignal,
): Promise<ExamSummary[]> {
  return (
    await get<{ exams: ExamSummary[] }>(
      `/Subjects/${encodeURIComponent(subjectId)}/exams`,
      signal,
    )
  ).exams;
}
export async function getExam(
  examId: string,
  signal?: AbortSignal,
): Promise<ExamDetail> {
  return (
    await get<{ exam: ExamDetail }>(
      `/Exams/${encodeURIComponent(examId)}`,
      signal,
    )
  ).exam;
}
export function submitAttempt(
  examId: string,
  input: SubmitAttemptInput,
  signal?: AbortSignal,
): Promise<SubmitAttemptResult> {
  return apiRequest<SubmitAttemptResult>(
    `/Exams/${encodeURIComponent(examId)}/attempts`,
    {
      method: "POST",
      body: JSON.stringify(input),
      ...(signal ? { signal } : {}),
    },
  );
}
export async function getAttempt(
  attemptId: string,
  signal?: AbortSignal,
): Promise<AttemptDetail> {
  return (
    await get<{ attempt: AttemptDetail }>(
      `/Attempts/${encodeURIComponent(attemptId)}`,
      signal,
    )
  ).attempt;
}
export function getDashboard(signal?: AbortSignal): Promise<Dashboard> {
  return get<Dashboard>("/Me/dashboard", signal);
}
export function listMyAttempts(
  opts: { limit?: number; before?: string; signal?: AbortSignal } = {},
): Promise<MyAttemptsPage> {
  return get<MyAttemptsPage>(
    `/Me/attempts${qs({ limit: opts.limit, before: opts.before })}`,
    opts.signal,
  );
}
export async function listWrongAnswers(
  opts: { limit?: number; signal?: AbortSignal } = {},
): Promise<WrongAnswer[]> {
  return (
    await get<{ items: WrongAnswer[] }>(
      `/Me/wrong-answers${qs({ limit: opts.limit })}`,
      opts.signal,
    )
  ).items;
}
export async function listSchoolMaterials(
  schoolCode: string,
  signal?: AbortSignal,
): Promise<SchoolMaterial[]> {
  return (
    await get<{ materials: SchoolMaterial[] }>(
      `/Materials${qs({ schoolCode })}`,
      signal,
    )
  ).materials;
}

export async function listSubjectMaterials(
  schoolCode: string,
  subjectCode: string,
  signal?: AbortSignal,
): Promise<SubjectMaterial[]> {
  return (
    await get<{ materials: SubjectMaterial[] }>(
      `/Materials${qs({ schoolCode, subjectCode })}`,
      signal,
    )
  ).materials;
}

const DIFFICULTY: Record<DifficultyCode, string> = {
  basic: "Cơ bản",
  medium: "Trung bình",
  advanced: "Nâng cao",
};
export function difficultyLabel(
  d: DifficultyCode | null | undefined,
): string | null {
  return d ? (DIFFICULTY[d] ?? null) : null;
}
export function subjectRouteId(schoolId: string, code: string): string {
  return `${schoolId}-${code.toLowerCase()}`;
}
export function codeFromRouteId(
  schoolId: string,
  routeId: string,
): string | null {
  const prefix = `${schoolId}-`;
  if (!routeId.toLowerCase().startsWith(prefix.toLowerCase())) return null;
  const code = routeId.slice(prefix.length).replace(/-k\d+$/i, "");
  return code || null;
}
export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
}
export function formatRelativeTime(
  iso: string,
  now: Date = new Date(),
): string {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return "";
  const sec = Math.floor((now.getTime() - then.getTime()) / 1000);
  if (sec < 60) return "Vừa xong";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} phút trước`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour} giờ trước`;
  const day = Math.floor(hour / 24);
  if (day === 1) return "Hôm qua";
  if (day < 7) return `${day} ngày trước`;
  const dd = String(then.getDate()).padStart(2, "0"),
    mm = String(then.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${then.getFullYear()}`;
}
