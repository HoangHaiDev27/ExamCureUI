import { describe, expect, it } from "vitest";
import { adminGateDecision } from "../lib/admin-gate";

const admin = { id: "a", role: "admin" };
const otherAdmin = { id: "b", role: "Admin" };
const student = { id: "a", role: "student" };

describe("adminGateDecision", () => {
  it("allows a current admin, including another admin account", () => {
    expect(adminGateDecision(null, admin, true)).toBe("allow");
    expect(adminGateDecision(admin, admin, false)).toBe("allow");
    expect(adminGateDecision(admin, otherAdmin, true)).toBe("allow");
  });
  it("denies a current non-admin, including an admin demoted to student", () => {
    expect(adminGateDecision(null, student, true)).toBe("deny");
    expect(adminGateDecision(admin, student, true)).toBe("deny");
    expect(adminGateDecision(admin, { id: "c" }, true)).toBe("deny");
  });
  it("keeps a verified admin mounted while the profile is re-checked", () => {
    expect(adminGateDecision(admin, null, false)).toBe("allow");
  });
  it("is loading before anything was verified", () => {
    expect(adminGateDecision(null, null, false)).toBe("loading");
  });
  it("denies once the check finished without a user", () => {
    expect(adminGateDecision(null, null, true)).toBe("deny");
    expect(adminGateDecision(admin, null, true)).toBe("deny");
  });
});
