import { apiRequest } from "./api";

export type Difficulty = "basic" | "medium" | "advanced";
export type ExamStatus = "generating" | "failed" | "draft" | "published";
export type ExamSource = "materials" | "ai";
export type UserRole = "student" | "admin";
export type MaterialVersionStatus = "uploading" | "uploaded" | "processing" | "ready" | "failed";
export type MaterialStatusGroup = "ready" | "processing" | "failed";
export type QuestionStatus = "draft" | "approved";
export type ReviewStatus = QuestionStatus | "rejected";

export interface ServiceStatus {
  services: Record<string, boolean>;
}
export interface AdminSubject {
  id: string;
  school_code: string;
  code: string;
  display_code?: string | null;
  name: string;
  description?: string | null;
  faculty?: string | null;
  duration_min?: number | null;
  question_count?: number | null;
  created_at?: string;
}
export interface AdminMaterialVersion {
  id: string;
  material_id: string;
  version_number: number;
  status: MaterialVersionStatus;
  original_filename: string;
  size_bytes: number;
  slide_count: number;
  error_message: string | null;
  created_at: string;
}
export interface AdminMaterial {
  id: string;
  subject_id: string;
  title: string;
  description: string | null;
  created_at: string;
  material_versions: AdminMaterialVersion[];
}
export interface ExamSummary {
  id: string;
  subject_id: string;
  title: string;
  status: ExamStatus;
  source: ExamSource;
  difficulty: Difficulty | null;
  duration_minutes: number;
  requested_count: number;
  question_count: number;
  checked_count: number;
  error_message: string | null;
  created_at: string;
  published_at: string | null;
}
export interface AdminOverview {
  admin: unknown;
  feedbackNewCount: number;
  subjects: AdminSubject[];
  materials: AdminMaterial[];
  exams: ExamSummary[];
}
export interface AdminQuestionOption {
  position: number;
  content: string;
  is_correct: boolean;
}
export interface AdminQuestionSource {
  material_version_id: string;
  slide_number: number;
  excerpt: string;
}
export interface AdminQuestion {
  id: string;
  position: number;
  status: QuestionStatus;
  difficulty: Difficulty;
  prompt: string;
  explanation: string;
  options: AdminQuestionOption[];
  sources: AdminQuestionSource[];
}
export interface AdminExamDetail {
  exam: ExamSummary & {
    extra_instructions: string | null;
    source_versions: Array<{ id: string; material_id: string; title: string | null; version_number: number }>;
  };
  questions: AdminQuestion[];
}
export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  schoolId: string;
  role: UserRole;
  createdAt: string;
}
export interface CreateSubjectBody {
  schoolCode: string;
  code: string;
  name: string;
  description?: string;
}
export interface UploadMaterialInput {
  subjectId: string;
  title: string;
  description?: string;
  file: File;
}
export interface UploadMaterialResult {
  versionId: string;
  status: "ready" | "processing";
  slideCount?: number;
  chunkCount?: number;
}
export interface GenerateExamBody {
  subjectId: string;
  title: string;
  durationMinutes: number;
  questionCount: number;
  difficulty: Difficulty;
  extraInstructions?: string;
  materialVersionIds?: string[];
}
export interface GenerateExamResult {
  examId: string;
  status: "generating";
  source: ExamSource;
}
export interface ReviewQuestionBody {
  status: ReviewStatus;
  prompt?: string;
  explanation?: string;
  options?: Array<{ position: number; content: string; isCorrect: boolean }>;
}
export interface PublishExamResult {
  examId: string;
  status: "published";
  questionCount: number;
  autoApprovedCount: number;
}

const enc = encodeURIComponent;
const json = (method: string, body?: unknown): RequestInit => ({
  method,
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});

export const getOverview = (signal?: AbortSignal) =>
  apiRequest<AdminOverview>("/Admin/overview", { ...(signal ? { signal } : {}) });
export const getServiceStatus = (signal?: AbortSignal) =>
  apiRequest<ServiceStatus>("/System/status", { ...(signal ? { signal } : {}) }, { authenticated: false });
export const listUsers = async (signal?: AbortSignal) =>
  (await apiRequest<{ users: AdminUser[] }>("/Admin/users", { ...(signal ? { signal } : {}) })).users;
export const changeUserRole = (userId: string, role: UserRole) =>
  apiRequest<{ userId: string; role: UserRole }>(`/Admin/users/${enc(userId)}/role`, json("PATCH", { role }));
export const createSubject = async (body: CreateSubjectBody) =>
  (await apiRequest<{ subject: AdminSubject }>("/Admin/subjects", json("POST", body))).subject;

export async function uploadMaterial(input: UploadMaterialInput): Promise<UploadMaterialResult> {
  const mimeType = input.file.type || "application/octet-stream";
  const created = await apiRequest<{ materialId: string; versionId: string; versionNumber: number; uploadPath: string }>(
    "/Admin/materials",
    json("POST", {
      subjectId: input.subjectId,
      title: input.title,
      ...(input.description ? { description: input.description } : {}),
      fileName: input.file.name,
      mimeType,
      sizeBytes: input.file.size,
    }),
  );
  await apiRequest(created.uploadPath, {
    method: "PUT",
    headers: { "Content-Type": mimeType },
    body: input.file,
  });
  return apiRequest<UploadMaterialResult>(
    `/Admin/materials/${enc(created.versionId)}/complete-upload`,
    json("POST", {}),
  );
}

export const generateExam = (body: GenerateExamBody) =>
  apiRequest<GenerateExamResult>("/Admin/exams/generate", json("POST", body));
export const getExam = (examId: string, signal?: AbortSignal) =>
  apiRequest<AdminExamDetail>(`/Admin/exams/${enc(examId)}`, { ...(signal ? { signal } : {}) });
export const reviewQuestion = (questionId: string, body: ReviewQuestionBody) =>
  apiRequest<{ questionId: string; status: ReviewStatus }>(`/Admin/questions/${enc(questionId)}`, json("PATCH", body));
export const publishExam = (examId: string) =>
  apiRequest<PublishExamResult>(`/Admin/exams/${enc(examId)}/publish`, json("POST", {}));
export const deleteExam = async (examId: string): Promise<void> => {
  await apiRequest<null>(`/Admin/exams/${enc(examId)}`, { method: "DELETE" });
};

export const subjectCode = (subject: Pick<AdminSubject, "code" | "display_code">) =>
  subject.display_code ?? subject.code;

export function latestVersion(material: AdminMaterial): AdminMaterialVersion | null {
  let best: AdminMaterialVersion | null = null;
  for (const v of material.material_versions)
    if (!best || v.version_number > best.version_number) best = v;
  return best;
}

export function readyVersionsOf(materials: AdminMaterial[], subjectId: string) {
  return materials
    .filter((m) => m.subject_id === subjectId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .flatMap((material) =>
      material.material_versions
        .filter((v) => v.status === "ready")
        .map((version) => ({ version, material })),
    );
}

export function materialStatusGroup(status: MaterialVersionStatus): MaterialStatusGroup {
  if (status === "ready") return "ready";
  if (status === "failed") return "failed";
  return "processing";
}

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  basic: "Cơ bản",
  medium: "Trung bình",
  advanced: "Nâng cao",
};

export function formatAdminDate(iso: string, now: Date = new Date()): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const time = `${p(d.getHours())}:${p(d.getMinutes())}`;
  if (sameDay(d, now)) return `Hôm nay, ${time}`;
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  if (sameDay(d, yesterday)) return `Hôm qua, ${time}`;
  const dm = `${p(d.getDate())}/${p(d.getMonth() + 1)}`;
  return d.getFullYear() === now.getFullYear() ? dm : `${dm}/${d.getFullYear()}`;
}

export const formatSizeMB = (bytes: number): string =>
  `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(bytes / (1024 * 1024))} MB`;

export type FeedbackStatus = "new" | "resolved";
export interface AdminFeedback {
  id: string;
  category: "bug" | "content" | "suggestion" | "other";
  message: string;
  page: string | null;
  status: FeedbackStatus;
  createdAt: string;
  resolvedAt: string | null;
  resolvedBy: { id: string; fullName: string } | null;
  user: { id: string; fullName: string; email: string; mssv: string; schoolId: string } | null;
}
export const listFeedback = async (status?: FeedbackStatus, signal?: AbortSignal) =>
  (
    await apiRequest<{ feedback: AdminFeedback[] }>(`/Admin/feedback${status ? `?status=${status}` : ""}`, {
      ...(signal ? { signal } : {}),
    })
  ).feedback;
export const setFeedbackStatus = (id: string, status: FeedbackStatus) =>
  apiRequest<{ id: string; status: FeedbackStatus }>(`/Admin/feedback/${encodeURIComponent(id)}`, json("PATCH", { status }));
