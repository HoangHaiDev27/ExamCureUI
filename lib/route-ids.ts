/** Pure route-id helpers; safe to import from server components. */
export function subjectRouteId(schoolId: string, code: string): string {
  return `${schoolId}-${code.toLowerCase()}`;
}

export function codeFromRouteId(schoolId: string, routeId: string): string | null {
  const prefix = `${schoolId}-`;
  if (!routeId.toLowerCase().startsWith(prefix.toLowerCase())) return null;
  const code = routeId.slice(prefix.length).replace(/-k\d+$/i, "");
  return code || null;
}

/** Subject used by the uploaded-material viewer when the static catalog has no such subject. */
export function materialRouteSubject(
  schoolId: string,
  subjectId: string,
  found: { id: string; code: string; name: string } | undefined | null,
): { id: string; code: string; name: string } {
  if (found) return { id: found.id, code: found.code, name: found.name };
  const code = (codeFromRouteId(schoolId, subjectId) ?? subjectId).toUpperCase();
  return { id: subjectId, code, name: code };
}
