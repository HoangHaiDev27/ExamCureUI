import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({
  getAccessToken: vi.fn(),
  clearAuthCache: vi.fn(),
  refreshAuthProfile: vi.fn(),
}));
vi.mock("../lib/auth", () => ({
  API_BASE_URL: "https://backend.example/api/v1",
  ...auth,
}));
import { FEEDBACK_CATEGORY_LABEL, submitFeedback } from "../lib/feedback";

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal("fetch", vi.fn());
  auth.getAccessToken.mockResolvedValue("tok");
});
afterEach(() => vi.unstubAllGlobals());

describe("submitFeedback", () => {
  it("posts the feedback as JSON with the bearer token", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(Response.json({ id: "f1" }, { status: 201 }));
    const body = { category: "bug" as const, message: "Lỗi nộp bài", page: "/dashboard?tab=de-thi" };
    expect(await submitFeedback(body)).toEqual({ id: "f1" });
    const [url, init] = vi.mocked(fetch).mock.calls[0]!;
    expect(String(url)).toBe("https://backend.example/api/v1/Feedback");
    expect((init as RequestInit).method).toBe("POST");
    expect(JSON.parse((init as RequestInit).body as string)).toEqual(body);
    expect(new Headers((init as RequestInit).headers).get("Authorization")).toBe("Bearer tok");
  });
  it("surfaces the status on a rate limit", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(Response.json({ message: "Too many" }, { status: 429 }));
    await expect(submitFeedback({ category: "other", message: "x" })).rejects.toMatchObject({ status: 429 });
  });
  it("labels every category", () => {
    expect(FEEDBACK_CATEGORY_LABEL).toEqual({
      bug: "Lỗi hệ thống",
      content: "Câu hỏi hoặc đáp án sai",
      suggestion: "Góp ý tính năng",
      other: "Khác",
    });
  });
});
