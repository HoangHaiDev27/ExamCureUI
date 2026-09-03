"use client";

import { useGoogleLogin } from "@react-oauth/google";
import { useRouter } from "next/navigation";
import { googleLoginAPI, login as localLogin, signInWithGoogle } from "@/lib/auth";
import { STUDENT } from "@/lib/student";
import { useState } from "react";
import { isSupabaseBrowserConfigured } from "@/lib/supabase-browser";

/** Hàng đăng nhập mạng xã hội + dải phân cách "hoặc". */
export function SocialAuth({
  verb = "Đăng nhập",
  redirectTo,
  onSuccess,
}: {
  verb?: string;
  redirectTo?: string;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const [error, setError] = useState("");

  const handleGoogle = async () => {
    if (isSupabaseBrowserConfigured()) {
      try {
        setError("");
        await signInWithGoogle(redirectTo ?? "/dashboard");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Đăng nhập Google thất bại.");
      }
      return;
    }
    loginGoogle();
  };

  const loginGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setError("");
        // useGoogleLogin trả về access_token, ta gửi cái này cho backend
        if (tokenResponse.access_token) {
          const data = await googleLoginAPI(tokenResponse.access_token);
          localLogin({
            name: data.fullName || data.email || STUDENT.name,
            email: data.email,
            token: data.token,
            refreshToken: data.refreshToken,
            role: data.role
          });
          onSuccess?.();
          router.push(redirectTo ?? "/dashboard");
        }
      } catch (err) {
        const error = err as Error;
        setError(error.message || "Đăng nhập bằng Google thất bại.");
      }
    },
    onError: () => {
      setError("Quá trình đăng nhập Google bị hủy hoặc có lỗi.");
    }
  });

  return (
    <div>
      {error && <div className="mb-4 rounded-md bg-danger/10 p-3 text-sm text-danger">{error}</div>}
      <div className="flex flex-col gap-2.5">
        <SocialButton label={`${verb} với Google`} onClick={() => void handleGoogle()}>
          <GoogleIcon />
        </SocialButton>
      </div>

      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-line" />
        <span className="text-[13px] text-ink-3">hoặc</span>
        <span className="h-px flex-1 bg-line" />
      </div>
    </div>
  );
}

function SocialButton({
  label,
  children,
  onClick
}: {
  label: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-[46px] w-full items-center justify-center gap-3 rounded-[8px] border border-line bg-paper text-[14px] font-semibold text-ink transition-all hover:border-line-strong hover:bg-paper-2 hover:shadow-sm"
    >
      {children}
      <span className="truncate">{label}</span>
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden className="shrink-0">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}
