"use client";

import { useRef } from "react";

/** Ô nhập mã OTP: tự nhảy ô, xử lý xóa lùi và dán mã. */
export function OtpInput({
  value,
  onChange,
  length = 6,
  invalid = false,
}: {
  value: string;
  onChange: (v: string) => void;
  length?: number;
  invalid?: boolean;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const chars = Array.from({ length }, (_, i) => value[i] ?? "");

  function setAt(i: number, ch: string) {
    const next = chars.slice();
    next[i] = ch;
    onChange(next.join("").slice(0, length));
  }

  return (
    <div
      className="flex justify-between gap-2"
      onPaste={(e) => {
        const p = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
        if (p) {
          e.preventDefault();
          onChange(p);
          refs.current[Math.min(p.length, length - 1)]?.focus();
        }
      }}
    >
      {chars.map((c, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          inputMode="numeric"
          maxLength={1}
          value={c}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, "");
            if (!v) {
              setAt(i, "");
              return;
            }
            setAt(i, v[v.length - 1]);
            if (i < length - 1) refs.current[i + 1]?.focus();
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !chars[i] && i > 0) refs.current[i - 1]?.focus();
          }}
          className={`h-12 w-full rounded-[8px] border bg-paper text-center text-[18px] font-semibold text-ink outline-none transition-colors focus:border-orange ${
            invalid ? "border-danger" : "border-line"
          }`}
        />
      ))}
    </div>
  );
}
