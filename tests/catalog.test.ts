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
import * as c from "../lib/catalog";

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal("fetch", vi.fn());
  auth.getAccessToken.mockResolvedValue("tok");
});
afterEach(() => vi.unstubAllGlobals());

const reply = (body: unknown) =>
  vi.mocked(fetch).mockResolvedValueOnce(Response.json(body));
const last = () => {
  const [url, init] = vi.mocked(fetch).mock.calls.at(-1)!;
  return { url: String(url), init: init as RequestInit };
};
const base = "https://backend.example/api/v1";

describe("catalog fetchers", () => {
  it("listSubjects", async () => {
    reply({ subjects: [{ id: "s" }] });
    expect(await c.listSubjects("fptu", { code: "PRF 192" })).toEqual([
      { id: "s" },
    ]);
    expect(last().url).toBe(`${base}/Subjects?schoolCode=fptu&code=PRF+192`);
    expect(last().init.method).toBeUndefined();
    expect(new Headers(last().init.headers).get("Authorization")).toBe(
      "Bearer tok",
    );
    reply({ subjects: [] });
    await c.listSubjects("fptu");
    expect(last().url).toBe(`${base}/Subjects?schoolCode=fptu`);
  });
  it("listSubjectExams, getExam, getAttempt unwrap envelopes", async () => {
    reply({ exams: [1] });
    expect(await c.listSubjectExams("abc")).toEqual([1]);
    expect(last().url).toBe(`${base}/Subjects/abc/exams`);
    reply({ exam: { id: "e" } });
    expect(await c.getExam("e")).toEqual({ id: "e" });
    expect(last().url).toBe(`${base}/Exams/e`);
    reply({ attempt: { id: "a" } });
    expect(await c.getAttempt("a")).toEqual({ id: "a" });
    expect(last().url).toBe(`${base}/Attempts/a`);
  });
  it("submitAttempt posts JSON", async () => {
    const input = {
      answers: [{ questionId: "q", selectedPosition: null }],
      spentSec: 5,
    };
    reply({ attemptId: "a", score: 1, correctCount: 0, totalCount: 1 });
    expect((await c.submitAttempt("e", input)).attemptId).toBe("a");
    expect(last().url).toBe(`${base}/Exams/e/attempts`);
    expect(last().init.method).toBe("POST");
    expect(JSON.parse(last().init.body as string)).toEqual(input);
    expect(new Headers(last().init.headers).get("Content-Type")).toBe(
      "application/json",
    );
  });
  it("dashboard, attempts, wrong answers, materials", async () => {
    reply({ stats: {} });
    expect(await c.getDashboard()).toEqual({ stats: {} });
    expect(last().url).toBe(`${base}/Me/dashboard`);
    reply({ attempts: [], nextBefore: null });
    await c.listMyAttempts({ limit: 5, before: "2026-01-01T00:00:00.000Z" });
    expect(last().url).toBe(
      `${base}/Me/attempts?limit=5&before=2026-01-01T00%3A00%3A00.000Z`,
    );
    reply({ attempts: [], nextBefore: null });
    await c.listMyAttempts();
    expect(last().url).toBe(`${base}/Me/attempts`);
    reply({ items: [1] });
    expect(await c.listWrongAnswers({ limit: 10 })).toEqual([1]);
    expect(last().url).toBe(`${base}/Me/wrong-answers?limit=10`);
    reply({ materials: [2] });
    expect(await c.listSchoolMaterials("fptu")).toEqual([2]);
    expect(last().url).toBe(`${base}/Materials?schoolCode=fptu`);
  });
  it("passes the abort signal", async () => {
    const ctl = new AbortController();
    reply({ subjects: [] });
    await c.listSubjects("fptu", { signal: ctl.signal });
    expect(last().init.signal).toBe(ctl.signal);
  });
});

describe("catalog helpers", () => {
  it("codeFromRouteId", () => {
    expect(c.codeFromRouteId("fptu", "fptu-prf192")).toBe("prf192");
    expect(c.codeFromRouteId("fptu", "fptu-eng302c-k3")).toBe("eng302c");
    expect(c.codeFromRouteId("fptu", "hust-prf192")).toBeNull();
    expect(c.codeFromRouteId("fptu", "")).toBeNull();
    expect(c.codeFromRouteId("fptu", "fptu-")).toBeNull();
  });
  it("subjectRouteId", () => {
    expect(c.subjectRouteId("fptu", "ENG302c")).toBe("fptu-eng302c");
  });
  it("difficultyLabel", () => {
    expect(c.difficultyLabel("basic")).toBe("Cơ bản");
    expect(c.difficultyLabel("medium")).toBe("Trung bình");
    expect(c.difficultyLabel("advanced")).toBe("Nâng cao");
    expect(c.difficultyLabel(null)).toBeNull();
  });
  it("formatFileSize", () => {
    expect(c.formatFileSize(0)).toBe("0 B");
    expect(c.formatFileSize(1023)).toBe("1023 B");
    expect(c.formatFileSize(1024)).toBe("1.0 KB");
    expect(c.formatFileSize(1024 * 1024)).toBe("1.0 MB");
    expect(c.formatFileSize(4.8 * 1024 * 1024)).toBe("4.8 MB");
  });
  it("formatRelativeTime", () => {
    const now = new Date(2026, 5, 15, 12, 0, 0);
    const ago = (ms: number) => new Date(now.getTime() - ms).toISOString();
    const m = 60_000,
      h = 60 * m,
      d = 24 * h;
    expect(c.formatRelativeTime(ago(59_000), now)).toBe("Vừa xong");
    expect(c.formatRelativeTime(ago(5 * m), now)).toBe("5 phút trước");
    expect(c.formatRelativeTime(ago(59 * m), now)).toBe("59 phút trước");
    expect(c.formatRelativeTime(ago(2 * h), now)).toBe("2 giờ trước");
    expect(c.formatRelativeTime(ago(24 * h), now)).toBe("Hôm qua");
    expect(c.formatRelativeTime(ago(3 * d), now)).toBe("3 ngày trước");
    const old = new Date(2026, 0, 5, 9, 0, 0);
    expect(c.formatRelativeTime(old.toISOString(), now)).toBe("05/01/2026");
    expect(c.formatRelativeTime("garbage", now)).toBe("");
  });
});
