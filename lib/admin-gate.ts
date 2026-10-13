export type AdminGateDecision = "allow" | "loading" | "deny";

interface GateUser {
  id?: string;
  role?: string;
}

export const isAdminUser = (user: GateUser | null | undefined): boolean => user?.role?.trim().toLowerCase() === "admin";

/**
 * Decides what the admin gate renders.
 * - A current admin user is allowed (and becomes the verified user, even if it is another account).
 * - A current non-admin user is denied, and the verified latch must be cleared.
 * - No user while the profile is being re-checked keeps a verified admin mounted; with none it is loading.
 * - No user once the check finished (signed out or profile failed) is denied and the latch must be cleared.
 */
export function adminGateDecision(verified: GateUser | null, user: GateUser | null, ready: boolean): AdminGateDecision {
  if (user) return isAdminUser(user) ? "allow" : "deny";
  if (!ready) return verified ? "allow" : "loading";
  return "deny";
}
