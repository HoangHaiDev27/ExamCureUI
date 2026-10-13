"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Search, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button, INPUT, PopItem, cx, type ButtonVariant } from "./ui";

/* ---------- presence: keep the layer mounted while its exit animation runs ---------- */
type Phase = "closed" | "enter" | "open" | "closing";

export function usePresence(open: boolean, exitMs: number) {
  const [phase, setPhase] = useState<Phase>("closed");
  const [prevOpen, setPrevOpen] = useState(false);
  if (open !== prevOpen) {
    setPrevOpen(open);
    setPhase(open ? "enter" : phase === "closed" ? "closed" : "closing");
  }
  useEffect(() => {
    if (phase === "enter") {
      let second = 0;
      const first = requestAnimationFrame(() => {
        second = requestAnimationFrame(() => setPhase("open"));
      });
      return () => {
        cancelAnimationFrame(first);
        cancelAnimationFrame(second);
      };
    }
    if (phase === "closing") {
      const timer = setTimeout(() => setPhase("closed"), exitMs);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [phase, exitMs]);
  return {
    mounted: phase !== "closed",
    className: phase === "open" ? "is-open" : phase === "closing" ? "is-closing" : "",
  };
}

/* ---------- dialog behaviour: focus in/trap/return, Escape, scroll lock, stacking ---------- */
let scrollLocks = 0;
const dialogStack: symbol[] = [];
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

function visibleFocusables(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => !el.hidden && el.getClientRects().length > 0);
}

function useDialogBehavior(ref: RefObject<HTMLElement | null>, onClose: () => void, initialFocus?: string) {
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });
  useEffect(() => {
    const root = ref.current;
    if (!root) return undefined;
    const token = Symbol("dialog");
    dialogStack.push(token);
    const previous = document.activeElement as HTMLElement | null;
    scrollLocks += 1;
    document.documentElement.style.overflow = "hidden";
    const focusFrame = requestAnimationFrame(() => {
      const target =
        (initialFocus ? root.querySelector<HTMLElement>(initialFocus) : null) ??
        root.querySelector<HTMLElement>("input:not([type=hidden]):not([type=file]), textarea, [role=combobox]") ??
        visibleFocusables(root)[0] ??
        root;
      target.focus({ preventScroll: true });
    });
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (dialogStack[dialogStack.length - 1] !== token) return;
      if (event.key === "Escape") {
        if (document.querySelector("[data-admin-popover]")) return;
        event.preventDefault();
        closeRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const items = visibleFocusables(root);
      if (!items.length) {
        event.preventDefault();
        root.focus();
        return;
      }
      const first = items[0]!;
      const last = items[items.length - 1]!;
      const active = document.activeElement;
      if (event.shiftKey && (active === first || !root.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !root.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", onKey);
      const index = dialogStack.indexOf(token);
      if (index >= 0) dialogStack.splice(index, 1);
      scrollLocks = Math.max(0, scrollLocks - 1);
      if (scrollLocks === 0) document.documentElement.style.overflow = "";
      if (previous && document.contains(previous)) previous.focus({ preventScroll: true });
    };
  }, [ref, initialFocus]);
}

// Portal into the admin shell root so overlays inherit its theme variables.
const Portal = ({ children }: { children: ReactNode }) =>
  createPortal(children, document.getElementById("admin-root") ?? document.body);

function CloseX({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label="Đóng"
      className="absolute top-4 right-4 inline-flex size-8 cursor-pointer items-center justify-center rounded-lg text-ink-3 outline-hidden transition-colors hover:bg-ink/5 hover:text-ink focus-visible:ring-2 focus-visible:ring-orange/30"
    >
      <X aria-hidden="true" className="size-4" />
    </button>
  );
}

/* ---------- Modal ---------- */
type FrameProps = {
  open: boolean;
  onClose: () => void;
  labelledBy?: string;
  describedBy?: string;
  ariaLabel?: string;
  role?: "dialog" | "alertdialog";
  closeOnBackdrop?: boolean;
  initialFocus?: string;
  children: ReactNode;
};

function ModalFrame(props: FrameProps) {
  const { mounted, className } = usePresence(props.open, 110);
  if (!mounted) return null;
  return (
    <Portal>
      <ModalLayer {...props} stateClass={className} />
    </Portal>
  );
}

function ModalLayer({ onClose, labelledBy, describedBy, ariaLabel, role = "dialog", closeOnBackdrop = false, initialFocus, children, stateClass }: FrameProps & { stateClass: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useDialogBehavior(ref, onClose, initialFocus);
  return (
    <div className={cx("admin-ov fixed inset-0 z-50", stateClass)}>
      <div className="admin-ov-backdrop absolute inset-0 bg-black/30" onClick={closeOnBackdrop ? onClose : undefined} />
      <div className="pointer-events-none absolute inset-0 flex items-start justify-center overflow-y-auto p-4 pt-16 sm:items-center sm:pt-4">
        <div
          ref={ref}
          role={role}
          aria-modal="true"
          aria-labelledby={labelledBy}
          aria-describedby={describedBy}
          aria-label={labelledBy ? undefined : ariaLabel}
          tabIndex={-1}
          className="admin-ov-modal pointer-events-auto w-full max-w-md rounded-2xl border border-line bg-paper shadow-[var(--shadow-2)] outline-hidden"
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  closeOnBackdrop = false,
  initialFocus,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  closeOnBackdrop?: boolean;
  initialFocus?: string;
}) {
  const id = useId();
  return (
    <ModalFrame open={open} onClose={onClose} labelledBy={`${id}-title`} closeOnBackdrop={closeOnBackdrop} initialFocus={initialFocus}>
      <div className="relative p-6">
        <h2 id={`${id}-title`} className="pr-10 text-lg font-semibold">{title}</h2>
        {description && <p className="mt-2 pr-10 text-sm/6 text-pretty text-ink-3">{description}</p>}
        <CloseX onClose={onClose} />
        <div className="mt-6">{children}</div>
      </div>
    </ModalFrame>
  );
}

/** Cancel + submit row shared by modal and sheet forms. */
export function DialogFooter({ children, sticky = false }: { children: ReactNode; sticky?: boolean }) {
  return (
    <footer className={cx("flex shrink-0 flex-col-reverse gap-2 sm:flex-row sm:justify-end", sticky ? "border-t border-line px-6 py-4" : "mt-6")}>
      {children}
    </footer>
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  icon: Icon,
  tone = "neutral",
  cancelLabel = "Huỷ",
  confirmLabel,
  busy = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: ReactNode;
  description: ReactNode;
  icon?: LucideIcon;
  tone?: "neutral" | "warning" | "danger";
  cancelLabel?: string;
  confirmLabel: string;
  busy?: boolean;
}) {
  const id = useId();
  const iconBox = tone === "danger" ? "bg-red-50 text-red-700" : tone === "warning" ? "bg-amber-50 text-amber-700" : "bg-paper-2 text-ink";
  const confirmVariant: ButtonVariant = tone === "danger" ? "danger" : "primary";
  return (
    <ModalFrame
      open={open}
      onClose={busy ? () => undefined : onClose}
      role="alertdialog"
      labelledBy={`${id}-title`}
      describedBy={`${id}-desc`}
      closeOnBackdrop
      initialFocus="[data-cancel]"
    >
      <div className="p-6">
        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4">
          {Icon && (
            <div className={cx("flex size-10 shrink-0 items-center justify-center rounded-full", iconBox)}>
              <Icon aria-hidden="true" className="size-5" />
            </div>
          )}
          <h2 id={`${id}-title`} className={cx("text-lg font-semibold", !Icon && "col-span-2")}>{title}</h2>
          <div className={cx("col-span-2 mt-2 min-w-0 sm:mt-0.5", Icon ? "sm:col-span-1 sm:col-start-2" : "")}>
            <p id={`${id}-desc`} className="text-sm/6 text-pretty text-ink-3">{description}</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" data-cancel onClick={onClose} disabled={busy}>{cancelLabel}</Button>
          <Button variant={confirmVariant} busy={busy} onClick={onConfirm}>{confirmLabel}</Button>
        </DialogFooter>
      </div>
    </ModalFrame>
  );
}

/* ---------- Sheet (right) and Drawer (left) ---------- */
function SideFrame({
  open,
  onClose,
  side,
  labelledBy,
  ariaLabel,
  panelClass,
  wrapClass,
  initialFocus,
  children,
}: {
  open: boolean;
  onClose: () => void;
  side: "left" | "right";
  labelledBy?: string;
  ariaLabel?: string;
  panelClass: string;
  wrapClass?: string;
  initialFocus?: string;
  children: ReactNode;
}) {
  const { mounted, className } = usePresence(open, 360);
  if (!mounted) return null;
  return (
    <Portal>
      <SideLayer onClose={onClose} side={side} labelledBy={labelledBy} ariaLabel={ariaLabel} panelClass={panelClass} wrapClass={wrapClass} initialFocus={initialFocus} stateClass={className}>
        {children}
      </SideLayer>
    </Portal>
  );
}

function SideLayer({
  onClose,
  side,
  labelledBy,
  ariaLabel,
  panelClass,
  wrapClass,
  initialFocus,
  stateClass,
  children,
}: {
  onClose: () => void;
  side: "left" | "right";
  labelledBy: string | undefined;
  ariaLabel: string | undefined;
  panelClass: string;
  wrapClass: string | undefined;
  initialFocus: string | undefined;
  stateClass: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useDialogBehavior(ref, onClose, initialFocus);
  return (
    <div className={cx("admin-ov admin-ov-sheet-wrap fixed inset-0 z-50", wrapClass, stateClass)}>
      <div className="admin-ov-backdrop absolute inset-0 bg-black/15" onClick={onClose} />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-label={labelledBy ? undefined : ariaLabel}
        tabIndex={-1}
        className={cx(side === "right" ? "admin-ov-sheet right-0 border-l" : "admin-ov-drawer left-0", "absolute inset-y-0 flex flex-col border-line bg-paper shadow-[var(--shadow-2)] outline-hidden", panelClass)}
      >
        {children}
      </div>
    </div>
  );
}

export function Sheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  initialFocus,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  initialFocus?: string;
}) {
  const id = useId();
  return (
    <SideFrame open={open} onClose={onClose} side="right" labelledBy={`${id}-title`} panelClass="w-full sm:w-[28rem]" initialFocus={initialFocus}>
      <header className="relative shrink-0 border-b border-line px-6 pt-5 pb-4 pr-14">
        <h2 id={`${id}-title`} className="text-lg font-semibold">{title}</h2>
        {description && <p className="mt-2 text-sm/6 text-pretty text-ink-3">{description}</p>}
        <CloseX onClose={onClose} />
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
      {footer}
    </SideFrame>
  );
}

export function Drawer({ open, onClose, label = "Menu điều hướng", children }: { open: boolean; onClose: () => void; label?: string; children: ReactNode }) {
  return (
    <SideFrame open={open} onClose={onClose} side="left" ariaLabel={label} panelClass="w-[min(86vw,18rem)]" wrapClass="lg:hidden">
      <button type="button" onClick={onClose} className="sr-only">Đóng menu</button>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </SideFrame>
  );
}

/* ---------- Popover / Menu ---------- */
export function Popover({
  open,
  anchorRef,
  onClose,
  width = "trigger",
  align = "start",
  role = "listbox",
  ariaLabel,
  children,
}: {
  open: boolean;
  anchorRef: RefObject<HTMLElement | null>;
  onClose: () => void;
  width?: "trigger" | "auto";
  align?: "start" | "end";
  role?: "listbox" | "menu";
  ariaLabel?: string;
  children: ReactNode;
}) {
  const { mounted, className } = usePresence(open, 120);
  if (!mounted) return null;
  return (
    <Portal>
      <PopoverLayer anchorRef={anchorRef} onClose={onClose} width={width} align={align} role={role} ariaLabel={ariaLabel} stateClass={className}>
        {children}
      </PopoverLayer>
    </Portal>
  );
}

function PopoverLayer({
  anchorRef,
  onClose,
  width,
  align,
  role,
  ariaLabel,
  stateClass,
  children,
}: {
  anchorRef: RefObject<HTMLElement | null>;
  onClose: () => void;
  width: "trigger" | "auto";
  align: "start" | "end";
  role: "listbox" | "menu";
  ariaLabel: string | undefined;
  stateClass: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });

  useLayoutEffect(() => {
    const el = ref.current;
    const anchor = anchorRef.current;
    if (!el || !anchor) return;
    const rect = anchor.getBoundingClientRect();
    const minWidth = width === "trigger" ? rect.width : Math.max(rect.width, 224);
    el.style.minWidth = `${minWidth}px`;
    el.style.maxWidth = `${Math.min(window.innerWidth - 16, Math.max(minWidth, 360))}px`;
    const height = el.offsetHeight;
    const spaceBelow = window.innerHeight - rect.bottom;
    const side = spaceBelow < height + 16 && rect.top > height + 16 ? "top" : "bottom";
    el.dataset.side = side;
    el.style.top = `${side === "bottom" ? rect.bottom + 8 : rect.top - height - 8}px`;
    const widthNow = el.offsetWidth;
    const left = align === "end" ? rect.right - widthNow : rect.left;
    el.style.left = `${Math.max(8, Math.min(left, window.innerWidth - widthNow - 8))}px`;
    el.style.transformOrigin = `${align === "end" ? "right" : "left"} ${side === "bottom" ? "top" : "bottom"}`;
  }, [anchorRef, width, align]);

  useEffect(() => {
    const el = ref.current;
    const anchor = anchorRef.current;
    const focusFrame = requestAnimationFrame(() => {
      const target = el?.querySelector<HTMLElement>("[data-pop-search]") ?? el?.querySelector<HTMLElement>('[role="option"][aria-selected="true"], [role="option"], [role="menuitem"]');
      target?.focus({ preventScroll: true });
    });
    const onPointer = (event: MouseEvent) => {
      const target = event.target as Node;
      if (el?.contains(target) || anchor?.contains(target)) return;
      closeRef.current();
    };
    const onResize = () => closeRef.current();
    document.addEventListener("mousedown", onPointer);
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(focusFrame);
      document.removeEventListener("mousedown", onPointer);
      window.removeEventListener("resize", onResize);
      const active = document.activeElement;
      if (anchor && document.contains(anchor) && (active === document.body || (el && el.contains(active)))) anchor.focus({ preventScroll: true });
    };
  }, [anchorRef]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key === "Tab") {
      onClose();
      return;
    }
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp" && event.key !== "Home" && event.key !== "End") return;
    const el = ref.current;
    if (!el) return;
    const stops = [...el.querySelectorAll<HTMLElement>('[data-pop-search], [role="option"], [role="menuitem"]')].filter((n) => !n.hidden);
    if (!stops.length) return;
    event.preventDefault();
    const index = stops.indexOf(document.activeElement as HTMLElement);
    let next = index;
    if (event.key === "ArrowDown") next = index < 0 ? 0 : Math.min(stops.length - 1, index + 1);
    else if (event.key === "ArrowUp") next = index < 0 ? stops.length - 1 : Math.max(0, index - 1);
    else if (event.key === "Home") next = 0;
    else next = stops.length - 1;
    stops[next]?.focus({ preventScroll: false });
  };

  return (
    <div
      ref={ref}
      data-admin-popover=""
      role={role}
      aria-label={ariaLabel}
      onKeyDown={onKeyDown}
      className={cx("admin-pop fixed z-[60] rounded-2xl border border-line bg-paper py-1 shadow-[var(--shadow-2)]", stateClass)}
    >
      {children}
    </div>
  );
}

/** Convenience wrapper: a menu of PopItems anchored to a trigger. */
export function Menu(props: Omit<Parameters<typeof Popover>[0], "role">) {
  return <Popover {...props} role="menu" />;
}

/* ---------- Combobox (listbox trigger with optional search) ---------- */
export interface ComboboxItem {
  value: string;
  label: string;
  sub?: string;
}

export function Combobox({
  id,
  value,
  onChange,
  items,
  placeholder,
  searchPlaceholder = "Tìm...",
  emptyText = "Không tìm thấy mục nào",
  invalid = false,
  describedBy,
  disabled = false,
  className,
}: {
  id?: string;
  value: string | null;
  onChange: (value: string) => void;
  items: ComboboxItem[];
  placeholder: string;
  searchPlaceholder?: string;
  emptyText?: string;
  invalid?: boolean;
  describedBy?: string | undefined;
  disabled?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchable = items.length > 8;
  const selected = items.find((item) => item.value === value);
  const visible = useMemo(() => {
    const needle = term.trim().toLocaleLowerCase("vi");
    if (!needle) return items;
    return items.filter((item) => `${item.label} ${item.sub ?? ""}`.toLocaleLowerCase("vi").includes(needle));
  }, [items, term]);
  const close = useCallback(() => {
    setOpen(false);
    setTerm("");
  }, []);
  return (
    <>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={undefined}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            setOpen(true);
          }
        }}
        className={cx(
          "group flex h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-xl border border-line-strong bg-paper px-4 text-left text-base outline-hidden transition-colors focus-visible:border-orange aria-expanded:border-orange aria-expanded:ring-2 aria-expanded:ring-orange/15 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-red-500 md:h-10 md:text-sm",
          className,
        )}
      >
        <span className={cx("truncate", !selected && "text-ink-3")}>{selected ? selected.label : placeholder}</span>
        <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-ink-3 transition-transform group-aria-expanded:rotate-180" />
      </button>
      <Popover open={open} anchorRef={triggerRef} onClose={close} ariaLabel={placeholder}>
        {searchable && (
          <div className="border-b border-line px-1 pb-1">
            <div className="relative">
              <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-3" />
              <input
                data-pop-search=""
                type="text"
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                className={cx(INPUT, "h-10 border-0 bg-transparent pr-3 pl-9 focus:ring-0 md:h-10")}
              />
            </div>
          </div>
        )}
        <div className={cx("px-1", searchable && "max-h-76 overflow-y-auto pt-1")}>
          {visible.map((item) => (
            <PopItem
              key={item.value}
              label={item.label}
              sub={item.sub}
              selected={item.value === value}
              onClick={() => {
                onChange(item.value);
                close();
              }}
            />
          ))}
          {visible.length === 0 && <p className="px-3 py-3 text-center text-sm text-ink-3">{emptyText}</p>}
        </div>
      </Popover>
    </>
  );
}
