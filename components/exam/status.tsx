"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Logo } from "@/components/Logo";
import { useAuthModal } from "@/components/auth/AuthModalProvider";
import { useAuth, useAuthReady } from "@/lib/auth";
import { latchDecision } from "@/lib/auth-latch";
import type { AuthUser } from "@/lib/auth";

export function StatusCard({
  title,
  children,
  actions,
  tone = "default",
}: {
  title: string;
  children?: ReactNode;
  actions?: ReactNode;
  tone?: "default" | "danger";
}) {
  return (
    <div className="grid min-h-[100dvh] place-items-center bg-paper-2 p-6">
      <div
        role={tone === "danger" ? "alert" : "status"}
        className="w-full max-w-sm rounded-[14px] border border-line bg-paper p-8 text-center shadow-[var(--shadow-1)]"
      >
        <Logo size={26} />
        <h1 className={`mt-4 font-display text-[20px] font-semibold ${tone === "danger" ? "text-danger" : "text-ink"}`}>{title}</h1>
        {children && <div className="mt-1.5 text-[14px] text-ink-2">{children}</div>}
        {actions && <div className="mt-5 flex flex-wrap items-center justify-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export const primaryAction =
  "inline-flex h-10 items-center rounded-[7px] bg-orange px-5 text-[13.5px] font-semibold text-white hover:bg-orange-dark";
export const secondaryAction =
  "inline-flex h-10 items-center rounded-[7px] border border-line bg-paper px-4 text-[13.5px] font-semibold text-ink-2 hover:bg-paper-2";

export function LoadingCard({ label = "Đang tải…" }: { label?: string }) {
  return <StatusCard title={label} />;
}

export function ErrorCard({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <StatusCard
      tone="danger"
      title="Có lỗi xảy ra"
      actions={
        <>
          <button type="button" onClick={onRetry} className={primaryAction}>Thử lại</button>
          <Link href="/dashboard" className={secondaryAction}>Về bảng điều khiển</Link>
        </>
      }
    >
      {message}
    </StatusCard>
  );
}

/**
 * Renders children for a signed-in user; otherwise loading or the sign-in prompt.
 * With `latch`, once a user was seen the children stay mounted through later
 * transient auth changes (token refresh failures, other tabs), so in-progress work is never unmounted.
 */
export function RequireUser({
  children,
  latch = false,
}: {
  children: (user: AuthUser) => ReactNode;
  latch?: boolean;
}) {
  const user = useAuth();
  const ready = useAuthReady();
  const { openAuth } = useAuthModal();
  const [kept, setKept] = useState<AuthUser | null>(null);
  const decision = latch ? latchDecision(kept, user, ready) : user ? "keep" : ready ? "signed-out" : "loading";
  if (decision === "adopt" && user) setKept(user);
  if (decision === "account-changed")
    return (
      <StatusCard
        tone="danger"
        title="Tài khoản đã thay đổi"
        actions={<button type="button" onClick={() => window.location.reload()} className={primaryAction}>Tải lại trang</button>}
      >
        Bạn đã đăng nhập bằng tài khoản khác. Bài làm dở của tài khoản trước vẫn được lưu tạm trên trình duyệt này — đăng nhập lại bằng tài khoản đó để tiếp tục, hoặc tải lại trang để bắt đầu với tài khoản hiện tại.
      </StatusCard>
    );
  const active = latch ? (decision === "adopt" ? user : (kept ?? user)) : user;
  if (decision === "loading") return <LoadingCard label="Đang tải…" />;
  if (decision !== "signed-out" && active) return <>{children(active)}</>;
  return (
    <StatusCard
      title="Đăng nhập để tiếp tục"
      actions={
        <button
          type="button"
          onClick={() => openAuth("login", window.location.pathname + window.location.search)}
          className={primaryAction}
        >
          Đăng nhập
        </button>
      }
    >
      Bạn cần đăng nhập để làm bài thi và lưu kết quả.
    </StatusCard>
  );
}
