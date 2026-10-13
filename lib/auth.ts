import { useEffect, useState } from "react";
const KEY = "examcure:profile",
  EVENT = "examcure:auth-change",
  SESSION_EVENT = "examcure:session-change";
let authReady = false,
  signingOut = false,
  authGeneration = 0,
  profileRevision = 0;
let accessToken = "",
  accessExpires = 0,
  refreshing: Promise<string> | null = null;
let authenticating: Promise<AuthUser & { fullName: string }> | null = null;
let currentProfile: AuthUser | null = null;
export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL?.trim() || "/api/v1"
).replace(/\/$/, "");
export interface AuthUser {
  id?: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  token?: string;
  role?: string;
  schoolId?: string;
}
type BackendUser = {
  id: string;
  fullName: string;
  email: string;
  schoolId: string;
  role: string;
  token?: string;
};
class AuthError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}
const notify = () => {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENT));
};
function cleanupLegacy() {
  try {
    localStorage.removeItem("examcure:auth");
    localStorage.removeItem("examcure:mock-register");
    localStorage.removeItem("examcure:supabase-auth");
    sessionStorage.removeItem("examcure:admin-bootstrap-token");
  } catch {}
  if (typeof document !== "undefined")
    document.cookie = "examcure_role=; path=/; max-age=0; samesite=lax";
}
function clearDisplay() {
  currentProfile = null;
  try {
    localStorage.removeItem(KEY);
  } catch {}
  cleanupLegacy();
  notify();
}
function rememberToken(token: string) {
  accessToken = token;
  try {
    accessExpires = JSON.parse(atob(token.split(".")[1]!)).exp * 1000;
  } catch {
    accessExpires = Date.now() + 60000;
  }
}
function fromBackend(user: BackendUser): AuthUser {
  return {
    id: user.id,
    name: user.fullName,
    email: user.email,
    schoolId: user.schoolId,
    role: normalizeRole(user.role),
    ...(user.token ? { token: user.token } : {}),
  };
}
async function request<T>(
  path: string,
  body?: unknown,
  token?: string,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: body === undefined ? "GET" : "POST",
    credentials: "include",
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
    headers: {
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok)
    throw new AuthError(
      response.status,
      data?.message || "Không thể kết nối tài khoản. Vui lòng thử lại.",
    );
  return data as T;
}
export function normalizeRole(role?: string): string | undefined {
  return role?.trim().toLowerCase() || undefined;
}
export function homeFor(role: string | undefined, fallback: string): string {
  return normalizeRole(role) === "admin" ? "/admin" : fallback;
}
export function adminLandingFor(
  role: string | undefined,
  pathname: string,
): string | null {
  return normalizeRole(role) === "admin" && pathname === "/dashboard"
    ? "/admin"
    : null;
}
export function initials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(-2)
      .map((w) => w.charAt(0).toUpperCase())
      .join("") || "U"
  );
}
// Stored profile is display data only. useAuth waits for a backend check before
// exposing it to protected pages; no token is persisted in browser storage.
export function getAuth(): AuthUser | null {
  if (typeof window === "undefined" || signingOut) return null;
  if (currentProfile) return currentProfile;
  try {
    const value = localStorage.getItem(KEY);
    return value ? (JSON.parse(value) as AuthUser) : null;
  } catch {
    return null;
  }
}
export function login(user: AuthUser): void {
  if (typeof window === "undefined" || signingOut) return;
  if (user.token) rememberToken(user.token);
  const { token, ...display } = user;
  void token;
  currentProfile = { ...display, role: normalizeRole(user.role) };
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify({ ...display, role: normalizeRole(user.role) }),
    );
  } catch {}
  cleanupLegacy();
  authReady = true;
  notify();
}
export function clearAuthCache(): void {
  authGeneration++;
  accessToken = "";
  accessExpires = 0;
  clearDisplay();
}
export function invalidateSession(): void {
  // A storage event must not write back to shared storage: two tabs would
  // otherwise remove/recreate each other's profile indefinitely.
  authGeneration++;
  accessToken = "";
  accessExpires = 0;
  currentProfile = null;
  markAuthPending();
}
export function markAuthReady(): void {
  authReady = true;
  notify();
}
export function markAuthPending(): void {
  authReady = false;
  notify();
}
export async function getAccessToken(forceRefresh = false): Promise<string> {
  if (authenticating) await authenticating;
  if (signingOut) throw new Error("Bạn cần đăng nhập để tiếp tục.");
  if (!forceRefresh && accessToken && accessExpires > Date.now() + 30000)
    return accessToken;
  const generation = authGeneration;
  let logoutPending = false;
  try {
    logoutPending = Boolean(localStorage.getItem("examcure:logout-pending"));
  } catch {
    /* Cookie auth still works if storage is unavailable. */
  }
  if (logoutPending) {
    await request<void>("/Auth/logout", {});
    try {
      localStorage.removeItem("examcure:logout-pending");
    } catch {}
    throw new AuthError(401, "Bạn cần đăng nhập để tiếp tục.");
  }
  refreshing ??= (async () => {
    const refresh = async () => {
      if (generation !== authGeneration || signingOut)
        throw new Error("Bạn cần đăng nhập để tiếp tục.");
      const user = await request<BackendUser>("/Auth/refresh", {});
      if (generation !== authGeneration || signingOut)
        throw new Error("Bạn cần đăng nhập để tiếp tục.");
      if (!user.token) throw new Error("Máy chủ không trả về phiên đăng nhập.");
      rememberToken(user.token);
      return user.token;
    };
    // HttpOnly cookies are shared across tabs; serialize rotation between tabs.
    return typeof navigator !== "undefined" && navigator.locks
      ? navigator.locks.request("examcure-refresh", refresh)
      : refresh();
  })().finally(() => {
    refreshing = null;
  });
  return refreshing;
}
export async function refreshAuthProfile(): Promise<AuthUser | null> {
  const revision = ++profileRevision,
    generation = authGeneration,
    current = () =>
      revision === profileRevision && generation === authGeneration;
  try {
    let token = await getAccessToken();
    let data: BackendUser;
    try {
      data = await request<BackendUser>("/Users/me", undefined, token);
    } catch (error) {
      if (!(error instanceof AuthError) || error.status !== 401) throw error;
      token = await getAccessToken(true);
      data = await request<BackendUser>("/Users/me", undefined, token);
    }
    if (!current()) return null;
    const user = fromBackend(data);
    login(user);
    return user;
  } catch (error) {
    if (current()) clearDisplay();
    if (error instanceof AuthError && error.status === 401) {
      if (current()) {
        accessToken = "";
        accessExpires = 0;
      }
      return null;
    }
    if (!current() || signingOut) return null;
    throw error;
  } finally {
    if (current()) markAuthReady();
  }
}
export async function logout(): Promise<void> {
  signingOut = true;
  authGeneration++;
  try {
    localStorage.setItem("examcure:logout-pending", "true");
  } catch {}
  clearDisplay();
  accessToken = "";
  accessExpires = 0;
  try {
    // Wait for an in-flight refresh before revoking its replacement cookie.
    await authenticating?.catch(() => undefined);
    await refreshing?.catch(() => undefined);
    const revoke = () => request<void>("/Auth/logout", {});
    if (typeof navigator !== "undefined" && navigator.locks)
      await navigator.locks.request("examcure-refresh", revoke);
    else await revoke();
    try {
      localStorage.removeItem("examcure:logout-pending");
    } catch {}
  } finally {
    signingOut = false;
    clearAuthCache();
    markAuthReady();
    if (typeof window !== "undefined")
      window.dispatchEvent(new Event(SESSION_EVENT));
  }
}
async function authenticate(path: string, body: unknown) {
  if (authenticating) throw new Error("Đăng nhập đang được xử lý.");
  const generation = ++authGeneration;
  profileRevision++;
  authenticating = (async () => {
    // An old refresh must finish before login sets a replacement cookie.
    await refreshing?.catch(() => undefined);
    const user = await request<BackendUser>(path, body);
    if (generation !== authGeneration || signingOut)
      throw new Error("Phiên đăng nhập đã thay đổi.");
    if (!user.token) throw new Error("Máy chủ không trả về phiên đăng nhập.");
    try {
      localStorage.removeItem("examcure:logout-pending");
    } catch {}
    const mapped = fromBackend(user);
    login(mapped);
    if (typeof window !== "undefined")
      window.dispatchEvent(new Event(SESSION_EVENT));
    return { ...mapped, fullName: mapped.name };
  })().finally(() => {
    authenticating = null;
  });
  return authenticating;
}
export function loginAPI(email: string, password: string) {
  return authenticate("/Auth/login", { email, password });
}
export async function registerAPI(
  name: string,
  email: string,
  password: string,
  schoolId: string,
) {
  await request("/Auth/register", {
    fullName: name,
    email,
    password,
    schoolId,
  });
  return { success: true, user: null as AuthUser | null };
}
export function verifyOtpAPI(email: string, code: string) {
  return authenticate("/Auth/verify-otp", { email, code });
}
export async function resendSignupOtpAPI(email: string) {
  await request("/Auth/resend-otp", { email });
}
export async function requestPasswordResetAPI(email: string) {
  await request("/Auth/forgot-password", { email });
}
export async function resetPasswordWithOtpAPI(
  email: string,
  code: string,
  password: string,
) {
  await request("/Auth/reset-password", { email, code, newPassword: password });
  clearAuthCache();
  markAuthReady();
  if (typeof window !== "undefined")
    window.dispatchEvent(new Event(SESSION_EVENT));
}
export async function signInWithGoogle(redirectTo = "/dashboard") {
  const destination = new URL(redirectTo, window.location.origin);
  if (destination.origin !== window.location.origin)
    throw new Error("Đường dẫn đăng nhập không hợp lệ.");
  const callback = new URL("/auth/callback", window.location.origin);
  callback.searchParams.set("next", destination.pathname + destination.search);
  const start = new URL(
    `${API_BASE_URL}/Auth/google/start`,
    window.location.origin,
  );
  start.searchParams.set("returnTo", callback.toString());
  window.location.assign(start.href);
}
export function useAuth(): AuthUser | null {
  const [user, setUser] = useState<AuthUser | null>(null);
  useEffect(() => {
    const sync = () => setUser(authReady ? getAuth() : null);
    sync();
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, []);
  return user;
}
export function useAuthReady(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const sync = () => setReady(authReady);
    sync();
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, []);
  return ready;
}
