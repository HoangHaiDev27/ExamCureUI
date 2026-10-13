"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { CircleAlert, CircleCheck } from "lucide-react";
import { getOverview, getServiceStatus, type AdminOverview, type ServiceStatus } from "@/lib/admin";
import { cx } from "./ui";

/* ====================== Toasts ====================== */
export interface ToastInput {
  tone: "success" | "error";
  title: string;
  detail?: string;
  action?: { label: string; onClick: () => void };
}
interface ToastEntry extends ToastInput {
  id: number;
}

const ToastContext = createContext<{ toast: (input: ToastInput) => void } | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

const TOAST_MS = 5000;
const MAX_TOASTS = 3;

function ToastItem({ entry, onRemove }: { entry: ToastEntry; onRemove: (id: number) => void }) {
  const [phase, setPhase] = useState<"enter" | "in" | "out">("enter");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const removeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setPhase("out");
    removeTimer.current = setTimeout(() => onRemove(entry.id), 220);
  }, [entry.id, onRemove]);
  const start = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(dismiss, TOAST_MS);
  }, [dismiss]);

  useEffect(() => {
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => setPhase((p) => (p === "enter" ? "in" : p)));
    });
    start();
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
      if (timer.current) clearTimeout(timer.current);
      if (removeTimer.current) clearTimeout(removeTimer.current);
    };
  }, [start]);

  const isError = entry.tone === "error";
  const Icon = isError ? CircleAlert : CircleCheck;
  return (
    <div
      role={isError ? "alert" : "status"}
      onMouseEnter={() => {
        if (timer.current) clearTimeout(timer.current);
      }}
      onMouseLeave={() => {
        if (phase !== "out") start();
      }}
      className={cx(
        "admin-toast pointer-events-auto flex w-auto max-w-md min-w-72 items-center gap-3 rounded-2xl border border-line bg-paper py-3 pr-3 pl-4 shadow-[var(--shadow-2)]",
        phase === "in" && "is-in",
        phase === "out" && "is-out",
      )}
    >
      <Icon aria-hidden="true" className={cx("size-5 shrink-0", isError ? "text-red-600" : "text-emerald-600")} />
      <div className="min-w-0 flex-1">
        <p className={cx("text-sm text-pretty", entry.detail && "font-medium")}>{entry.title}</p>
        {entry.detail && <p className="text-sm text-pretty text-ink-3">{entry.detail}</p>}
      </div>
      {entry.action && (
        <button
          type="button"
          onClick={() => {
            entry.action?.onClick();
            dismiss();
          }}
          className="h-8 shrink-0 cursor-pointer rounded-lg px-3 text-sm font-medium outline-hidden hover:bg-paper-3 focus-visible:ring-2 focus-visible:ring-orange/30"
        >
          {entry.action.label}
        </button>
      )}
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const nextId = useRef(1);
  const toast = useCallback((input: ToastInput) => {
    const entry = { ...input, id: nextId.current++ };
    setToasts((current) => [...current, entry].slice(-MAX_TOASTS));
  }, []);
  const remove = useCallback((id: number) => setToasts((current) => current.filter((t) => t.id !== id)), []);
  const value = useMemo(() => ({ toast }), [toast]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      <section
        aria-live="polite"
        aria-label="Thông báo"
        className="pointer-events-none fixed inset-x-0 top-3 z-[70] flex flex-col-reverse items-center gap-2 px-4 sm:top-auto sm:bottom-6 sm:flex-col"
      >
        {toasts.map((entry) => (
          <ToastItem key={entry.id} entry={entry} onRemove={remove} />
        ))}
      </section>
    </ToastContext.Provider>
  );
}

/* ====================== Overview data ====================== */
export interface AdminDataValue {
  overview: AdminOverview | null;
  services: ServiceStatus["services"] | null;
  loading: boolean;
  error: boolean;
  refreshing: boolean;
  reload: () => Promise<void>;
}

const AdminDataContext = createContext<AdminDataValue | null>(null);

export function useAdminData() {
  const ctx = useContext(AdminDataContext);
  if (!ctx) throw new Error("useAdminData must be used inside <AdminDataProvider>");
  return ctx;
}

const POLL_MS = 5000;
const clip = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text);

export function needsPolling(overview: AdminOverview | null): boolean {
  if (!overview) return false;
  if (overview.exams.some((e) => e.status === "generating")) return true;
  return overview.materials.some((m) =>
    m.material_versions.some((v) => v.status === "uploading" || v.status === "uploaded" || v.status === "processing"),
  );
}

export function AdminDataProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { toast } = useToast();
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [services, setServices] = useState<ServiceStatus["services"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const known = useRef<Map<string, string> | null>(null);
  const inFlight = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const announce = useCallback(
    (next: AdminOverview) => {
      const previous = known.current;
      known.current = new Map(next.exams.map((e) => [e.id, e.status]));
      if (!previous) return;
      for (const exam of next.exams) {
        if (previous.get(exam.id) !== "generating") continue;
        if (exam.status === "draft")
          toast({
            tone: "success",
            title: `Đã soạn xong “${clip(exam.title, 30)}”`,
            detail: `${exam.question_count} câu chờ bạn kiểm`,
            action: { label: "Xem đề", onClick: () => router.push(`/admin/de-thi/${exam.id}`) },
          });
        else if (exam.status === "failed")
          toast({ tone: "error", title: "Không soạn được đề", ...(exam.error_message ? { detail: exam.error_message } : {}) });
      }
    },
    [router, toast],
  );

  type FetchResult =
    | { status: "aborted" }
    | { status: "failed"; services: ServiceStatus["services"] | null }
    | { status: "ok"; overview: AdminOverview; services: ServiceStatus["services"] | null };

  const fetchAll = useCallback(async (signal: AbortSignal | undefined, withServices: boolean): Promise<FetchResult> => {
    const [overviewResult, servicesResult] = await Promise.allSettled([
      getOverview(signal),
      withServices ? getServiceStatus(signal) : Promise.resolve(null),
    ]);
    if (signal?.aborted || !mounted.current) return { status: "aborted" };
    const nextServices = servicesResult.status === "fulfilled" && servicesResult.value ? servicesResult.value.services : null;
    if (overviewResult.status === "fulfilled") return { status: "ok", overview: overviewResult.value, services: nextServices };
    return { status: "failed", services: nextServices };
  }, []);

  const apply = useCallback(
    (result: FetchResult) => {
      if (result.status === "aborted") return;
      if (result.services) setServices(result.services);
      if (result.status === "ok") {
        announce(result.overview);
        setOverview(result.overview);
        setError(false);
      } else setError(true);
    },
    [announce],
  );

  // Initial load.
  useEffect(() => {
    const controller = new AbortController();
    void fetchAll(controller.signal, true).then((result) => {
      if (result.status === "aborted") return;
      apply(result);
      setLoading(false);
    });
    return () => controller.abort();
  }, [fetchAll, apply]);

  const reload = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setRefreshing(true);
    try {
      const result = await fetchAll(undefined, true);
      apply(result);
      if (result.status === "failed") toast({ tone: "error", title: "Không làm mới được dữ liệu" });
    } finally {
      inFlight.current = false;
      if (mounted.current) {
        setRefreshing(false);
        setLoading(false);
      }
    }
  }, [fetchAll, apply, toast]);

  // Poll while something is still being generated or processed.
  const polling = needsPolling(overview);
  useEffect(() => {
    if (!polling) return undefined;
    const controller = new AbortController();
    const timer = setInterval(() => {
      if (inFlight.current) return;
      inFlight.current = true;
      void fetchAll(controller.signal, false)
        .then((result) => {
          if (result.status === "ok") apply(result);
        })
        .finally(() => {
          inFlight.current = false;
        });
    }, POLL_MS);
    return () => {
      clearInterval(timer);
      controller.abort();
      inFlight.current = false;
    };
  }, [polling, fetchAll, apply]);

  const value = useMemo<AdminDataValue>(
    () => ({ overview, services, loading, error: error && !overview, refreshing, reload }),
    [overview, services, loading, error, refreshing, reload],
  );
  return <AdminDataContext.Provider value={value}>{children}</AdminDataContext.Provider>;
}
