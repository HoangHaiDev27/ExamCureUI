import { useEffect, useState } from "react";
import {
  getSupabaseBrowserClient,
  isSupabaseBrowserConfigured,
} from "./supabase-browser";

/**
 * Trạng thái đăng nhập phía client (mock, lưu localStorage).
 * Phát sự kiện để mọi component (vd. SiteHeader) cập nhật tức thì.
 */
const KEY = "examcure:auth";
const EVENT = "examcure:auth-change";
/**
 * Cookie "gương" của role — chỉ để middleware.ts đọc được ở edge (middleware
 * không truy cập được localStorage). Không phải ranh giới bảo mật: cookie này
 * do JS phía client set, người dùng vẫn có thể tự sửa. Ranh giới bảo mật thật
 * là backend (requireSupabaseAdmin + RLS Postgres).
 */
const ROLE_COOKIE = "examcure_role";

function setRoleCookie(role: string | undefined): void {
  if (typeof document === "undefined") return;
  document.cookie = role
    ? `${ROLE_COOKIE}=${encodeURIComponent(role)}; path=/; max-age=2592000; samesite=lax`
    : `${ROLE_COOKIE}=; path=/; max-age=0; samesite=lax`;
}

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5010/api/v1";

export interface AuthUser {
  name: string;
  email?: string;
  avatarUrl?: string;
  token?: string;
  refreshToken?: string;
  role?: string;
  schoolId?: string;
}

export function getAuth(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function login(user: AuthUser): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(user));
    setRoleCookie(user.role || "student");
    window.dispatchEvent(new Event(EVENT));
  } catch {
    /* ignore */
  }
}

export function logout(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEY);
    setRoleCookie(undefined);
    window.dispatchEvent(new Event(EVENT));
    if (isSupabaseBrowserConfigured()) {
      void getSupabaseBrowserClient().auth.signOut();
    }
  } catch {
    /* ignore */
  }
}

/** Hook đọc trạng thái đăng nhập (chỉ dùng trong client component). */
export function useAuth(): AuthUser | null {
  const [user, setUser] = useState<AuthUser | null>(null);
  useEffect(() => {
    const sync = () => setUser(getAuth());
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

/** Chữ cái viết tắt từ tên (vd. "Nguyễn Minh Quân" → "MQ"). */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const pick = parts.slice(-2);
  return pick.map((w) => w.charAt(0).toUpperCase()).join("") || "U";
}

export async function loginAPI(email: string, password: string) {
  if (isSupabaseBrowserConfigured()) {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.session || !data.user) {
      throw new Error(error?.message || "Đăng nhập Supabase thất bại.");
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, school_id, role")
      .eq("id", data.user.id)
      .maybeSingle();
    return {
      fullName: profile?.full_name || data.user.user_metadata.full_name || email.split("@")[0],
      email: data.user.email || email,
      token: data.session.access_token,
      refreshToken: data.session.refresh_token,
      schoolId: profile?.school_id || data.user.user_metadata.school_id || "fptu",
      role: profile?.role || "student",
      avatarUrl:
        typeof data.user.user_metadata.avatar_url === "string"
          ? data.user.user_metadata.avatar_url
          : typeof data.user.user_metadata.picture === "string"
            ? data.user.user_metadata.picture
            : undefined,
    };
  }

  try {
    const res = await fetch(`${API_BASE_URL}/Auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.");
    }
    return await res.json();
  } catch (err) {
    if (err instanceof Error && (err instanceof TypeError || err.message?.includes("fetch"))) {
      console.warn("Backend offline. Đăng nhập bằng chế độ Mock.");
      let mockSchoolId = "fptu";
      try {
        const cachedReg = localStorage.getItem("examcure:mock-register");
        if (cachedReg) {
          const regData = JSON.parse(cachedReg);
          if (regData.email === email) {
            mockSchoolId = regData.schoolId || "fptu";
          }
        }
      } catch {}
      return {
        fullName: email.split("@")[0],
        email: email,
        token: "mock-token",
        schoolId: mockSchoolId,
        role: "student"
      };
    }
    throw err;
  }
}

export async function registerAPI(name: string, email: string, password: string, schoolId: string) {
  if (isSupabaseBrowserConfigured()) {
    const { data, error } = await getSupabaseBrowserClient().auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name, school_id: schoolId },
      },
    });
    if (error) throw new Error(error.message);
    return {
      success: true,
      message: data.session
        ? "Tài khoản đã được tạo."
        : "Vui lòng kiểm tra email để xác thực tài khoản.",
    };
  }

  try {
    const res = await fetch(`${API_BASE_URL}/Auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        email, 
        password, 
        fullName: name,
        mssv: "",
        schoolId: schoolId
      })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || "Đăng ký thất bại. Email có thể đã tồn tại.");
    }
    return await res.json();
  } catch (err) {
    if (err instanceof Error && (err instanceof TypeError || err.message?.includes("fetch"))) {
      console.warn("Backend offline. Đang đăng ký bằng chế độ Mock.");
      localStorage.setItem("examcure:mock-register", JSON.stringify({ email, schoolId, name }));
      return {
        success: true,
        message: "Mock registration successful"
      };
    }
    throw err;
  }
}

export async function googleLoginAPI(idToken: string) {
  const res = await fetch(`${API_BASE_URL}/Auth/google-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken })
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "Đăng nhập bằng Google thất bại.");
  }
  return await res.json();
}

export async function verifyOtpAPI(email: string, code: string) {
  if (isSupabaseBrowserConfigured()) {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "signup",
    });
    if (error || !data.session || !data.user) {
      throw new Error(error?.message || "Mã OTP Supabase không hợp lệ.");
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, school_id, role")
      .eq("id", data.user.id)
      .maybeSingle();
    return {
      fullName: profile?.full_name || data.user.user_metadata.full_name || email.split("@")[0],
      email: data.user.email || email,
      token: data.session.access_token,
      refreshToken: data.session.refresh_token,
      schoolId: profile?.school_id || data.user.user_metadata.school_id || "fptu",
      role: profile?.role || "student",
    };
  }

  const res = await fetch(`${API_BASE_URL}/Auth/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code })
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "Xác thực OTP thất bại.");
  }
  return await res.json();
}

export async function resendSignupOtpAPI(email: string) {
  if (isSupabaseBrowserConfigured()) {
    const { error } = await getSupabaseBrowserClient().auth.resend({
      type: "signup",
      email,
    });
    if (error) throw new Error(error.message);
    return;
  }

  // Giữ tương thích với backend cũ trong lúc Supabase chưa được cấu hình.
  const response = await fetch(`${API_BASE_URL}/Auth/resend-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  }).catch(() => null);
  if (response && !response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Không thể gửi lại mã OTP.");
  }
}

export async function requestPasswordResetAPI(email: string) {
  if (isSupabaseBrowserConfigured()) {
    const { error } = await getSupabaseBrowserClient().auth.resetPasswordForEmail(email);
    if (error) throw new Error(error.message);
    return;
  }

  const response = await fetch(`${API_BASE_URL}/Auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  }).catch(() => null);
  if (response && !response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Không thể gửi mã đặt lại mật khẩu.");
  }
}

export async function resetPasswordWithOtpAPI(
  email: string,
  code: string,
  password: string,
) {
  if (isSupabaseBrowserConfigured()) {
    const supabase = getSupabaseBrowserClient();
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "recovery",
    });
    if (verifyError) throw new Error(verifyError.message);

    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) throw new Error(updateError.message);
    await supabase.auth.signOut();
    return;
  }

  const response = await fetch(`${API_BASE_URL}/Auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code, newPassword: password }),
  }).catch(() => null);
  if (response && !response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Không thể đặt lại mật khẩu.");
  }
}

export async function signInWithGoogle(redirectTo = "/dashboard") {
  const supabase = getSupabaseBrowserClient();
  const destination = new URL(redirectTo, window.location.origin).toString();
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: destination },
  });
  if (error) throw new Error(error.message);
}

export async function authUserFromSupabaseSession() {
  if (!isSupabaseBrowserConfigured()) return null;
  const supabase = getSupabaseBrowserClient();
  const { data } = await supabase.auth.getSession();
  const session = data.session;
  if (!session) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, school_id, role")
    .eq("id", session.user.id)
    .maybeSingle();
  return {
    name:
      profile?.full_name ||
      session.user.user_metadata.full_name ||
      session.user.email?.split("@")[0] ||
      "Student",
    email: session.user.email,
    token: session.access_token,
    refreshToken: session.refresh_token,
    schoolId: profile?.school_id || session.user.user_metadata.school_id || "fptu",
    role: profile?.role || "student",
    avatarUrl:
      typeof session.user.user_metadata.avatar_url === "string"
        ? session.user.user_metadata.avatar_url
        : typeof session.user.user_metadata.picture === "string"
          ? session.user.user_metadata.picture
          : undefined,
  } satisfies AuthUser;
}
