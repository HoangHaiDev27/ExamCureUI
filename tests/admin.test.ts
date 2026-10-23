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
import * as a from "../lib/admin";

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal("fetch", vi.fn());
  auth.getAccessToken.mockResolvedValue("tok");
});
afterEach(() => vi.unstubAllGlobals());

const reply = (body: unknown, status = 200) =>
  vi.mocked(fetch).mockResolvedValueOnce(Response.json(body, { status }));
const call = (i = -1) => {
  const [url, init] = vi.mocked(fetch).mock.calls.at(i)!;
  return { url: String(url), init: init as RequestInit, headers: new Headers((init as RequestInit).headers) };
};
const base = "https://backend.example/api/v1";

describe("admin fetchers", () => {
  it("getOverview", async () => {
    reply({ subjects: [], materials: [], exams: [] });
    await a.getOverview();
    expect(call().url).toBe(`${base}/Admin/overview`);
    expect(call().headers.get("Authorization")).toBe("Bearer tok");
  });
  it("getServiceStatus is unauthenticated", async () => {
    reply({ services: { openai: true } });
    expect((await a.getServiceStatus()).services.openai).toBe(true);
    expect(call().url).toBe(`${base}/System/status`);
    expect(call().headers.get("Authorization")).toBeNull();
  });
  it("listUsers unwraps and changeUserRole patches", async () => {
    reply({ users: [{ id: "u" }] });
    expect(await a.listUsers()).toEqual([{ id: "u" }]);
    expect(call().url).toBe(`${base}/Admin/users`);
    reply({ userId: "u/1", role: "admin" });
    await a.changeUserRole("u/1", "admin");
    expect(call().url).toBe(`${base}/Admin/users/u%2F1/role`);
    expect(call().init.method).toBe("PATCH");
    expect(JSON.parse(call().init.body as string)).toEqual({ role: "admin" });
  });
  it("createSubject returns the subject", async () => {
    const body = { schoolCode: "fptu", code: "PRF192", name: "C" };
    reply({ subject: { id: "s" } }, 201);
    expect(await a.createSubject(body)).toEqual({ id: "s" });
    expect(call().url).toBe(`${base}/Admin/subjects`);
    expect(call().init.method).toBe("POST");
    expect(JSON.parse(call().init.body as string)).toEqual(body);
    expect(call().headers.get("Authorization")).toBe("Bearer tok");
  });
  it("uploadMaterial runs three requests in order", async () => {
    const file = new File(["PPTXDATA"], "bai.pptx", { type: "" });
    reply({ materialId: "m", versionId: "v1", versionNumber: 1, uploadPath: "/Admin/materials/v1/file" }, 201);
    reply({ versionId: "v1", status: "uploaded" });
    reply({ versionId: "v1", status: "ready", slideCount: 3, chunkCount: 5 });
    const result = await a.uploadMaterial({ subjectId: "s", title: "Bài 1", file });
    expect(result).toEqual({ versionId: "v1", status: "ready", slideCount: 3, chunkCount: 5 });
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(3);
    const [c1, c2, c3] = [call(0), call(1), call(2)];
    expect(c1.url).toBe(`${base}/Admin/materials`);
    expect(c1.init.method).toBe("POST");
    expect(JSON.parse(c1.init.body as string)).toEqual({
      subjectId: "s",
      title: "Bài 1",
      fileName: "bai.pptx",
      mimeType: "application/octet-stream",
      sizeBytes: file.size,
    });
    expect(c2.url).toBe(`${base}/Admin/materials/v1/file`);
    expect(c2.init.method).toBe("PUT");
    expect(c2.init.body).toBe(file);
    expect(c2.headers.get("Content-Type")).toBe("application/octet-stream");
    expect(c2.headers.get("Authorization")).toBe("Bearer tok");
    expect(c3.url).toBe(`${base}/Admin/materials/v1/complete-upload`);
    expect(c3.init.method).toBe("POST");
  });
  it("uploadMaterial sends docx name and mime", async () => {
    const file = new File(["DOCXDATA"], "bai.docx", { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
    reply({ materialId: "m", versionId: "v2", versionNumber: 1, uploadPath: "/Admin/materials/v2/file" }, 201);
    reply({ versionId: "v2", status: "uploaded" });
    reply({ versionId: "v2", status: "ready", slideCount: 2, chunkCount: 2 });
    await a.uploadMaterial({ subjectId: "s", title: "Bài 2", file });
    expect(JSON.parse(call(0).init.body as string)).toMatchObject({
      fileName: "bai.docx",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      sizeBytes: file.size,
    });
    expect(call(1).init.body).toBe(file);
  });
  it("generateExam, getExam, reviewQuestion, publishExam", async () => {
    const body = { subjectId: "s", title: "T", durationMinutes: 30, questionCount: 5, difficulty: "basic" as const };
    reply({ examId: "e", status: "generating", source: "ai" }, 202);
    expect((await a.generateExam(body)).examId).toBe("e");
    expect(call().url).toBe(`${base}/Admin/exams/generate`);
    expect(call().init.method).toBe("POST");
    expect(JSON.parse(call().init.body as string)).toEqual(body);
    reply({ exam: {}, questions: [] });
    await a.getExam("e 1");
    expect(call().url).toBe(`${base}/Admin/exams/e%201`);
    reply({ questionId: "q", status: "approved" });
    const review = { status: "approved" as const, prompt: "P" };
    await a.reviewQuestion("q", review);
    expect(call().url).toBe(`${base}/Admin/questions/q`);
    expect(call().init.method).toBe("PATCH");
    expect(JSON.parse(call().init.body as string)).toEqual(review);
    reply({ examId: "e", status: "published", questionCount: 2, autoApprovedCount: 1 });
    expect((await a.publishExam("e")).autoApprovedCount).toBe(1);
    expect(call().url).toBe(`${base}/Admin/exams/e/publish`);
    expect(call().init.method).toBe("POST");
    expect(call().headers.get("Authorization")).toBe("Bearer tok");
  });
  it("listFeedback unwraps, with and without a status filter", async () => {
    reply({ feedback: [{ id: "f" }] });
    expect(await a.listFeedback()).toEqual([{ id: "f" }]);
    expect(call().url).toBe(`${base}/Admin/feedback`);
    expect(call().headers.get("Authorization")).toBe("Bearer tok");
    reply({ feedback: [] });
    await a.listFeedback("new");
    expect(call().url).toBe(`${base}/Admin/feedback?status=new`);
  });
  it("setFeedbackStatus patches the status", async () => {
    reply({ id: "f/1", status: "resolved" });
    expect(await a.setFeedbackStatus("f/1", "resolved")).toEqual({ id: "f/1", status: "resolved" });
    expect(call().url).toBe(`${base}/Admin/feedback/f%2F1`);
    expect(call().init.method).toBe("PATCH");
    expect(JSON.parse(call().init.body as string)).toEqual({ status: "resolved" });
  });
  it("deleteExam resolves on 204", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 204 }));
    await expect(a.deleteExam("e")).resolves.toBeUndefined();
    expect(call().url).toBe(`${base}/Admin/exams/e`);
    expect(call().init.method).toBe("DELETE");
  });
});

const v = (id: string, n: number, status: a.MaterialVersionStatus = "ready"): a.AdminMaterialVersion => ({
  id, material_id: "m", version_number: n, status, original_filename: "f", size_bytes: 1, slide_count: 1,
  error_message: null, created_at: "2025-01-01",
});
const mat = (id: string, subject_id: string, created_at: string, versions: a.AdminMaterialVersion[]): a.AdminMaterial => ({
  id, subject_id, title: id, description: null, created_at, material_versions: versions,
});

describe("admin helpers", () => {
  it("subjectCode", () => {
    expect(a.subjectCode({ code: "PRF192", display_code: "PRF 192" })).toBe("PRF 192");
    expect(a.subjectCode({ code: "PRF192" })).toBe("PRF192");
  });
  it("latestVersion", () => {
    expect(a.latestVersion(mat("a", "s", "x", []))).toBeNull();
    expect(a.latestVersion(mat("a", "s", "x", [v("1", 1), v("3", 3), v("2", 2)]))!.id).toBe("3");
  });
  it("readyVersionsOf filters by subject and status, newest material first", () => {
    const ms = [
      mat("old", "s", "2025-01-01", [v("o1", 1), v("o2", 2, "failed")]),
      mat("new", "s", "2025-02-01", [v("n1", 1)]),
      mat("other", "t", "2025-03-01", [v("x1", 1)]),
    ];
    expect(a.readyVersionsOf(ms, "s").map((r) => r.version.id)).toEqual(["n1", "o1"]);
    expect(a.readyVersionsOf(ms, "z")).toEqual([]);
  });
  it("materialStatusGroup", () => {
    expect(a.materialStatusGroup("ready")).toBe("ready");
    expect(a.materialStatusGroup("failed")).toBe("failed");
    for (const s of ["uploading", "uploaded", "processing"] as const)
      expect(a.materialStatusGroup(s)).toBe("processing");
  });
  it("DIFFICULTY_LABEL", () => {
    expect(a.DIFFICULTY_LABEL).toEqual({ basic: "Cơ bản", medium: "Trung bình", advanced: "Nâng cao" });
  });
  it("formatAdminDate", () => {
    const now = new Date(2026, 0, 1, 0, 30);
    expect(a.formatAdminDate(new Date(2026, 0, 1, 0, 5).toISOString(), now)).toBe("Hôm nay, 00:05");
    expect(a.formatAdminDate(new Date(2025, 11, 31, 23, 59).toISOString(), now)).toBe("Hôm qua, 23:59");
    expect(a.formatAdminDate(new Date(2025, 11, 30, 10, 0).toISOString(), now)).toBe("30/12/2025");
    const mid = new Date(2026, 5, 15, 12, 0);
    expect(a.formatAdminDate(new Date(2026, 2, 4, 9, 0).toISOString(), mid)).toBe("04/03");
    expect(a.formatAdminDate("bad", mid)).toBe("");
  });
  it("formatSizeMB", () => {
    expect(a.formatSizeMB(1.2 * 1024 * 1024)).toBe("1,2 MB");
    expect(a.formatSizeMB(1.26 * 1024 * 1024)).toBe("1,3 MB");
    expect(a.formatSizeMB(0)).toBe("0 MB");
  });
});
