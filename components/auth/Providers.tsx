"use client";

import { useEffect } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { authUserFromSupabaseSession, login, useAuth } from "@/lib/auth";
import { getSchool } from "@/lib/schools";
import { AuthModalProvider } from "./AuthModalProvider";
import {
  getSupabaseBrowserClient,
  isSupabaseBrowserConfigured,
} from "@/lib/supabase-browser";

export function Providers({ children }: { children: React.ReactNode }) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim();
  const user = useAuth();
  const schoolId = user?.schoolId;

  useEffect(() => {
    if (!isSupabaseBrowserConfigured()) return;
    const supabase = getSupabaseBrowserClient();
    const sync = async () => {
      const current = await authUserFromSupabaseSession();
      if (current) login(current);
    };
    void sync();
    const { data } = supabase.auth.onAuthStateChange(() => {
      void sync();
    });
    return () => data.subscription.unsubscribe();
  }, []);

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

  const content = <AuthModalProvider>{children}</AuthModalProvider>;
  // Supabase OAuth redirects through Supabase and does not need this browser SDK.
  // The provider is only needed for the legacy backend Google-token flow.
  return clientId ? <GoogleOAuthProvider clientId={clientId}>{content}</GoogleOAuthProvider> : content;
}
