import { useEffect, useState } from "react";

/**
 * Trạng thái đăng nhập phía client (mock, lưu localStorage).
 * Phát sự kiện để mọi component (vd. SiteHeader) cập nhật tức thì.
 */
const KEY = "examcure:auth";
const EVENT = "examcure:auth-change";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5010/api/v1";

export interface AuthUser {
  name: string;
  email?: string;
  token?: string;
  refreshToken?: string;
  role?: string;
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
    window.dispatchEvent(new Event(EVENT));
  } catch {
    /* ignore */
  }
}

export function logout(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEY);
    window.dispatchEvent(new Event(EVENT));
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
}

export async function registerAPI(name: string, email: string, password: string) {
  const res = await fetch(`${API_BASE_URL}/Auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      email, 
      password, 
      fullName: name,
      mssv: "",
      schoolId: ""
    })
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "Đăng ký thất bại. Email có thể đã tồn tại.");
  }
  return await res.json();
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
