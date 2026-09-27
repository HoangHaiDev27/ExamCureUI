"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { getAuth, homeFor, syncRoleCookie, useAuth } from "@/lib/auth";
import { getSchool } from "@/lib/schools";

export function Providers({ children }: { children: React.ReactNode }) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "238495034-dummy.apps.googleusercontent.com";
  const user = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  // Khu quản trị dùng màu gốc của ExamCure, không đổi theo trường.
  const schoolId = user?.role === "Admin" ? undefined : user?.schoolId;
  const isAdmin = user?.role === "Admin";

  // Phiên đăng nhập có từ trước khi có cookie role → ghi bù để proxy.ts nhận ra.
  // Nếu admin vẫn đang ở trang người dùng (trang đã tải trước khi có cookie) thì đưa về /admin.
  useEffect(() => {
    syncRoleCookie(getAuth()?.role);
    if (isAdmin && !pathname.startsWith("/admin")) router.replace(homeFor("Admin"));
  }, [isAdmin, pathname, router]);

  useEffect(() => {
    if (!schoolId) {
      // Revert to original CSS variables if not logged in
      document.documentElement.style.removeProperty("--color-orange");
      document.documentElement.style.removeProperty("--color-orange-dark");
      document.documentElement.style.removeProperty("--color-orange-soft");
      document.documentElement.style.removeProperty("--color-orange-border");
      return;
    }

    const school = getSchool(schoolId);
    if (school) {
      document.documentElement.style.setProperty("--color-orange", school.theme.brand);
      document.documentElement.style.setProperty("--color-orange-dark", school.theme.brandDark);
      document.documentElement.style.setProperty("--color-orange-soft", school.theme.tint);
      document.documentElement.style.setProperty("--color-orange-border", `${school.theme.brand}30`);
    }
  }, [schoolId]);

  return (
    <GoogleOAuthProvider clientId={clientId}>
      {children}
    </GoogleOAuthProvider>
  );
}
