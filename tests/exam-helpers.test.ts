import { describe, expect, it } from "vitest";
import {
  buildSubmitPayload,
  materialRouteSubject,
  optionIndex,
  summarizeAttempt,
  toRoomQuestions,
} from "../lib/exam-helpers";

describe("toRoomQuestions", () => {
  it("orders options by position and keeps the positions array", () => {
    const { questions, positions } = toRoomQuestions({
      questions: [
        {
          id: "q1",
          prompt: "P",
          options: [
            { position: 3, content: "d" },
            { position: 0, content: "a" },
            { position: 2, content: "c" },
          ],
        },
      ],
    });
    expect(questions).toEqual([{ id: "q1", prompt: "P", options: ["a", "c", "d"] }]);
    expect(positions).toEqual([[0, 2, 3]]);
  });
});

describe("buildSubmitPayload", () => {
  it("maps option index to real position and blanks to null", () => {
    const payload = buildSubmitPayload(
      [{ id: "a" }, { id: "b" }, { id: "c" }],
      [[0, 1, 2, 3], [0, 2, 3], [1, 3]],
      [2, 1, -1],
      61.9,
    );
    expect(payload).toEqual({
      answers: [
        { questionId: "a", selectedPosition: 2 },
        { questionId: "b", selectedPosition: 2 },
        { questionId: "c", selectedPosition: null },
      ],
      spentSec: 61,
    });
  });
  it("treats missing answers as blank and clamps negative time", () => {
    const p = buildSubmitPayload([{ id: "a" }], [[0, 1]], [], -5);
    expect(p.answers[0]!.selectedPosition).toBeNull();
    expect(p.spentSec).toBe(0);
  });
});

describe("summarizeAttempt", () => {
  it("counts correct, wrong, blank and accuracy over answered", () => {
    expect(
      summarizeAttempt([
        { isCorrect: true, selectedPosition: 0 },
        { isCorrect: false, selectedPosition: 1 },
        { isCorrect: false, selectedPosition: null },
        { isCorrect: true, selectedPosition: 2 },
      ]),
    ).toEqual({ correct: 2, wrong: 1, blank: 1, total: 4, accuracy: 67 });
    expect(summarizeAttempt([])).toMatchObject({ total: 0, accuracy: 0 });
  });
  it("optionIndex", () => {
    expect(optionIndex([{ position: 0 }, { position: 2 }], 2)).toBe(1);
    expect(optionIndex([{ position: 0 }], null)).toBe(-1);
    expect(optionIndex([{ position: 0 }], 3)).toBe(-1);
  });
});

describe("materialRouteSubject", () => {
  it("uses the static subject when present", () => {
    expect(materialRouteSubject("fptu", "fptu-prf192", { id: "x", code: "PRF192", name: "N" })).toEqual({
      id: "x",
      code: "PRF192",
      name: "N",
    });
  });
  it("falls back to the route code", () => {
    expect(materialRouteSubject("fptu", "fptu-eng302c-k3", undefined)).toEqual({
      id: "fptu-eng302c-k3",
      code: "ENG302C",
      name: "ENG302C",
    });
    expect(materialRouteSubject("fptu", "weird", null).code).toBe("WEIRD");
  });
});
