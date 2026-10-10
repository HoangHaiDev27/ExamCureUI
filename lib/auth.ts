import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseBrowserClient, isSupabaseBrowserConfigured } from "./supabase-browser";

// Supabase owns the session. This cache only supplies display data to components.
const KEY = "examcure:supabase-auth";
const EVENT = "examcure:auth-change";
const ROLE_COOKIE = "examcure_role";
let authReady = false;
let signingOut = false;
let recoveringPassword = false;
let authGeneration = 0;
let profileRevision = 0;
let refreshing: Promise<string> | null = null;

export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:5010/api/v1"
).replace(/\/$/, "");

export interface AuthUser {
  id?: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  token?: string;
  refreshToken?: string;
  role?: string;
  schoolId?: string;
}

function clearLegacyRoleCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${ROLE_COOKIE}=; path=/; max-age=0; samesite=lax`;
}

export function normalizeRole(role?: string): string | undefined {
  return role?.trim().toLowerCase() || undefined;
}

export function homeFor(role: string | undefined, fallback: string): string {
  return normalizeRole(role) === "admin" ? "/admin" : fallback;
}

export function getAuth(): AuthUser | null {
  if (typeof window === "undefined" || signingOut || recoveringPassword || !isSupabaseBrowserConfigured()) return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const user = JSON.parse(raw) as AuthUser;
    return { ...user, role: normalizeRole(user.role) };
  } catch { return null; }
}

export function login(user: AuthUser): void {
  if (typeof window === "undefined" || signingOut || recoveringPassword) return;
  const role = normalizeRole(user.role);
  try {
    // Refresh tokens stay in the Supabase SDK's session store.
    const { refreshToken: _refreshToken, ...displayUser } = user;
    void _refreshToken;
    localStorage.setItem(KEY, JSON.stringify({ ...displayUser, role }));
    localStorage.removeItem("examcure:auth");
    localStorage.removeItem("examcure:mock-register");
    sessionStorage.removeItem("examcure:admin-bootstrap-token");
  } catch { /* Storage may be unavailable. */ }
  clearLegacyRoleCookie();
  window.dispatchEvent(new Event(EVENT));
}

export function clearAuthCache(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem("examcure:auth");
    localStorage.removeItem("examcure:mock-register");
    sessionStorage.removeItem("examcure:admin-bootstrap-token");
  } catch { /* Storage may be unavailable. */ }
  clearLegacyRoleCookie();
  window.dispatchEvent(new Event(EVENT));
}

// Invalidates profile reads started before a sign-out in this or another tab.
export function handleSupabaseSignOut(): void {
  authGeneration += 1;
  clearAuthCache();
}

export function markAuthReady(): void {
  authReady = true;
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENT));
}

export function markAuthPending(): void {
  authReady = false;
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENT));
}

// Refresh role from the database without replacing the SDK session. A late
// response must never restore a profile after sign-out or a newer profile read.
export async function refreshAuthProfile(): Promise<AuthUser | null> {
  const revision = ++profileRevision;
  const generation = authGeneration;
  const current = () => revision === profileRevision && generation === authGeneration;
  try {
    const user = await authUserFromSupabaseSession();
    if (!current()) return null;
    if (user) login(user);
    else clearAuthCache();
    return user;
  } catch (error) {
    if (current()) clearAuthCache();
    throw error;
  } finally {
    if (current()) markAuthReady();
  }
}

// Only the post-login dashboard landing redirects admins. Recovery and public
// pages remain accessible, regardless of a previously cached role cookie.
export function adminLandingFor(role: string | undefined, pathname: string): string | null {
  return normalizeRole(role) === "admin" && pathname === "/dashboard" ? "/admin" : null;
}

export async function logout(): Promise<void> {
  signingOut = true;
  authGeneration += 1;
  clearAuthCache();
  try {
    sessionStorage.removeItem("examcure:admin-bootstrap-token");
    if (isSupabaseBrowserConfigured()) {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.signOut({ scope: "local" });
      if (error) {
        // The SDK removes its local session even if remote revocation fails.
        const remaining = await supabase.auth.getSession();
        if (remaining.error || remaining.data.session) throw error;
      }
    }
  } finally {
    signingOut = false;
    clearAuthCache();
  }
}

export function useAuth(): AuthUser | null {
  const [user, setUser] = useState<AuthUser | null>(null);
  useEffect(() => {
    const sync = () => setUser(authReady ? getAuth() : null);
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
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

export function initials(name: string): string {
  return name.trim().split(/\s+/).slice(-2).map((word) => word.charAt(0).toUpperCase()).join("") || "U";
}

async function userFromSession(session: Session): Promise<AuthUser> {
  const { data: profile, error } = await getSupabaseBrowserClient()
    .from("profiles").select("full_name, school_id, role").eq("id", session.user.id).maybeSingle();
  if (error) throw new Error("Không thể tải hồ sơ tài khoản. Vui lòng thử lại.");
  const metadata = session.user.user_metadata;
  return {
    id: session.user.id,
    name: profile?.full_name || metadata.full_name || session.user.email?.split("@")[0] || "Student",
    email: session.user.email,
    token: session.access_token,
    schoolId: profile?.school_id || metadata.school_id || "fptu",
    role: profile?.role || "student",
    avatarUrl: typeof metadata.avatar_url === "string"
      ? metadata.avatar_url
      : typeof metadata.picture === "string" ? metadata.picture : undefined,
  };
}

export async function authUserFromSupabaseSession(): Promise<AuthUser | null> {
  if (!isSupabaseBrowserConfigured() || signingOut || recoveringPassword) return null;
  const generation = authGeneration;
  const { data, error } = await getSupabaseBrowserClient().auth.getSession();
  if (error) throw error;
  if (!data.session) return null;
  const user = await userFromSession(data.session);
  return generation === authGeneration && !signingOut && !recoveringPassword ? user : null;
}

// Every authenticated backend request reads the SDK session, never a cached JWT.
export async function getAccessToken(forceRefresh = false): Promise<string> {
  if (signingOut || recoveringPassword) throw new Error("Bạn cần đăng nhập để tiếp tục.");
  const generation = authGeneration;
  const supabase = getSupabaseBrowserClient();
  let token: string;
  if (forceRefresh) {
    refreshing ??= supabase.auth.refreshSession().then(({ data, error }) => {
      if (error || !data.session) throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      return data.session.access_token;
    }).finally(() => { refreshing = null; });
    token = await refreshing;
  } else {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) {
      clearAuthCache();
      throw new Error("Bạn cần đăng nhập để tiếp tục.");
    }
    token = data.session.access_token;
  }
  if (generation !== authGeneration || signingOut || recoveringPassword) throw new Error("Bạn cần đăng nhập để tiếp tục.");
  return token;
}

export async function loginAPI(email: string, password: string) {
  const { data, error } = await getSupabaseBrowserClient().auth.signInWithPassword({ email, password });
  if (error || !data.session) throw new Error(error?.message || "Đăng nhập thất bại.");
  const user = await userFromSession(data.session);
  return { ...user, fullName: user.name };
}

export async function registerAPI(name: string, email: string, password: string, schoolId: string) {
  const { data, error } = await getSupabaseBrowserClient().auth.signUp({
    email, password, options: { data: { full_name: name, school_id: schoolId } },
  });
  if (error) throw error;
  const user = data.session ? await userFromSession(data.session) : null;
  return { success: true, user };
}

export async function verifyOtpAPI(email: string, code: string) {
  const { data, error } = await getSupabaseBrowserClient().auth.verifyOtp({ email, token: code, type: "signup" });
  if (error || !data.session) throw new Error(error?.message || "Mã OTP không hợp lệ.");
  const user = await userFromSession(data.session);
  return { ...user, fullName: user.name };
}

export async function resendSignupOtpAPI(email: string) {
  const { error } = await getSupabaseBrowserClient().auth.resend({ type: "signup", email });
  if (error) throw error;
}

export async function requestPasswordResetAPI(email: string) {
  const { error } = await getSupabaseBrowserClient().auth.resetPasswordForEmail(email);
  if (error) throw error;
}

export async function resetPasswordWithOtpAPI(email: string, code: string, password: string) {
  const supabase = getSupabaseBrowserClient();
  recoveringPassword = true;
  authGeneration += 1;
  let verified = false;
  try {
    const { error: verifyError } = await supabase.auth.verifyOtp({ email, token: code, type: "recovery" });
    if (verifyError) throw verifyError;
    verified = true;
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  } finally {
    // A recovery session must not redirect an admin away from the reset form,
    // or remain an application login if updating the password fails.
    try { if (verified) await logout(); }
    finally { recoveringPassword = false; }
  }
}

export async function signInWithGoogle(redirectTo = "/dashboard") {
  const destination = new URL(redirectTo, window.location.origin);
  if (destination.origin !== window.location.origin) throw new Error("Đường dẫn đăng nhập không hợp lệ.");
  const { error } = await getSupabaseBrowserClient().auth.signInWithOAuth({
    provider: "google", options: { redirectTo: destination.toString() },
  });
  if (error) throw error;
}
