"use client";

import { useState } from "react";
import { Check, Cloud } from "lucide-react";

/** Hộp xác minh kiểu Cloudflare Turnstile (mô phỏng). */
export function Captcha({
  checked,
  onChange,
  error,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  error?: boolean;
}) {
  const [loading, setLoading] = useState(false);

  function toggle() {
    if (checked) {
      onChange(false);
      return;
    }
    setLoading(true);
    // mô phỏng độ trễ xác minh ngắn
    window.setTimeout(() => {
      setLoading(false);
      onChange(true);
    }, 500);
  }

  return (
    <div>
      <p className="mb-2 text-[14px] font-medium text-ink">Xác minh bạn không phải là robot</p>
      <div
        className={`flex items-center gap-3 rounded-[6px] border bg-paper-2 px-4 py-3.5 ${
          error ? "border-danger" : "border-line"
        }`}
      >
        <button
          type="button"
          role="checkbox"
          aria-checked={checked}
          aria-label="Xác minh bạn là con người"
          onClick={toggle}
          className={`grid h-6 w-6 shrink-0 place-items-center rounded-[4px] border-2 transition-colors ${
            checked ? "border-green bg-green text-white" : "border-line-strong bg-paper"
          }`}
        >
          {loading ? (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-ink-3 border-t-transparent" />
          ) : checked ? (
            <Check size={15} strokeWidth={3} />
          ) : null}
        </button>
        <span className="text-[14px] text-ink">Xác minh bạn là con người</span>
        <div className="ml-auto flex flex-col items-end leading-tight">
          <span className="flex items-center gap-1">
            <Cloud size={15} className="text-[#F38020]" fill="#F38020" />
            <span className="text-[10px] font-bold tracking-wide text-ink-2">CLOUDFLARE</span>
          </span>
          <span className="mt-0.5 text-[10px] text-ink-3">Quyền riêng tư · Giúp đỡ</span>
        </div>
      </div>
    </div>
  );
}
