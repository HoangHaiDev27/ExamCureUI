"use client";

import Link from "next/link";
import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api";
import {
  codeFromRouteId,
  getExam,
  listSubjectExams,
  listSubjects,
  subjectRouteId,
  type CatalogSubject,
  type ExamDetail,
  type ExamSummary,
} from "@/lib/catalog";
import { lookupSubject, type SubjectLookup } from "@/lib/subject-detail";
import { toRoomQuestions } from "@/lib/exam-helpers";
import { useResource } from "@/lib/useResource";
import type { School } from "@/lib/types";
import { ExamRoom, type RoomStudent } from "./ExamRoom";
import { ErrorCard, LoadingCard, RequireUser, StatusCard, primaryAction, secondaryAction } from "./status";

type Student = RoomStudent;

type ExamResult = { kind: "ok"; exam: ExamDetail } | { kind: "missing" } | { kind: "empty" };

export function ExamLoader({ school, routeId, examId }: { school: School; routeId: string; examId?: string }) {
  return (
    <RequireUser latch>
      {(user) => (
        <SubjectStage
          school={school}
          routeId={routeId}
          examId={examId}
          student={{ id: user.id ?? "", name: user.name, mssv: user.mssv }}
        />
      )}
    </RequireUser>
  );
}

function SubjectStage({ school, routeId, examId, student }: { school: School; routeId: string; examId?: string; student: Student }) {
  const code = codeFromRouteId(school.id, routeId);
  const load = useCallback(
    async (signal: AbortSignal): Promise<SubjectLookup<CatalogSubject>> =>
      code ? lookupSubject(await listSubjects(school.id, { code, signal })) : { kind: "missing" },
    [school.id, code],
  );
  const res = useResource(load, true);
  if (res.error && res.data === null) return <ErrorCard message={res.error} onRetry={res.reload} />;
  if (res.loading || !res.data) return <LoadingCard label="Đang tải môn học…" />;
  if (res.data.kind === "missing")
    return (
      <StatusCard
        title="Không tìm thấy môn học"
        actions={<Link href="/dashboard?tab=mon-hoc" className={primaryAction}>Về danh mục môn học</Link>}
      />
    );
  return examId
    ? <ExamStage key={`${student.id}:${examId}`} school={school} subject={res.data.subject} examId={examId} student={student} />
    : <ExamListStage school={school} subject={res.data.subject} student={student} />;
}

function ExamListStage({ school, subject, student }: { school: School; subject: CatalogSubject; student: Student }) {
  const router = useRouter();
  const load = useCallback((signal: AbortSignal) => listSubjectExams(subject.id, signal), [subject.id]);
  const res = useResource(load, true);
  if (res.error && res.data === null) return <ErrorCard message={res.error} onRetry={res.reload} />;
  if (res.loading || !res.data) return <LoadingCard label="Đang tải danh sách đề…" />;
  const exams: ExamSummary[] = res.data;
  if (exams.length === 0)
    return (
      <StatusCard
        title="Môn này chưa có đề thi"
        actions={<Link href="/dashboard?tab=de-thi" className={primaryAction}>Xem đề thi khác</Link>}
      />
    );
  if (exams.length === 1) return <ExamStage key={`${student.id}:${exams[0]!.id}`} school={school} subject={subject} examId={exams[0]!.id} student={student} />;
  return (
    <div className="min-h-[100dvh] bg-paper-2 px-5 py-10">
      <div className="mx-auto max-w-xl">
        <p className="text-[12px] font-semibold uppercase tracking-wide text-ink-3">{school.abbr} · Thi thử</p>
        <h1 className="mt-1 font-display text-[24px] font-semibold text-ink">
          {subject.name} <span className="text-ink-3">· {subject.code}</span>
        </h1>
        <p className="mt-1 text-[14px] text-ink-2">Chọn một đề để bắt đầu.</p>
        <ul className="mt-5 divide-y divide-line overflow-hidden rounded-[10px] border border-line bg-paper shadow-[var(--shadow-1)]">
          {exams.map((e) => (
            <li key={e.id} className="flex items-center gap-4 px-5 py-4">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14.5px] font-semibold text-ink">{e.title}</p>
                <p className="mt-0.5 text-[12.5px] text-ink-3">
                  {e.durationMinutes} phút · {e.questionCount} câu
                  {e.lastScore != null && <> · Gần nhất {e.lastScore.toFixed(1)}</>}
                </p>
              </div>
              <button
                type="button"
                onClick={() => router.replace(`/exam/${school.id}/${subjectRouteId(school.id, subject.code)}?exam=${e.id}`)}
                className={primaryAction}
              >
                Vào thi
              </button>
            </li>
          ))}
        </ul>
        <Link href="/dashboard?tab=de-thi" className={`${secondaryAction} mt-5`}>Quay lại</Link>
      </div>
    </div>
  );
}

function ExamStage({ school, subject, examId, student }: { school: School; subject: CatalogSubject; examId: string; student: Student }) {
  const load = useCallback(async (signal: AbortSignal): Promise<ExamResult> => {
    try {
      return { kind: "ok", exam: await getExam(examId, signal) };
    } catch (reason) {
      if (reason instanceof ApiError && reason.status === 404) return { kind: "missing" };
      if (reason instanceof ApiError && reason.status === 409) return { kind: "empty" };
      throw reason;
    }
  }, [examId]);
  const res = useResource(load, true);
  const prepared = useMemo(() => (res.data?.kind === "ok" ? toRoomQuestions(res.data.exam) : null), [res.data]);
  if (res.error && res.data === null) return <ErrorCard message={res.error} onRetry={res.reload} />;
  if (res.loading || !res.data) return <LoadingCard label="Đang tải đề thi…" />;
  if (res.data.kind === "missing")
    return (
      <StatusCard
        title="Đề thi không tồn tại hoặc đã bị gỡ"
        actions={<Link href="/dashboard?tab=de-thi" className={primaryAction}>Xem đề thi khác</Link>}
      />
    );
  if (res.data.kind === "empty")
    return (
      <StatusCard
        title="Đề thi chưa có câu hỏi"
        actions={<Link href="/dashboard?tab=de-thi" className={primaryAction}>Xem đề thi khác</Link>}
      />
    );
  const { exam } = res.data;
  return (
    <ExamRoom
      key={`${student.id}:${exam.id}`}
      student={student}
      school={school}
      subject={{ id: subject.id, code: subject.code, name: subject.name }}
      exam={{ id: exam.id, title: exam.title, durationMinutes: exam.durationMinutes }}
      questions={prepared!.questions}
      positions={prepared!.positions}
    />
  );
}
