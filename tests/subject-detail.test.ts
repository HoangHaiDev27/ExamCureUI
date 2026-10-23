import { describe, expect, it } from "vitest";
import { examRow, examStartHref, lookupSubject, termsLabel } from "../lib/subject-detail";

const base = { id: "e1", title: "Đề 1", durationMinutes: 45, questionCount: 30 };

describe("subject detail helpers", () => {
  it("lookupSubject returns a sentinel instead of null", () => {
    expect(lookupSubject([])).toEqual({ kind: "missing" });
    expect(lookupSubject(undefined)).toEqual({ kind: "missing" });
    expect(lookupSubject([{ id: "s" }, { id: "t" }])).toEqual({ kind: "ok", subject: { id: "s" } });
  });
  it("termsLabel", () => {
    expect(termsLabel([2, 1])).toBe("Kỳ 1, 2");
    expect(termsLabel([3, 3])).toBe("Kỳ 3");
    expect(termsLabel([])).toBe("");
    expect(termsLabel(undefined)).toBe("");
  });
  it("examStartHref opens the exact exam", () => {
    expect(examStartHref("fptu", "CSD201", "abc")).toBe("/exam/fptu/fptu-csd201?exam=abc");
  });
  it("examRow maps real fields", () => {
    expect(examRow({ ...base, difficulty: "medium", bestScore: 8, attemptCount: 2 }, 0)).toEqual({
      ...base,
      index: 1,
      difficulty: "Trung bình",
      bestScore: 8,
      attemptCount: 2,
      attemptsLabel: "Đã làm 2 lần",
    });
  });
  it("examRow tolerates an older backend and keeps a 0 score", () => {
    expect(examRow(base, 2)).toMatchObject({ index: 3, difficulty: null, bestScore: null, attemptCount: 0, attemptsLabel: "" });
    expect(examRow({ ...base, bestScore: 0, attemptCount: 1, difficulty: null }, 0)).toMatchObject({ bestScore: 0, difficulty: null });
  });
});
