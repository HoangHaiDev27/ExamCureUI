import { API_BASE_URL, getAuth, login, logout } from "./auth";

/* ============================================================
   Kiểu dữ liệu — khớp với /api/v1/admin/* (ExamcureBE NestJS)
   ============================================================ */

export type Role = "Student" | "Teacher" | "Admin";
export const ROLES: Role[] = ["Student", "Teacher", "Admin"];
export const ROLE_LABEL: Record<Role, string> = {
  Student: "Sinh viên",
  Teacher: "Giảng viên",
  Admin: "Quản trị",
};

export const KINDS = ["theory", "code", "math", "econ", "english"] as const;
export const KIND_LABEL: Record<string, string> = {
  theory: "Lý thuyết",
  code: "Lập trình",
  math: "Toán",
  econ: "Kinh tế",
  english: "Tiếng Anh",
};
export const DIFFICULTIES = ["Cơ bản", "Trung bình", "Nâng cao"] as const;
export const REGIONS = ["Miền Bắc", "Miền Trung", "Miền Nam"] as const;
export const LAYOUTS = ["classic", "moodle", "banded"] as const;
export const MARKS = ["square", "shield", "circle", "hex"] as const;

export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminUser {
  id: string;
  email: string;
  role: Role;
  isEmailVerified: boolean;
  isLocked: boolean;
  createdAt: string;
  fullName: string;
  mssv: string;
  schoolId: string;
  totalExamsTaken: number;
  streakDays: number;
  lastActiveDate?: string;
}

export interface AdminSchool {
  id: string;
  name: string;
  abbr: string;
  city: string;
  region: string;
  field: string;
  popular: boolean;
  subjectCount: number;
  learnersK: number;
  brandColor?: string;
  brandDarkColor?: string;
  onBrandColor?: string;
  tintColor?: string;
  layout: string;
  systemName?: string;
  mark: string;
}

export interface AdminSubject {
  id: string;
  schoolId: string | null;
  school: { id: string; name: string; abbr: string; brandColor?: string } | null;
  name: string;
  code: string;
  faculty?: string;
  semester?: string;
  durationMin: number;
  questionCount: number;
  difficulty: string;
  scale: string;
  kind: string;
  bankSize: number;
}

export interface AdminQuestion {
  id: string;
  subjectId: string | null;
  subject: { id: string; name: string; code: string } | null;
  prompt: string;
  code?: string;
  formula?: string;
  options: string[];
  answerIndex: number;
  explain?: string;
  kind: string;
  difficulty: string;
  createdAt: string;
}

export interface SubmissionRow {
  id: string;
  score: number;
  grade: string;
  durationUsedMin: number;
  createdAt: string;
  total: number;
  correct: number;
  user: { id: string; email: string; fullName: string };
  subject: { id: string; name: string; code: string };
}

export interface SubmissionDetail extends SubmissionRow {
  sessionId: string;
  questions: {
    questionId: string;
    prompt: string;
    options: string[];
    correctAnswerIndex: number;
    studentAnswerIndex: number;
    isCorrect: boolean;
    explain: string;
  }[];
}

export interface Overview {
  users: { total: number; students: number; teachers: number; admins: number; new7d: number };
  catalog: { schools: number; subjects: number; questions: number };
  exams: { total: number; last7d: number; avgScore: number | null };
  series: { date: string; count: number; avgScore: number | null }[];
  topSubjects: { id: string; name: string; code: string; count: number; avgScore: number }[];
  recent: SubmissionRow[];
}

/* ============================================================
   HTTP client
   ============================================================ */

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** Đổi refresh token lấy access token mới; trả false nếu không được. */
let refreshing: Promise<boolean> | null = null;
function refreshToken(): Promise<boolean> {
  refreshing ??= (async () => {
    const auth = getAuth();
    if (!auth?.refreshToken) return false;
    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: auth.refreshToken }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      login({ ...auth, token: data.token, refreshToken: data.refreshToken, role: data.role });
      return true;
    } catch {
      return false;
    }
  })().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

function messageOf(data: unknown, fallback: string): string {
  const m = (data as { message?: unknown })?.message;
  if (Array.isArray(m)) return m.join(" · ");
  return typeof m === "string" && m ? m : fallback;
}

export async function api<T>(path: string, init: RequestInit = {}, retried = false): Promise<T> {
  const token = getAuth()?.token;
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new ApiError(0, `Không kết nối được máy chủ (${API_BASE_URL}).`);
  }

  if (res.status === 401 && !retried && (await refreshToken())) {
    return api<T>(path, init, true);
  }
  if (res.status === 401) {
    logout();
    throw new ApiError(401, "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, messageOf(data, `Lỗi ${res.status}`));
  return data as T;
}

const json = (body: unknown): RequestInit => ({ body: JSON.stringify(body) });

export function qs(params: Record<string, string | number | undefined>): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "") p.set(k, String(v));
  const s = p.toString();
  return s ? `?${s}` : "";
}

export const adminApi = {
  me: () => api<{ id: string; email: string; role: Role; fullName: string }>("/auth/me"),
  overview: () => api<Overview>("/admin/overview"),

  users: (q: { page?: number; search?: string; role?: string; status?: string }) =>
    api<Paged<AdminUser>>(`/admin/users${qs({ limit: 20, ...q })}`),
  updateUser: (id: string, body: { role?: Role; isLocked?: boolean }) =>
    api<AdminUser>(`/admin/users/${id}`, { method: "PATCH", ...json(body) }),

  schools: () => api<AdminSchool[]>("/admin/schools"),
  createSchool: (body: Partial<AdminSchool>) => api<AdminSchool>("/admin/schools", { method: "POST", ...json(body) }),
  updateSchool: (id: string, body: Partial<AdminSchool>) =>
    api<AdminSchool>(`/admin/schools/${id}`, { method: "PATCH", ...json(body) }),
  deleteSchool: (id: string) => api<{ deleted: boolean }>(`/admin/schools/${id}`, { method: "DELETE" }),

  subjects: (q: { page?: number; search?: string; schoolId?: string; limit?: number }) =>
    api<Paged<AdminSubject>>(`/admin/subjects${qs({ limit: 20, ...q })}`),
  createSubject: (body: Partial<AdminSubject>) => api<AdminSubject>("/admin/subjects", { method: "POST", ...json(body) }),
  updateSubject: (id: string, body: Partial<AdminSubject>) =>
    api<AdminSubject>(`/admin/subjects/${id}`, { method: "PATCH", ...json(body) }),
  deleteSubject: (id: string) => api<{ deleted: boolean }>(`/admin/subjects/${id}`, { method: "DELETE" }),

  questions: (q: { page?: number; search?: string; subjectId?: string; kind?: string; difficulty?: string }) =>
    api<Paged<AdminQuestion>>(`/admin/questions${qs({ limit: 20, ...q })}`),
  createQuestion: (body: QuestionInput) => api<AdminQuestion>("/admin/questions", { method: "POST", ...json(body) }),
  updateQuestion: (id: string, body: QuestionInput) =>
    api<AdminQuestion>(`/admin/questions/${id}`, { method: "PUT", ...json(body) }),
  deleteQuestion: (id: string) => api<{ deleted: boolean }>(`/admin/questions/${id}`, { method: "DELETE" }),

  submissions: (q: { page?: number; search?: string; subjectId?: string; userId?: string }) =>
    api<Paged<SubmissionRow>>(`/admin/submissions${qs({ limit: 20, ...q })}`),
  submission: (id: string) => api<SubmissionDetail>(`/admin/submissions/${id}`),
};

export interface QuestionInput {
  subjectId: string;
  prompt: string;
  code?: string;
  formula?: string;
  options: string[];
  answerIndex: number;
  explain?: string;
  kind?: string;
  difficulty?: string;
}

/* ============================================================
   Định dạng
   ============================================================ */

export function fmtDate(iso?: string, withTime = false): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

export function fmtScore(n: number | null | undefined): string {
  return n == null ? "—" : n.toLocaleString("vi-VN", { maximumFractionDigits: 2 });
}
