import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({
  getAccessToken: vi.fn(),
  clearAuthCache: vi.fn(),
  refreshAuthProfile: vi.fn(),
}));
vi.mock("../lib/auth", () => ({ API_BASE_URL: "https://backend.example/api/v1", ...auth }));
import { ApiError, apiRequest } from "../lib/api";
import {
  errorText,
  sourceHref,
  sourceLabel,
  subjectContextFromPathname,
  toRequestMessages,
  type HistoryEntry,
} from "../lib/assistant";

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal("fetch", vi.fn());
  auth.getAccessToken.mockResolvedValue("tok");
});
afterEach(() => vi.unstubAllGlobals());

describe("ApiError code", () => {
  it("is filled from the response JSON", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(Response.json({ message: "Hết hạn mức", code: "ASSISTANT_QUOTA_EXCEEDED" }, { status: 429 }));
    const error = await apiRequest("/Assistant/chat", { method: "POST" }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 429, message: "Hết hạn mức", code: "ASSISTANT_QUOTA_EXCEEDED" });
  });
  it("stays undefined without a code and the old constructor still works", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(Response.json({ message: "x" }, { status: 429 }));
    const error = (await apiRequest("/x").catch((e: unknown) => e)) as ApiError;
    expect(error.code).toBeUndefined();
    expect(new ApiError(500, "m")).toMatchObject({ status: 500, message: "m" });
  });
});

describe("toRequestMessages", () => {
  const h = (role: "user" | "assistant", content: string, kind?: HistoryEntry["kind"]): HistoryEntry => ({ role, content, ...(kind ? { kind } : {}) });
  it("drops greeting, errors and notes, and trims", () => {
    expect(
      toRequestMessages([h("assistant", "Chào", "greeting"), h("user", "  hỏi 1  "), h("assistant", "đáp 1"), h("assistant", "lỗi", "error"), h("user", "hỏi 2")]),
    ).toEqual([
      { role: "user", content: "hỏi 1" },
      { role: "assistant", content: "đáp 1" },
      { role: "user", content: "hỏi 2" },
    ]);
  });
  it("keeps only the last 8 turns and ends with a user message", () => {
    const many = Array.from({ length: 20 }, (_, i) => h(i % 2 === 0 ? "user" : "assistant", `m${i}`));
    const out = toRequestMessages(many.slice(0, 19));
    expect(out).toHaveLength(8);
    expect(out[out.length - 1]).toEqual({ role: "user", content: "m18" });
    expect(toRequestMessages([h("user", "a"), h("assistant", "b")])).toEqual([{ role: "user", content: "a" }]);
    expect(toRequestMessages([h("assistant", "b")])).toEqual([]);
  });
  it("caps each message at 2000 characters", () => {
    expect(toRequestMessages([h("user", "x".repeat(3000))])[0]!.content).toHaveLength(2000);
  });
});

describe("sources", () => {
  const base = { versionId: "v1", materialTitle: "Giáo trình C", slideNumber: 4 };
  it("labels slides and Word sections", () => {
    expect(sourceLabel({ ...base, originalFilename: "a.pptx" })).toBe("Giáo trình C · slide 4");
    expect(sourceLabel({ ...base, originalFilename: "a.DOCX" })).toBe("Giáo trình C · phần 4");
  });
  it("links to the material viewer", () => {
    expect(sourceHref({ schoolCode: "fptu", code: "CSD201" }, base)).toBe("/schools/fptu/subjects/fptu-csd201/materials/v1");
  });
});

describe("subjectContextFromPathname", () => {
  it("reads subject, material and result pages", () => {
    expect(subjectContextFromPathname("/schools/fptu/subjects/fptu-csd201")).toEqual({ schoolCode: "fptu", code: "csd201" });
    expect(subjectContextFromPathname("/schools/fptu/subjects/fptu-csd201/materials/abc")).toEqual({ schoolCode: "fptu", code: "csd201" });
    expect(subjectContextFromPathname("/exam/fptu/fptu-csd201/result")).toEqual({ schoolCode: "fptu", code: "csd201" });
  });
  it("is null for the exam room, dashboard and bad route ids", () => {
    expect(subjectContextFromPathname("/exam/fptu/fptu-csd201")).toBeNull();
    expect(subjectContextFromPathname("/dashboard")).toBeNull();
    expect(subjectContextFromPathname("/")).toBeNull();
    expect(subjectContextFromPathname("/schools/fptu/subjects/garbage")).toBeNull();
  });
});

describe("errorText", () => {
  it("maps each case", () => {
    expect(errorText(new ApiError(429, "Bạn đã dùng hết 20 câu hỏi hôm nay.", "ASSISTANT_QUOTA_EXCEEDED"))).toBe("Bạn đã dùng hết 20 câu hỏi hôm nay.");
    expect(errorText(new ApiError(429, "x", "RATE_LIMITED"))).toContain("hỏi nhanh");
    expect(errorText(new ApiError(429, "Too many requests"))).toContain("hỏi nhanh");
    expect(errorText(new ApiError(503, "x", "AI_UNAVAILABLE"))).toContain("chưa sẵn sàng");
    expect(errorText(new ApiError(502, "x", "ASSISTANT_UPSTREAM_FAILED"))).toContain("đang bận");
    expect(errorText(new ApiError(0, "x"))).toContain("kết nối");
    expect(errorText(new ApiError(401, "x"))).toContain("đăng nhập");
    expect(errorText(new Error("boom"))).toContain("Không gửi được");
  });
});
