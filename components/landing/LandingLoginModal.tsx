"use client";

import { X } from "lucide-react";
import {
  useEffect,
  useCallback,
  useRef,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { Logo } from "@/components/Logo";
import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";
import type { AuthModalMode } from "@/components/auth/AuthModalProvider";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export function LandingLoginModal({
  open,
  mode,
  onModeChange,
  onClose,
}: {
  open: boolean;
  mode: AuthModalMode;
  onModeChange: (mode: AuthModalMode) => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);

  const isLogin = mode === "login";
  const title = isLogin ? "Đăng nhập để thi thử" : "Tạo tài khoản ExamCure";
  const description = isLogin
    ? "Lưu kết quả, lịch sử làm bài và tiếp tục đúng nơi bạn đang học."
    : "Chọn trường một lần để ExamCure gợi ý đúng môn, đề thi và tài liệu cho bạn.";

  const closeModal = useCallback(() => {
    onClose();
  }, [onClose]);

  function switchMode(nextMode: AuthModalMode) {
    onModeChange(nextMode);
    window.requestAnimationFrame(() => {
      dialogRef.current?.scrollTo({ top: 0 });
      dialogRef.current?.querySelector<HTMLElement>("input")?.focus();
    });
  }

  useEffect(() => {
    if (!open) return;

    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const frame = window.requestAnimationFrame(() => {
      const firstField = dialogRef.current?.querySelector<HTMLElement>("input");
      (firstField ?? dialogRef.current)?.focus();
    });

    function handleEscape(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") closeModal();
    }

    document.addEventListener("keydown", handleEscape);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [closeModal, open]);

  function trapFocus(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Tab" || !dialogRef.current) return;

    const focusable = Array.from(
      dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
    ).filter((element) => !element.hasAttribute("disabled"));
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="landing-auth-backdrop fixed inset-0 z-[100] flex items-center justify-center bg-[#171717]/60 p-3 backdrop-blur-[2px] sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeModal();
      }}
      style={
        {
          "--color-orange": "#e9783a",
          "--color-orange-dark": "#c84f1d",
          "--color-orange-soft": "#fff3eb",
          "--color-orange-border": "#f2c5aa",
        } as CSSProperties
      }
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="landing-auth-title"
        aria-describedby="landing-auth-description"
        tabIndex={-1}
        onKeyDown={trapFocus}
        className="landing-auth-dialog max-h-[calc(100dvh-24px)] w-full max-w-[470px] overflow-y-auto rounded-[22px] border border-white/70 bg-white shadow-[0_24px_80px_rgba(20,20,20,0.28)] sm:max-h-[calc(100dvh-48px)]"
      >
        <div className="sticky top-0 z-10 flex items-center justify-center border-b border-neutral-100 bg-white/95 px-14 py-4 backdrop-blur sm:px-16">
          <Logo size={25} href={null} />
          <button
            type="button"
            onClick={closeModal}
            aria-label="Đóng cửa sổ tài khoản"
            className="absolute right-4 grid h-9 w-9 place-items-center rounded-full bg-neutral-100 text-neutral-600 transition-colors hover:bg-neutral-200 hover:text-neutral-950 sm:right-5"
          >
            <X className="h-[18px] w-[18px]" aria-hidden="true" />
          </button>
        </div>

        <div className="px-5 pb-6 pt-5 sm:px-7 sm:pb-7 sm:pt-6">
          <div className="mb-6">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#c84f1d]">
              {isLogin ? "Bắt đầu bài thi" : "Tạo hồ sơ học tập"}
            </p>
            <h2
              id="landing-auth-title"
              className="font-sans text-[25px] font-bold tracking-[-0.035em] text-neutral-950 sm:text-[28px]"
            >
              {title}
            </h2>
            <p
              id="landing-auth-description"
              className="mt-2 max-w-sm text-[14px] leading-6 text-neutral-600"
            >
              {description}
            </p>
          </div>

          <div className="[&_button[type='submit']]:shadow-[0_1px_2px_rgba(200,79,29,0.3)]">
            {isLogin ? (
              <LoginForm
                redirectTo="/schools/fptu/subjects"
                onSuccess={closeModal}
              />
            ) : (
              <RegisterForm
                redirectTo="/schools/fptu/subjects"
                onSuccess={closeModal}
              />
            )}
          </div>

          <p className="mt-6 border-t border-neutral-100 pt-5 text-center text-[14px] text-neutral-600">
            {isLogin ? "Chưa có tài khoản?" : "Đã có tài khoản?"}{" "}
            <button
              type="button"
              onClick={() => switchMode(isLogin ? "register" : "login")}
              className="font-semibold text-neutral-950 underline decoration-[#ef4d23]/45 underline-offset-4 transition-colors hover:text-[#c84f1d]"
            >
              {isLogin ? "Đăng ký" : "Đăng nhập"}
            </button>
          </p>
        </div>
      </div>
    </div>,
    document.body,
  );
}
