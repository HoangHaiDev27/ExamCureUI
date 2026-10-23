import { describe, expect, it } from "vitest";
import type { CatalogSubject, SubjectMaterial } from "../lib/catalog";
import {
  dedupeMaterials,
  examHref,
  fileTypeLabel,
  materialUnit,
  materialBodyText,
  formatDate,
  groupByTerm,
  materialHref,
  resultHref,
  selectQuickAccess,
  trendDelta,
} from "../lib/dashboard-helpers";

const subj = (id: string, terms: number[], exams = 0): CatalogSubject => ({
  id,
  schoolCode: "fptu",
  code: id.toUpperCase(),
  name: id,
  description: null,
  faculty: null,
  terms,
  kind: null,
  durationMin: null,
  questionCount: null,
  difficulty: null,
  publishedExamCount: exams,
  lastScore: null,
});
const mat = (id: string, v: number): SubjectMaterial => ({
  id,
  title: id,
  description: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  version: {
    id: `${id}-v${v}`,
    version_number: v,
    original_filename: "a.pptx",
    size_bytes: 1,
    slide_count: 1,
    processed_at: null,
  },
});

describe("groupByTerm", () => {
  it("puts multi-term subjects in each group and separates untermed", () => {
    const { groups, untermed } = groupByTerm([
      subj("b", [3, 1]),
      subj("a", [1]),
      subj("z", []),
    ]);
    expect(groups.map((g) => [g.term, g.subjects.map((s) => s.id)])).toEqual([
      [1, ["a", "b"]],
      [3, ["b"]],
    ]);
    expect(untermed.map((s) => s.id)).toEqual(["z"]);
  });
});

describe("selectQuickAccess", () => {
  const all = [subj("a", [1], 0), subj("b", [1], 2), subj("c", [1], 1), subj("d", [1], 3)];
  it("recent attempts first, then subjects with exams, deduped and capped", () => {
    const r = selectQuickAccess(
      all,
      [{ subjectId: "c" }, { subjectId: "a" }, { subjectId: "c" }, { subjectId: "gone" }],
      4,
    );
    expect(r.map((s) => s.id)).toEqual(["c", "a", "b", "d"]);
    expect(selectQuickAccess(all, [], 2).map((s) => s.id)).toEqual(["b", "c"]);
  });
  it("is empty when nothing qualifies", () => {
    expect(selectQuickAccess([subj("a", [1], 0)], [])).toEqual([]);
  });
});

describe("dedupeMaterials", () => {
  it("keeps the highest version per material", () => {
    const r = dedupeMaterials([mat("m1", 1), mat("m2", 1), mat("m1", 3), mat("m1", 2)]);
    expect(r.map((m) => [m.id, m.version.version_number])).toEqual([
      ["m1", 3],
      ["m2", 1],
    ]);
  });
});

describe("misc helpers", () => {
  it("materialBodyText keeps content and only falls back when empty", () => {
    expect(materialBodyText("Nội dung", "a.docx")).toBe("Nội dung");
    expect(materialBodyText("Nội dung", "a.pptx")).toBe("Nội dung");
    expect(materialBodyText("", "a.docx")).toBe("Phần này không có text để hiển thị.");
    expect(materialBodyText("", "a.pptx")).toBe("Slide này không có text để hiển thị.");
  });
  it("materialUnit", () => {
    expect(materialUnit("a.DOCX")).toBe("phần");
    expect(materialUnit("a.pptx")).toBe("slide");
    expect(materialUnit("f")).toBe("slide");
  });
  it("fileTypeLabel", () => {
    expect(fileTypeLabel("Slide.final.pptx")).toBe("PPTX");
    expect(fileTypeLabel("noext")).toBe("FILE");
    expect(fileTypeLabel("trailing.")).toBe("FILE");
  });
  it("trendDelta", () => {
    expect(trendDelta([6.2])).toBeNull();
    expect(trendDelta([6, 7.4])).toBe(1.4);
    expect(trendDelta([8, 6.5])).toBe(-1.5);
  });
  it("formatDate", () => {
    expect(formatDate(new Date(2026, 0, 5).toISOString())).toBe("05/01/2026");
    expect(formatDate("x")).toBe("");
  });
  it("links", () => {
    expect(examHref("fptu", "ENG302c")).toBe("/exam/fptu/fptu-eng302c");
    expect(resultHref({ id: "a1", schoolCode: "fptu", subjectCode: "PRF192" })).toBe(
      "/exam/fptu/fptu-prf192/result?attempt=a1",
    );
    expect(resultHref({ id: "a1", schoolCode: null, subjectCode: "PRF192" })).toBeNull();
    expect(materialHref("fptu", "PRF192", "v1")).toBe(
      "/schools/fptu/subjects/fptu-prf192/materials/v1",
    );
  });
});
