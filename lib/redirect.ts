/** Accepts only same-origin absolute paths; anything else falls back. */
export function safeRedirect(value: unknown, fallback = "/dashboard"): string {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\")
    ? value
    : fallback;
}
