"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { refreshAuthProfile, homeFor } from "@/lib/auth";
export default function AuthCallback() {
  const router = useRouter(),
    started = useRef(false),
    [error, setError] = useState("");
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const params = new URLSearchParams(window.location.search);
    const finish = async () => {
      if (params.has("error"))
        throw new Error("Đăng nhập Google chưa hoàn tất. Vui lòng thử lại.");
      const user = await refreshAuthProfile();
      if (!user)
        throw new Error(
          "Không thể khôi phục phiên đăng nhập. Vui lòng thử lại.",
        );
      const candidate = params.get("next") || "/dashboard",
        url = new URL(candidate, window.location.origin);
      const next =
        url.origin === window.location.origin &&
        url.pathname !== "/auth/callback"
          ? url.pathname + url.search
          : "/dashboard";
      router.replace(next === "/dashboard" ? homeFor(user.role, next) : next);
    };
    void finish().catch((reason) =>
      setError(
        reason instanceof Error ? reason.message : "Đăng nhập thất bại.",
      ),
    );
  }, [router]);
  return (
    <main className="mx-auto max-w-lg px-6 py-20 text-center">
      <p role="status">{error || "Đang hoàn tất đăng nhập..."}</p>
      {error && (
        <Link href="/" className="mt-4 inline-block underline">
          Quay lại trang chủ
        </Link>
      )}
    </main>
  );
}
