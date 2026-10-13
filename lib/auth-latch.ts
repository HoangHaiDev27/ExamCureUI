export type LatchDecision = "keep" | "adopt" | "account-changed" | "loading" | "signed-out";

/**
 * Decides what a latched gate renders. `kept` is the first user seen, `user` the current one.
 * A different user never replaces the kept one.
 */
export function latchDecision(
  kept: { id?: string } | null,
  user: { id?: string } | null,
  ready: boolean,
): LatchDecision {
  if (user) {
    if (!kept) return "adopt";
    return kept.id === user.id ? "keep" : "account-changed";
  }
  if (kept) return "keep";
  return ready ? "signed-out" : "loading";
}
