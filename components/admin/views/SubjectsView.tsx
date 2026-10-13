"use client";

import { useAdminData } from "../AdminData";
import { ErrorBlock, SkeletonView } from "../ui";

// Placeholder: the full view is implemented in a later task.
export function SubjectsView() {
  const { loading, error, reload } = useAdminData();
  if (loading) return <SkeletonView kind="table" />;
  if (error) return <ErrorBlock onRetry={() => void reload()} />;
  return <h2 className="text-base font-semibold">Môn học</h2>;
}
