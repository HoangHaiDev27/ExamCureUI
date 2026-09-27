"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Inbox, Loader2, Search, X } from "lucide-react";
import { Button } from "@/components/Button";

/* ---------------- Data loading ---------------- */

/**
 * Gọi `fn` mỗi khi `key` đổi (key mô tả đầu vào của fn) hoặc khi `reload()`.
 * Giữ dữ liệu cũ trong lúc tải lại để bảng không nhấp nháy.
 */
export function useLoader<T>(fn: () => Promise<T>, key: string) {
  const [tick, setTick] = useState(0);
  const reqKey = `${key}#${tick}`;
  const [state, setState] = useState<{ key?: string; data?: T; error?: string }>({});

  useEffect(() => {
    let alive = true;
    fn()
      .then((data) => alive && setState({ key: reqKey, data }))
      .catch((e: Error) => alive && setState((s) => ({ key: reqKey, data: s.data, error: e.message })));
    return () => {
      alive = false;
    };
    // fn là closure mới mỗi render; reqKey đã mã hoá toàn bộ đầu vào của nó.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reqKey]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  const current = state.key === reqKey;
  return { data: state.data, error: current ? state.error : undefined, loading: !current, reload };
}

/** Trì hoãn giá trị (ô tìm kiếm) để không gọi API mỗi phím gõ. */
export function useDebounced<T>(value: T, ms = 300): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

/* ---------------- Toast ---------------- */

type Toast = { id: number; tone: "ok" | "error"; text: string };
const ToastCtx = createContext<(tone: Toast["tone"], text: string) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((tone: Toast["tone"], text: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, tone, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[70] flex w-[min(380px,calc(100vw-40px))] flex-col gap-2" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-2.5 rounded-[8px] border bg-paper px-4 py-3 text-[14px] shadow-[var(--shadow-pop)] ${
              t.tone === "ok" ? "border-green/30" : "border-danger/30"
            }`}
          >
            {t.tone === "ok" ? (
              <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-green" />
            ) : (
              <AlertTriangle size={18} className="mt-0.5 shrink-0 text-danger" />
            )}
            <span className="text-ink">{t.text}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/* ---------------- Layout pieces ---------------- */

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[24px] font-bold text-ink">{title}</h1>
        {description && <p className="mt-1 text-[14px] text-ink-2">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-[10px] border border-line bg-paper shadow-[var(--shadow-1)] ${className}`}>{children}</section>;
}

export function Toolbar({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2.5 border-b border-line px-4 py-3">{children}</div>;
}

export function Badge({ tone = "neutral", children }: { tone?: "neutral" | "blue" | "green" | "warning" | "danger"; children: ReactNode }) {
  const tones = {
    neutral: "bg-paper-3 text-ink-2",
    blue: "bg-orange-soft text-orange-dark",
    green: "bg-green-soft text-green",
    warning: "bg-warning-soft text-[#9a6200]",
    danger: "bg-danger-soft text-danger",
  };
  return <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-[4px] px-2 py-0.5 text-[12px] font-semibold ${tones[tone]}`}>{children}</span>;
}

export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-[8px] border border-danger/30 bg-danger-soft px-4 py-3 text-[14px] text-danger">
      <AlertTriangle size={18} className="shrink-0" />
      <span className="flex-1">{message}</span>
      {onRetry && (
        <Button size="sm" variant="outline" onClick={onRetry}>
          Thử lại
        </Button>
      )}
    </div>
  );
}

export function Empty({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <Inbox size={28} className="text-ink-3" />
      <p className="mt-3 text-[15px] font-semibold text-ink">{title}</p>
      {hint && <p className="mt-1 max-w-sm text-[13.5px] text-ink-2">{hint}</p>}
    </div>
  );
}

export function Spinner({ label = "Đang tải…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-14 text-[14px] text-ink-2">
      <Loader2 size={18} className="animate-spin" /> {label}
    </div>
  );
}

/* ---------------- Table ---------------- */

export function Table({ head, children }: { head: ReactNode[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-left text-[14px]">
        <thead>
          <tr className="border-b border-line bg-paper-2 text-[12px] font-semibold uppercase tracking-[0.04em] text-ink-3">
            {head.map((h, i) => (
              <th key={i} className="whitespace-nowrap px-4 py-2.5 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="[&>tr]:border-b [&>tr]:border-line [&>tr:last-child]:border-0 [&>tr:hover]:bg-paper-2">{children}</tbody>
      </table>
    </div>
  );
}

export function Td({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return <td className={`px-4 py-3 align-middle ${className}`}>{children}</td>;
}

export function Pagination({ page, limit, total, onPage }: { page: number; limit: number; total: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / limit));
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(total, page * limit);
  return (
    <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3 text-[13px] text-ink-2">
      <span>
        {from}–{to} / {total.toLocaleString("vi-VN")}
      </span>
      <div className="flex items-center gap-1">
        <Button size="sm" variant="ghost" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Trang trước">
          <ChevronLeft size={16} />
        </Button>
        <span className="min-w-[64px] text-center">
          {page} / {pages}
        </span>
        <Button size="sm" variant="ghost" disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="Trang sau">
          <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  );
}

/* ---------------- Form controls ---------------- */

const control =
  "w-full rounded-[7px] border border-line bg-paper px-3 text-[14px] text-ink outline-none transition-colors placeholder:text-ink-3 focus:border-orange disabled:bg-paper-2";

export function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1 text-[13px] font-semibold text-ink">
        {label}
        {required && <span className="text-danger">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-[12px] text-ink-3">{hint}</span>}
    </label>
  );
}

export function Input(props: ComponentProps<"input">) {
  return <input {...props} className={`${control} h-10 ${props.className ?? ""}`} />;
}

export function Textarea(props: ComponentProps<"textarea">) {
  return <textarea {...props} className={`${control} py-2 leading-relaxed ${props.className ?? ""}`} />;
}

export function Select({ children, ...props }: ComponentProps<"select">) {
  return (
    <select {...props} className={`${control} h-10 cursor-pointer pr-8 ${props.className ?? ""}`}>
      {children}
    </select>
  );
}

export function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative min-w-[220px] flex-1 sm:max-w-[320px]">
      <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${control} h-9 pl-9`}
        aria-label={placeholder}
      />
    </div>
  );
}

/* ---------------- Dialogs ---------------- */

export function Modal({
  open,
  title,
  onClose,
  children,
  footer,
  wide,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-ink/40 p-4 sm:p-8" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
        className={`my-auto w-full ${wide ? "max-w-[760px]" : "max-w-[520px]"} rounded-[10px] border border-line bg-paper shadow-[var(--shadow-pop)]`}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-[17px] font-bold text-ink">{title}</h2>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-[6px] text-ink-3 hover:bg-paper-3 hover:text-ink" aria-label="Đóng">
            <X size={18} />
          </button>
        </div>
        <div className="max-h-[calc(100vh-220px)] overflow-y-auto px-5 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-line bg-paper-2 px-5 py-3.5">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Xác nhận",
  danger,
  busy,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={busy}>
            Huỷ
          </Button>
          <Button variant={danger ? "danger" : "primary"} size="sm" onClick={onConfirm} disabled={busy}>
            {busy && <Loader2 size={15} className="animate-spin" />} {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="text-[14.5px] leading-relaxed text-ink-2">{message}</div>
    </Modal>
  );
}
