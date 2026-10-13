"use client";

import Link from "next/link";
import { useCallback } from "react";
import { ApiError } from "@/lib/api";
import { getAttempt, type AttemptDetail } from "@/lib/catalog";
import { getSchool } from "@/lib/schools";
import { useResource } from "@/lib/useResource";
import type { School } from "@/lib/types";
import { ResultView } from "./ResultView";
import { ErrorCard, LoadingCard, RequireUser, StatusCard, primaryAction } from "./status";

type AttemptResult = { kind: "ok"; attempt: AttemptDetail } | { kind: "missing" };

export function ResultLoader({ school, attemptId }: { school: School; attemptId?: string }) {
  if (!attemptId)
    return (
      <StatusCard
        title="Chưa chọn kết quả để xem"
        actions={<Link href="/dashboard?tab=lich-su" className={primaryAction}>Xem lịch sử thi</Link>}
      />
    );
  return <RequireUser>{() => <ResultStage key={attemptId} school={school} attemptId={attemptId} />}</RequireUser>;
}

function ResultStage({ school, attemptId }: { school: School; attemptId: string }) {
  const load = useCallback(async (signal: AbortSignal): Promise<AttemptResult> => {
    try {
      return { kind: "ok", attempt: await getAttempt(attemptId, signal) };
    } catch (reason) {
      if (reason instanceof ApiError && reason.status === 404) return { kind: "missing" };
      throw reason;
    }
  }, [attemptId]);
  const res = useResource(load, true);
  if (res.error && res.data === null) return <ErrorCard message={res.error} onRetry={res.reload} />;
  if (res.loading || !res.data) return <LoadingCard label="Đang tải kết quả…" />;
  if (res.data.kind === "missing")
    return (
      <StatusCard
        title="Không tìm thấy kết quả"
        actions={<Link href="/dashboard?tab=lich-su" className={primaryAction}>Xem lịch sử thi</Link>}
      />
    );
  const { attempt } = res.data;
  return <ResultView school={getSchool(attempt.subject.schoolCode) ?? school} attempt={attempt} />;
}
