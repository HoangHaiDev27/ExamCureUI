"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { adminLandingFor, handleSupabaseSignOut, markAuthPending, markAuthReady, refreshAuthProfile, useAuth } from "@/lib/auth";
import { getSchool } from "@/lib/schools";
import { AuthModalProvider } from "./AuthModalProvider";
import {
  getSupabaseBrowserClient,
  isSupabaseBrowserConfigured,
} from "@/lib/supabase-browser";

export function Providers({ children }: { children: React.ReactNode }) {
  const [authError, setAuthError] = useState(false);
  const user = useAuth();
  const schoolId = user?.schoolId;

  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    let disposed = false;
    let revision = 0;
    const sync = async () => {
      const currentRevision = ++revision;
      try {
        const current = await refreshAuthProfile();
        if (disposed || currentRevision !== revision) return;
        const destination = adminLandingFor(current?.role, pathname);
        if (destination) router.replace(destination);
        setAuthError(false);
      } catch {
        if (disposed || currentRevision !== revision) return;
        setAuthError(true);
      }
    };
    markAuthPending();
    void sync();
    if (!isSupabaseBrowserConfigured()) return () => { disposed = true; };
    // Defer SDK calls until its auth-state callback has released the session lock.
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const syncVisible = () => {
      if (document.visibilityState === "visible") void sync();
    };
    window.addEventListener("focus", syncVisible);
    window.addEventListener("online", syncVisible);
    document.addEventListener("visibilitychange", syncVisible);
    const interval = window.setInterval(syncVisible, 30_000);
    const { data } = getSupabaseBrowserClient().auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        revision += 1;
        handleSupabaseSignOut();
        markAuthReady();
        return;
      }
      const timer = setTimeout(() => {
        timers.delete(timer);
        void sync();
      }, 0);
      timers.add(timer);
    });
    return () => {
      disposed = true;
      window.clearInterval(interval);
      window.removeEventListener("focus", syncVisible);
      window.removeEventListener("online", syncVisible);
      document.removeEventListener("visibilitychange", syncVisible);
      for (const timer of timers) clearTimeout(timer);
      data.subscription.unsubscribe();
    };
  }, [pathname, router]);

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
    <AuthModalProvider>
      {authError && (
        <div role="alert" className="border-b border-danger/25 bg-danger-soft px-5 py-3 text-center text-[13px] text-danger">
          Không thể khôi phục phiên đăng nhập. <button onClick={() => window.location.reload()} className="font-semibold underline">Tải lại trang</button>
        </div>
      )}
      {children}
    </AuthModalProvider>
  );
}
