import { ApiError, apiRequest } from "./api";
import { materialHref, materialUnit } from "./dashboard-helpers";
import { codeFromRouteId } from "./route-ids";

export interface AssistantUsage {
  available: boolean;
  limit: number;
  used: number;
  remainingToday: number;
}
export interface AssistantSource {
  versionId: string;
  materialTitle: string;
  originalFilename: string;
  slideNumber: number;
  excerpt: string;
}
export interface AssistantSubjectRef {
  id: string;
  schoolCode: string;
  code: string;
  name: string;
}
export interface AssistantReply {
  answer: string;
  grounded: boolean;
  sources: AssistantSource[];
  subject: AssistantSubjectRef | null;
  remainingToday: number;
}
export interface RequestMessage {
  role: "user" | "assistant";
  content: string;
}
/** Local chat entry; only "normal" entries are ever sent back as history. */
export interface HistoryEntry {
  role: "user" | "assistant";
  content: string;
  kind?: "greeting" | "normal" | "error" | "note";
}

export const MAX_MESSAGE_CHARS = 2000;
export const MAX_HISTORY = 8;

export function getAssistantUsage(signal?: AbortSignal): Promise<AssistantUsage> {
  return apiRequest<AssistantUsage>("/Assistant/usage", signal ? { signal } : {});
}

export function askAssistant(
  body: { subjectId?: string | undefined; messages: RequestMessage[] },
  signal?: AbortSignal,
): Promise<AssistantReply> {
  return apiRequest<AssistantReply>("/Assistant/chat", {
    method: "POST",
    body: JSON.stringify(body),
    ...(signal ? { signal } : {}),
  });
}

/** Last turns that were really exchanged, each trimmed and capped; always ends with a user message. */
export function toRequestMessages(history: readonly HistoryEntry[]): RequestMessage[] {
  const turns: RequestMessage[] = history
    .filter((m) => !m.kind || m.kind === "normal")
    .map((m) => ({ role: m.role, content: m.content.trim().slice(0, MAX_MESSAGE_CHARS).trim() }))
    .filter((m) => m.content.length > 0);
  while (turns.length > 0 && turns[turns.length - 1]!.role !== "user") turns.pop();
  return turns.slice(-MAX_HISTORY);
}

export function sourceLabel(source: Pick<AssistantSource, "materialTitle" | "originalFilename" | "slideNumber">): string {
  return `${source.materialTitle} · ${materialUnit(source.originalFilename)} ${source.slideNumber}`;
}

export function sourceHref(subject: Pick<AssistantSubjectRef, "schoolCode" | "code">, source: Pick<AssistantSource, "versionId">): string {
  return materialHref(subject.schoolCode, subject.code, source.versionId);
}

/** Subject the current page is about, if any (subject/material pages and the result page; never the exam room). */
export function subjectContextFromPathname(pathname: string): { schoolCode: string; code: string } | null {
  const match =
    pathname.match(/^\/schools\/([^/]+)\/subjects\/([^/]+)(?:\/|$)/) ?? pathname.match(/^\/exam\/([^/]+)\/([^/]+)\/result\/?$/);
  if (!match) return null;
  const school = match[1]!;
  const code = codeFromRouteId(school, match[2]!);
  return code ? { schoolCode: school, code } : null;
}

export function errorText(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.code) {
      case "ASSISTANT_QUOTA_EXCEEDED":
        return error.message;
      case "RATE_LIMITED":
        return "Bạn hỏi nhanh quá, vui lòng đợi một phút rồi thử lại.";
      case "AI_UNAVAILABLE":
        return "Trợ lý AI chưa sẵn sàng. Vui lòng quay lại sau.";
      case "ASSISTANT_UPSTREAM_FAILED":
        return "Trợ lý AI đang bận, vui lòng thử lại sau ít phút.";
      case "NOT_FOUND":
        return "Không tìm thấy môn học đã chọn.";
    }
    if (error.status === 0) return "Không kết nối được máy chủ. Vui lòng thử lại.";
    if (error.status === 401) return "Bạn cần đăng nhập để dùng trợ lý AI.";
    if (error.status === 429) return "Bạn hỏi nhanh quá, vui lòng đợi một phút rồi thử lại.";
    if (error.status === 400) return "Câu hỏi không hợp lệ. Hãy rút gọn và thử lại.";
    if (error.status === 502 || error.status === 503) return "Trợ lý AI đang bận, vui lòng thử lại sau ít phút.";
  }
  return "Không gửi được câu hỏi. Vui lòng thử lại.";
}
