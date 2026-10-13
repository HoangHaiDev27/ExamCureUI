"use client";

import type { ReactNode } from "react";
import { SCHOOLS } from "@/lib/schools";
import type { AdminOverview, ServiceStatus } from "@/lib/admin";
import { useAdminData } from "../AdminData";
import { ErrorBlock, SkeletonView } from "../ui";

export const schoolAbbr = (id: string | null | undefined): string | null =>
  id ? (SCHOOLS.find((s) => s.id === id)?.abbr ?? id.toUpperCase()) : null;

export const clip = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text);

export function Code({ children }: { children: ReactNode }) {
  return <span className="font-mono text-ink">{children}</span>;
}

/** Shows the page skeleton while loading and the error block when the overview failed. */
export function ViewGate({
  kind = "table",
  children,
}: {
  kind?: "overview" | "table";
  children: (overview: AdminOverview, services: ServiceStatus["services"] | null) => ReactNode;
}) {
  const { overview, services, loading, error, reload } = useAdminData();
  if (error) return <ErrorBlock onRetry={() => void reload()} />;
  if (loading || !overview) return <SkeletonView kind={kind} />;
  return <>{children(overview, services)}</>;
}
