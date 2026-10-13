import { describe, expect, it } from "vitest";
import {
  clearDraft, draftKey, loadDraft, newStored, parseDraft, remainingSec,
  restoreState, saveDraft, snapshotState,
} from "../lib/exam-draft";
import { latchDecision } from "../lib/auth-latch";
import { safeRedirect } from "../lib/redirect";

const memory = () => {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
  };
};
const ids = ["a", "b", "c"];
const pos = [[0, 1, 2, 3], [0, 2, 3], [1, 3]];

describe("exam draft", () => {
  it("builds the key and round-trips", () => {
    expect(draftKey("u1", "e1")).toBe("examcure:exam-draft:u1:e1");
    const store = memory();
    const d = snapshotState(newStored(1000, "cid"), ids, pos, [2, 1, -1], [true, false, false]);
    expect(d.answers).toEqual({ a: 2, b: 2, c: null });
    saveDraft("u", "e", d, store);
    expect(loadDraft("u", "e", store)).toEqual(d);
    expect(loadDraft("other", "e", store)).toBeNull();
    clearDraft("u", "e", store);
    expect(loadDraft("u", "e", store)).toBeNull();
  });
  it("restores by id when the question set changed, keeping timer and key", () => {
    const d = snapshotState(newStored(1000, "cid"), ids, pos, [2, 1, 0], [true, true, false]);
    const r = restoreState(d, ["c", "z", "a"], [[1, 3], [0, 1], [0, 1, 2, 3]]);
    expect(r).toEqual({ answers: [0, -1, 2], flagged: [false, false, true] });
    expect(d.startedAt).toBe(1000);
    expect(d.clientAttemptId).toBe("cid");
    expect(restoreState(d, ["x", "y", "w"], pos).answers).toEqual([-1, -1, -1]);
  });
  it("rejects garbage", () => {
    expect(parseDraft(null)).toBeNull();
    expect(parseDraft("nope")).toBeNull();
    expect(parseDraft(JSON.stringify({ answers: [1], flagged: [], startedAt: 1, clientAttemptId: "c" }))).toBeNull();
    expect(parseDraft(JSON.stringify({ answers: {}, flagged: [], startedAt: 1, clientAttemptId: "" }))).toBeNull();
    expect(parseDraft(JSON.stringify({ answers: { a: 9, b: 1 }, flagged: [1, "q"], startedAt: 1, clientAttemptId: "c" }))).toEqual({
      answers: { b: 1 }, flagged: ["q"], startedAt: 1, clientAttemptId: "c",
    });
  });
  it("never throws when storage fails", () => {
    const broken = {
      getItem: () => { throw new Error("x"); },
      setItem: () => { throw new Error("x"); },
      removeItem: () => { throw new Error("x"); },
    };
    expect(loadDraft("u", "e", broken)).toBeNull();
    expect(() => saveDraft("u", "e", newStored(0, "c"), broken)).not.toThrow();
    expect(() => clearDraft("u", "e", broken)).not.toThrow();
  });
});

describe("remainingSec", () => {
  it("counts down, expires and tolerates skew", () => {
    expect(remainingSec(0, 600, 0)).toBe(600);
    expect(remainingSec(0, 600, 59_999)).toBe(541);
    expect(remainingSec(0, 600, 600_000)).toBe(0);
    expect(remainingSec(5_000, 600, 1_000)).toBe(600);
  });
});

describe("latchDecision", () => {
  it("covers every state", () => {
    expect(latchDecision(null, { id: "a" }, true)).toBe("adopt");
    expect(latchDecision({ id: "a" }, { id: "a" }, true)).toBe("keep");
    expect(latchDecision({ id: "a" }, { id: "b" }, true)).toBe("account-changed");
    expect(latchDecision({ id: "a" }, null, true)).toBe("keep");
    expect(latchDecision(null, null, false)).toBe("loading");
    expect(latchDecision(null, null, true)).toBe("signed-out");
  });
});

describe("safeRedirect", () => {
  it("allows only same-origin paths", () => {
    expect(safeRedirect("/exam/x?exam=1")).toBe("/exam/x?exam=1");
    for (const bad of ["//evil.com", "/\\evil.com", "https://evil.com", "javascript:1", "", undefined, 5])
      expect(safeRedirect(bad)).toBe("/dashboard");
    expect(safeRedirect("x", "/")).toBe("/");
  });
});
