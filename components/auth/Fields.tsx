"use client";

import { useState, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";

const inputBase =
  "h-12 w-full rounded-[8px] border bg-paper text-[15px] outline-none transition-colors placeholder:text-ink-3 focus:border-orange";

export function TextField({
  label,
  required,
  type = "text",
  value,
  onChange,
  placeholder,
  error,
  autoComplete,
}: {
  label: string;
  required?: boolean;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  autoComplete?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1 text-[14px] font-semibold text-ink">
        {label}
        {required && <span className="text-danger">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={`${inputBase} px-4 ${error ? "border-danger" : "border-line"}`}
      />
      {error && <p className="mt-1 text-[12.5px] text-danger">{error}</p>}
    </div>
  );
}

export function PasswordField({
  label = "Mật khẩu",
  required,
  value,
  onChange,
  placeholder = "Nhập mật khẩu",
  error,
  rightSlot,
  autoComplete = "current-password",
}: {
  label?: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  rightSlot?: ReactNode;
  autoComplete?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <label className="flex items-center gap-1 text-[14px] font-semibold text-ink">
          {label}
          {required && <span className="text-danger">*</span>}
        </label>
        {rightSlot}
      </div>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={`${inputBase} pl-4 pr-12 ${error ? "border-danger" : "border-line"}`}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-ink-3 transition-colors hover:bg-paper-3 hover:text-ink"
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {error && <p className="mt-1 text-[12.5px] text-danger">{error}</p>}
    </div>
  );
}

export function SubmitButton({
  children,
  disabled,
}: {
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="mt-1 h-12 w-full rounded-[8px] bg-orange text-[15px] font-semibold text-white shadow-[0_1px_2px_rgba(7,141,248,0.32)] transition-colors hover:bg-orange-dark disabled:cursor-not-allowed disabled:opacity-60"
    >
      {children}
    </button>
  );
}
