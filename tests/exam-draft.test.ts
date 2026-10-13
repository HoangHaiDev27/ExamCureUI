import { describe, expect, it } from "vitest";
import {
  clearDraft,
  draftKey,
  loadDraft,
  newDraft,
  parseDraft,
  remainingSec,
  saveDraft,
} from "../lib/exam-draft";

const memory = () => {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
    m,
  };
};

describe("exam draft", () => {
  it("builds the storage key", () => {
    expect(draftKey("u1", "e1")).toBe("examcure:exam-draft:u1:e1");
  });

  it("round-trips through storage and clears", () => {
    const store = memory();
    const d = newDraft(3, 1000, "cid");
    d.answers[1] = 2;
    d.flagged[0] = true;
    saveDraft("u", "e", d, store);
    expect(loadDraft("u", "e", 3, store)).toEqual(d);
    expect(loadDraft("other", "e", 3, store)).toBeNull();
    clearDraft("u", "e", store);
    expect(loadDraft("u", "e", 3, store)).toBeNull();
  });

  it("rejects drafts that do not match the exam", () => {
    const d = newDraft(3, 1000, "cid");
    const raw = JSON.stringify(d);
    expect(parseDraft(raw, 4)).toBeNull();
    expect(parseDraft("not json", 3)).toBeNull();
    expect(parseDraft(null, 3)).toBeNull();
    expect(parseDraft(JSON.stringify({ ...d, answers: [0, 9, 1] }), 3)).toBeNull();
    expect(parseDraft(JSON.stringify({ ...d, clientAttemptId: "" }), 3)).toBeNull();
    expect(parseDraft(raw, 3)).toEqual(d);
  });

  it("never throws when storage fails", () => {
    const broken = {
      getItem: () => { throw new Error("denied"); },
      setItem: () => { throw new Error("full"); },
      removeItem: () => { throw new Error("denied"); },
    };
    expect(loadDraft("u", "e", 1, broken)).toBeNull();
    expect(() => saveDraft("u", "e", newDraft(1, 0, "c"), broken)).not.toThrow();
    expect(() => clearDraft("u", "e", broken)).not.toThrow();
    expect(loadDraft("u", "e", 1, null)).toBeNull();
  });
});

describe("remainingSec", () => {
  it("counts down from the start time", () => {
    expect(remainingSec(0, 600, 0)).toBe(600);
    expect(remainingSec(0, 600, 59_999)).toBe(541);
    expect(remainingSec(0, 600, 300_000)).toBe(300);
  });
  it("is 0 once expired and tolerates clock skew", () => {
    expect(remainingSec(0, 600, 600_000)).toBe(0);
    expect(remainingSec(0, 600, 9_999_999)).toBe(0);
    expect(remainingSec(5_000, 600, 1_000)).toBe(600);
  });
});
