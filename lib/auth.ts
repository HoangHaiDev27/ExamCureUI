import { useEffect, useState } from "react";

/**
 * Trạng thái đăng nhập phía client (mock, lưu localStorage).
 * Phát sự kiện để mọi component (vd. SiteHeader) cập nhật tức thì.
 */
const KEY = "examcure:auth";
const EVENT = "examcure:auth-change";

export interface AuthUser {
  name: string;
  email?: string;
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
