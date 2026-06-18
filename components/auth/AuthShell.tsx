import type { ReactNode } from "react";
import { Logo } from "@/components/Logo";

/**
 * Khung trang xác thực: nền nhẹ + thẻ trắng căn giữa.
 * title/subtitle/footer là tùy chọn — luồng nhiều bước (quên mật khẩu) tự
 * render tiêu đề động bên trong children.
 */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const hasHead = Boolean(title || subtitle);
  return (
    <div className="bg-dotgrid flex min-h-[100dvh] flex-col items-center justify-center bg-paper-2 px-5 py-10">
      <div className="w-full max-w-[460px]">
        <div className="rounded-[16px] border border-line bg-paper p-7 shadow-[var(--shadow-2)] sm:p-9">
          <div className="flex justify-center">
            <Logo size={30} href="/" />
          </div>
          {title && (
            <h1 className="mt-6 text-center font-display text-[26px] font-semibold leading-tight text-ink sm:text-[28px]">
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="mx-auto mt-2 max-w-xs text-center text-[14.5px] leading-relaxed text-ink-2">
              {subtitle}
            </p>
          )}

          <div className={hasHead ? "mt-7" : "mt-6"}>{children}</div>

          {footer && (
            <div className="mt-6 border-t border-line pt-5 text-center text-[14px] text-ink-2">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Tiêu đề động cho từng bước, dùng cùng style với AuthShell. */
export function AuthHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div>
      <h1 className="mt-6 text-center font-display text-[26px] font-semibold leading-tight text-ink sm:text-[28px]">
        {title}
      </h1>
      <p className="mx-auto mt-2 max-w-xs text-center text-[14.5px] leading-relaxed text-ink-2">
        {subtitle}
      </p>
    </div>
  );
}
