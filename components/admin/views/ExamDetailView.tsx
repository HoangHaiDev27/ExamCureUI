"use client";

import { useAdminData } from "../AdminData";
import { ErrorBlock, SkeletonView } from "../ui";

// Placeholder: the full view is implemented in a later task.
export function ExamDetailView({ examId }: { examId: string }) {
  const { loading, error, reload } = useAdminData();
  if (loading) return <SkeletonView kind="table" />;
  if (error) return <ErrorBlock onRetry={() => void reload()} />;
  return <h2 data-exam-id={examId} className="text-base font-semibold">Chi tiết đề thi</h2>;
}
