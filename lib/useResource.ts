import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Lazy, cached loader. `load` must be a stable (useCallback) function.
 * Fetches once when `enabled` first becomes true and keeps the data while the
 * same `load` is in use; a new `load` identity resets the cache and refetches.
 * `reload` aborts any in-flight request before starting a new one, and
 * everything in flight is aborted on unmount.
 */
export function useResource<T>(
  load: (signal: AbortSignal) => Promise<T>,
  enabled: boolean,
) {
  const [state, setState] = useState<{
    owner: typeof load;
    data: T | null;
    loading: boolean;
    error: string | null;
  }>({ owner: load, data: null, loading: false, error: null });
  const done = useRef(false);
  const lastLoad = useRef(load);
  const controllerRef = useRef<AbortController | null>(null);

  const run = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    const { signal } = controller;
    setState((s) => ({ owner: load, data: s.owner === load ? s.data : null, loading: true, error: null }));
    try {
      const data = await load(signal);
      if (signal.aborted) return;
      done.current = true;
      setState({ owner: load, data, loading: false, error: null });
    } catch (reason) {
      if (signal.aborted) return;
      setState((s) => ({
        owner: load,
        data: s.owner === load ? s.data : null,
        loading: false,
        error: reason instanceof Error ? reason.message : "Không thể tải dữ liệu.",
      }));
    }
  }, [load]);

  useEffect(() => {
    if (lastLoad.current !== load) {
      lastLoad.current = load;
      done.current = false;
    }
    if (!enabled || done.current) return;
    const timer = setTimeout(() => void run(), 0);
    return () => {
      clearTimeout(timer);
      controllerRef.current?.abort();
    };
  }, [enabled, load, run]);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const fresh = state.owner === load;
  const data = fresh ? state.data : null;
  const error = fresh ? state.error : null;
  return {
    data,
    error,
    loading: (fresh && state.loading) || (enabled && data === null && error === null),
    reload: () => void run(),
  };
}
