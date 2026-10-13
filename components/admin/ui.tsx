"use client";

import {
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Check, LoaderCircle, RotateCw, Search, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Popover } from "./overlays";

export const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(" ");
export const nf = new Intl.NumberFormat("vi-VN");

/* ---------- class recipes (ported from the prototype, mapped to project tokens) ---------- */
export const BTN_BASE =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl min-h-10 px-4 py-2 text-sm font-medium leading-tight text-center transition-colors outline-hidden focus-visible:ring-2 focus-visible:ring-orange/30 disabled:cursor-not-allowed disabled:opacity-50 aria-busy:cursor-progress";
export const BTN = {
  outline: "border border-line-strong bg-paper text-ink hover:bg-paper-3",
  primary: "bg-orange text-white hover:bg-orange-dark",
  secondary: "bg-paper-3 text-ink hover:bg-line",
  ghost: "bg-transparent text-ink-3 hover:bg-ink/5 hover:text-ink",
  danger: "bg-rose-500/10 text-rose-700 hover:bg-rose-500/15",
} as const;
export type ButtonVariant = keyof typeof BTN;
export const ICON_BTN =
  "inline-flex size-8 cursor-pointer items-center justify-center rounded-lg text-ink-3 transition-colors outline-hidden hover:bg-ink/5 hover:text-ink focus-visible:ring-2 focus-visible:ring-orange/30 disabled:cursor-not-allowed disabled:opacity-40";
export const INPUT =
  "h-11 w-full rounded-xl border border-line-strong bg-paper px-4 text-base text-ink outline-hidden transition-colors placeholder:text-ink-3 focus:border-orange focus:ring-2 focus:ring-orange/15 md:h-10 md:text-sm aria-[invalid=true]:border-red-500";
export const TEXTAREA =
  "min-h-24 w-full rounded-xl border border-line-strong bg-paper px-4 py-2.5 text-base text-ink outline-hidden transition-colors placeholder:text-ink-3 focus:border-orange focus:ring-2 focus:ring-orange/15 md:text-sm aria-[invalid=true]:border-red-500";
export const RADIO =
  "size-5 shrink-0 cursor-pointer appearance-none rounded-full border-[1.5px] border-line-strong bg-paper outline-hidden transition-[border-color,border-width] not-checked:hover:border-ink checked:border-[6px] checked:border-orange focus-visible:ring-2 focus-visible:ring-orange/30";
export const TH = "h-11 px-4 text-left text-xs font-medium whitespace-nowrap text-ink-3";
export const TD = "px-4 py-3 align-middle";

/* ---------- Button ---------- */
export function Spinner({ className = "size-4" }: { className?: string }) {
  return <LoaderCircle aria-hidden="true" className={cx(className, "shrink-0 animate-spin motion-reduce:animate-none")} />;
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  icon?: LucideIcon;
  busy?: boolean;
};

export function Button({ variant = "outline", icon: Icon, busy = false, className, children, onClick, type = "button", ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      type={type}
      aria-busy={busy || undefined}
      aria-disabled={busy || undefined}
      onClick={(event) => {
        if (busy) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
      }}
      className={cx(BTN_BASE, BTN[variant], busy && "relative", className)}
    >
      {Icon && <Icon aria-hidden="true" className={cx("size-4 shrink-0", busy && "invisible")} />}
      <span className={cx(busy && "invisible")}>{children}</span>
      {busy && <span className="absolute inset-0 m-auto inline-flex size-4 items-center justify-center"><Spinner /></span>}
    </button>
  );
}

export function IconButton({
  icon: Icon,
  label,
  className,
  iconClassName = "size-4",
  type = "button",
  ...rest
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & { icon: LucideIcon; label: string; iconClassName?: string }) {
  return (
    <button {...rest} type={type} aria-label={label} title={rest.title ?? label} className={cx(ICON_BTN, className)}>
      <Icon aria-hidden="true" className={cx(iconClassName, "shrink-0")} />
    </button>
  );
}

/* ---------- Badge, avatar ---------- */
export const BADGE_TONE = {
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  error: "bg-red-50 text-red-700",
  neutral: "bg-paper-3 text-ink/70",
  brand: "bg-orange-soft text-orange-dark",
} as const;
export type BadgeTone = keyof typeof BADGE_TONE;

export function Badge({ tone, icon: Icon, spinner = false, children }: { tone: BadgeTone; icon?: LucideIcon; spinner?: boolean; children: ReactNode }) {
  return (
    <span className={cx("inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap", BADGE_TONE[tone])}>
      {spinner ? <Spinner className="size-3" /> : Icon ? <Icon aria-hidden="true" className="size-3 shrink-0" /> : null}
      {children}
    </span>
  );
}

const AVATAR_TONES = [
  "bg-sky-100 text-sky-800",
  "bg-amber-100 text-amber-800",
  "bg-emerald-100 text-emerald-800",
  "bg-violet-100 text-violet-800",
  "bg-rose-100 text-rose-800",
  "bg-teal-100 text-teal-800",
];
export function Avatar({ name, className = "size-8 text-sm" }: { name: string; className?: string }) {
  const words = name.trim().split(/\s+/);
  const letter = ((words[words.length - 1] || "?")[0] ?? "?").toUpperCase();
  const hash = [...name].reduce((sum, c) => sum + c.charCodeAt(0), 0);
  return (
    <span aria-hidden="true" className={cx("inline-flex shrink-0 items-center justify-center rounded-full font-medium", className, AVATAR_TONES[hash % AVATAR_TONES.length])}>
      {letter}
    </span>
  );
}

/* ---------- Cards, headers, empty lines ---------- */
export function CardHeader({ title, sub, action }: { title: ReactNode; sub?: ReactNode; action?: ReactNode }) {
  return (
    <header className="flex items-start justify-between gap-3 px-5">
      <div className={cx("flex min-w-0 items-center gap-2", Boolean(action) && "min-h-10")}>
        <h2 className="text-base font-semibold text-balance text-ink">{title}</h2>
        {sub != null && <span className="text-xs tabular-nums text-ink-3">{sub}</span>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}

export function TableCard({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("@container overflow-hidden rounded-2xl border border-line bg-paper", className)}>{children}</div>;
}

export function EmptyLine({ children }: { children: ReactNode }) {
  return <p className="px-4 py-6 text-center text-sm text-pretty text-ink-3">{children}</p>;
}

/* ---------- Toolbar, search, tabs ---------- */
export function Toolbar({ tabs, middle, action }: { tabs?: ReactNode; middle?: ReactNode; action?: ReactNode }) {
  if (!tabs) {
    return (
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        {middle && <div className="min-w-0 sm:w-80">{middle}</div>}
        {action && <div className="sm:ml-auto [&>button]:w-full sm:[&>button]:w-auto">{action}</div>}
      </div>
    );
  }
  return (
    <div className="mb-4 grid grid-cols-1 items-center gap-3 sm:grid-cols-[minmax(0,1fr)_auto] xl:grid-cols-[minmax(0,1fr)_minmax(0,20rem)_auto]">
      <div className="min-w-0 sm:col-start-1 sm:row-start-1">{tabs}</div>
      {middle && <div className="min-w-0 sm:col-span-2 sm:row-start-2 xl:col-span-1 xl:col-start-2 xl:row-start-1">{middle}</div>}
      {action && <div className="sm:col-start-2 sm:row-start-1 xl:col-start-3 [&>button]:w-full sm:[&>button]:w-auto">{action}</div>}
    </div>
  );
}

export function SearchBox({ value, onChange, placeholder, label }: { value: string; onChange: (value: string) => void; placeholder: string; label?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="relative w-full">
      <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-3" />
      <input
        ref={ref}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={label ?? placeholder}
        autoComplete="off"
        className={cx(INPUT, "pr-10 pl-10 [&::-webkit-search-cancel-button]:hidden")}
      />
      {value && (
        <IconButton
          icon={X}
          label="Xoá tìm kiếm"
          className="absolute top-1/2 right-1.5 -translate-y-1/2"
          onClick={() => {
            onChange("");
            ref.current?.focus();
          }}
        />
      )}
    </div>
  );
}

export interface TabItem<V extends string = string> {
  value: V;
  label: string;
  count: number;
}

export function PopItem({
  label,
  sub,
  icon: Icon,
  selected = false,
  danger = false,
  role = "option",
  onClick,
  hidden,
}: {
  label: ReactNode;
  sub?: ReactNode;
  icon?: LucideIcon;
  selected?: boolean;
  danger?: boolean;
  role?: "option" | "menuitem";
  onClick: () => void;
  hidden?: boolean;
}) {
  return (
    <button
      type="button"
      role={role}
      aria-selected={role === "option" ? selected : undefined}
      hidden={hidden}
      onClick={onClick}
      className={cx(
        "flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 text-left text-sm outline-hidden",
        sub ? "py-2" : "h-10",
        danger
          ? "group text-ink hover:bg-rose-500/10 hover:text-rose-700 focus-visible:bg-rose-500/10 focus-visible:text-rose-700"
          : "hover:bg-paper-3 focus-visible:bg-paper-3",
        selected && "font-medium",
      )}
    >
      {Icon && <Icon aria-hidden="true" className={cx("size-4 shrink-0 text-ink-3", danger && "group-hover:text-rose-700")} />}
      <span className="min-w-0 flex-1">
        <span className="block truncate">{label}</span>
        {sub && <span className="mt-0.5 block truncate text-xs font-normal text-ink-3">{sub}</span>}
      </span>
      {selected && <Check aria-hidden="true" className="size-4 shrink-0" />}
    </button>
  );
}

export function Tabs<V extends string>({ label, tabs, value, onChange }: { label: string; tabs: Array<TabItem<V>>; value: V; onChange: (value: V) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const current = tabs.find((t) => t.value === value) ?? tabs[0];
  const onKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const index = tabs.findIndex((t) => t.value === value);
    const next = { ArrowLeft: index - 1, ArrowRight: index + 1, Home: 0, End: tabs.length - 1 }[event.key]!;
    const target = tabs[(next + tabs.length) % tabs.length]!;
    onChange(target.value);
    requestAnimationFrame(() => listRef.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.focus({ preventScroll: true }));
  };
  return (
    <>
      <div className="hidden min-w-0 sm:block">
        <div className="admin-scrollbar-clean overflow-x-auto py-0.5">
          <div ref={listRef} role="tablist" aria-label={label} onKeyDown={onKey} className="flex items-center gap-1 px-0.5">
            {tabs.map((t) => {
              const selected = t.value === value;
              return (
                <button
                  key={t.value}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => onChange(t.value)}
                  className={cx(
                    "inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border px-3 text-sm font-medium whitespace-nowrap outline-hidden transition-colors focus-visible:ring-2 focus-visible:ring-orange/30",
                    selected ? "border-transparent bg-paper-3 text-ink" : "border-transparent text-ink/70 hover:bg-ink/5 hover:text-ink",
                  )}
                >
                  {t.label}
                  <span className="text-xs font-normal tabular-nums text-ink/70">{nf.format(t.count)}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <button
        ref={menuRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((open) => !open)}
        className="group inline-flex h-10 w-fit cursor-pointer items-center gap-2 rounded-xl border border-line-strong bg-paper px-4 text-sm outline-hidden aria-expanded:border-orange aria-expanded:ring-2 aria-expanded:ring-orange/15 sm:hidden"
      >
        <span className="text-ink-3">{label}:</span>
        <span className="font-medium">{current ? `${current.label} · ${nf.format(current.count)}` : ""}</span>
        <ChevronDown aria-hidden="true" className="size-4 text-ink-3 transition-transform group-aria-expanded:rotate-180" />
      </button>
      <Popover open={menuOpen} anchorRef={menuRef} onClose={() => setMenuOpen(false)} width="auto" role="listbox" ariaLabel={label}>
        <div className="px-1">
          {tabs.map((t) => (
            <PopItem
              key={t.value}
              label={`${t.label} · ${nf.format(t.count)}`}
              selected={t.value === value}
              onClick={() => {
                setMenuOpen(false);
                onChange(t.value);
              }}
            />
          ))}
        </div>
      </Popover>
    </>
  );
}

/* ---------- Loading and error states ---------- */
export function SkeletonBar({ className = "w-1/2", h = "h-3.5" }: { className?: string; h?: string }) {
  return <span className={cx("admin-skeleton block", h, className)} />;
}

export function SkeletonRows({ rows = 6 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-4 border-t border-line px-4 py-3.5">
          <SkeletonBar className={i % 2 ? "w-2/5" : "w-1/2"} />
          <span className="flex-1" />
          <SkeletonBar className="w-16" />
          <SkeletonBar className="hidden w-20 sm:block" />
        </div>
      ))}
    </>
  );
}

export function SkeletonView({ kind = "table" }: { kind?: "overview" | "table" }) {
  if (kind === "overview") {
    return (
      <div aria-busy="true" aria-label="Đang tải tổng quan" className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="bg-paper p-4 sm:p-5">
              <SkeletonBar className="w-16" h="h-3" />
              <span className="admin-skeleton mt-2.5 block h-7 w-12" />
              <SkeletonBar className="mt-2 w-24" h="h-3" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
          <div className="rounded-2xl border border-line bg-paper py-5 xl:col-span-2">
            <div className="px-5 pb-3"><SkeletonBar className="w-40" h="h-4" /></div>
            <SkeletonRows rows={5} />
          </div>
          <div className="rounded-2xl border border-line bg-paper py-5">
            <div className="px-5 pb-3"><SkeletonBar className="w-32" h="h-4" /></div>
            <SkeletonRows rows={4} />
          </div>
        </div>
      </div>
    );
  }
  return (
    <div aria-busy="true" aria-label="Đang tải" className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        {Array.from({ length: 3 }, (_, i) => (
          <span key={i} className="admin-skeleton block h-9 w-24 rounded-lg" />
        ))}
      </div>
      <div className="overflow-hidden rounded-2xl border border-line bg-paper">
        <div className="px-4 py-3.5"><SkeletonBar className="w-48" h="h-3" /></div>
        <SkeletonRows rows={7} />
      </div>
    </div>
  );
}

export function ErrorBlock({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-line bg-paper">
      <div role="alert" className="flex flex-col items-center gap-3 px-6 py-10 text-center">
        <div>
          <p className="text-sm font-medium text-red-600">Chưa kết nối được backend quản trị</p>
          <p className="mt-1 max-w-[55ch] text-sm text-pretty text-ink-3">Kiểm tra kết nối máy chủ hoặc đăng nhập lại bằng tài khoản quản trị.</p>
        </div>
        <Button variant="outline" icon={RotateCw} onClick={onRetry}>Thử lại</Button>
      </div>
    </div>
  );
}

/* ---------- Pager ---------- */
export function Pager({ page, pageSize, total, noun, onPage }: { page: number; pageSize: number; total: number; noun: string; onPage: (page: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return (
    <div className="flex items-center justify-between gap-4 border-t border-line px-4 py-3">
      <p className="text-sm tabular-nums text-ink-3">
        <span className="hidden sm:inline">{from} tới {to} trong </span>
        {nf.format(total)} {noun}
      </p>
      {pages > 1 && (
        <nav aria-label="Phân trang" className="flex shrink-0 items-center gap-1">
          <IconButton icon={ChevronLeft} label="Trang trước" className="size-9" disabled={page === 1} onClick={() => onPage(page - 1)} />
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              aria-current={n === page ? "page" : undefined}
              onClick={() => onPage(n)}
              className={cx(
                "inline-flex h-9 min-w-9 cursor-pointer items-center justify-center rounded-lg border px-2 text-sm font-medium tabular-nums outline-hidden focus-visible:ring-2 focus-visible:ring-orange/30",
                n === page ? "border-transparent bg-paper-3 text-ink" : "border-transparent text-ink/70 hover:bg-ink/5 hover:text-ink",
              )}
            >
              {n}
            </button>
          ))}
          <IconButton icon={ChevronRight} label="Trang sau" className="size-9" disabled={page === pages} onClick={() => onPage(page + 1)} />
        </nav>
      )}
    </div>
  );
}

/* ---------- Form pieces ---------- */
export function Field({
  label,
  htmlFor,
  optional = false,
  hint,
  error,
  children,
}: {
  label: ReactNode;
  htmlFor: string;
  optional?: boolean;
  hint?: ReactNode;
  error?: string | null;
  /** Receives the ids the control must wire to `aria-describedby` / `aria-invalid`. */
  children: ReactNode | ((control: { "aria-invalid": boolean; "aria-describedby": string | undefined }) => ReactNode);
}) {
  const uid = useId();
  const hintId = `${uid}-hint`;
  const errorId = `${uid}-error`;
  const describedBy = error ? errorId : hint ? hintId : undefined;
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-medium">
        {label}
        {optional && <span className="font-normal text-ink-3"> (không bắt buộc)</span>}
      </label>
      <div className="mt-2">
        {typeof children === "function" ? children({ "aria-invalid": Boolean(error), "aria-describedby": describedBy }) : children}
      </div>
      {hint && !error && <p id={hintId} className="mt-1.5 text-sm text-pretty text-ink-3">{hint}</p>}
      {error && <p id={errorId} className="mt-1.5 text-sm text-red-600">{error}</p>}
    </div>
  );
}

export function Checkbox({
  checked,
  indeterminate = false,
  onChange,
  label,
  disabled,
  className,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <label className={cx("flex cursor-pointer items-center gap-3 text-sm", disabled && "cursor-not-allowed opacity-50", className)}>
      <span className="relative inline-flex shrink-0">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          ref={(el) => {
            if (el) el.indeterminate = indeterminate;
          }}
          onChange={(event) => onChange(event.target.checked)}
          className="peer size-5 cursor-pointer appearance-none rounded-md border-[1.5px] border-line-strong bg-paper outline-hidden transition-colors not-checked:not-indeterminate:hover:border-ink checked:border-orange checked:bg-orange indeterminate:border-orange indeterminate:bg-orange focus-visible:ring-2 focus-visible:ring-orange/30 disabled:cursor-not-allowed"
        />
        <Check aria-hidden="true" className="pointer-events-none absolute inset-0 m-auto size-3.5 stroke-[3] text-white opacity-0 peer-checked:opacity-100" />
      </span>
      <span className="min-w-0">{label}</span>
    </label>
  );
}

export function Radio({
  name,
  value,
  checked,
  onChange,
  label,
  className,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  label: ReactNode;
  className?: string;
}) {
  return (
    <label className={cx("flex cursor-pointer items-center gap-3 text-sm", className)}>
      <input type="radio" name={name} value={value} checked={checked} onChange={() => onChange(value)} className={RADIO} />
      <span className="min-w-0">{label}</span>
    </label>
  );
}
