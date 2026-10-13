import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Lazy, cached loader. `load` must be a stable (useCallback) function.
 * Fetches once when `enabled` first becomes true and keeps the data for the
 * lifetime of the component; `reload` re-runs it (e.g. after an error).
 */
export function useResource<T>(
  load: (signal: AbortSignal) => Promise<T>,
  enabled: boolean,
) {
  const [state, setState] = useState<{ data: T | null; loading: boolean; error: string | null }>(
    { data: null, loading: false, error: null },
  );
  const done = useRef(false);

  const run = useCallback(async (signal?: AbortSignal) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await load(signal ?? new AbortController().signal);
      if (signal?.aborted) return;
      done.current = true;
      setState({ data, loading: false, error: null });
    } catch (reason) {
      if (signal?.aborted) return;
      setState((s) => ({
        ...s,
        loading: false,
        error: reason instanceof Error ? reason.message : "Không thể tải dữ liệu.",
      }));
    }
  }, [load]);

  useEffect(() => {
    if (!enabled || done.current) return;
    const controller = new AbortController();
    const timer = setTimeout(() => void run(controller.signal), 0);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [enabled, run]);

  return {
    data: state.data,
    error: state.error,
    loading: state.loading || (enabled && state.data === null && state.error === null),
    reload: () => void run(),
  };
}
