"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronRight, FileChartColumn, Pencil, Send, Sparkles, Trash2, TriangleAlert, X } from "lucide-react";
import {
  DIFFICULTY_LABEL,
  deleteExam,
  formatAdminDate,
  getExam,
  publishExam,
  reviewQuestion,
  subjectCode,
  type AdminExamDetail,
  type AdminQuestion,
  type ReviewQuestionBody,
} from "@/lib/admin";
import { ApiError } from "@/lib/api";
import { QuestionEditForm, type QuestionEditValues } from "../forms/QuestionEditForm";
import { useAdminData, useToast } from "../AdminData";
import { ConfirmDialog } from "../overlays";
import { Badge, Button, EmptyLine, ErrorBlock, SkeletonRows, SkeletonView, cx } from "../ui";
import { Code } from "./common";
import { ExamStatusBadge } from "./ExamsView";

const letter = (position: number) => String.fromCharCode(65 + position);
const POLL_MS = 5000;

function OptionsGrid({ question }: { question: AdminQuestion }) {
  return (
    <ol className="mt-3 grid gap-2 sm:grid-cols-2">
      {[...question.options]
        .sort((a, b) => a.position - b.position)
        .map((o) => (
          <li
            key={o.position}
            className={cx(
              "flex items-start gap-3 rounded-xl border px-3 py-2.5 text-sm",
              o.is_correct ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-line bg-paper text-ink",
            )}
          >
            <span className={cx("inline-flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold", o.is_correct ? "bg-emerald-700 text-white" : "bg-paper-3 text-ink/70")}>
              {letter(o.position)}
            </span>
            <span className="min-w-0 pt-0.5 text-pretty">
              {o.content}
              {o.is_correct && <span className="sr-only"> (đáp án đúng)</span>}
            </span>
          </li>
        ))}
    </ol>
  );
}

function SourcesBlock({ question }: { question: AdminQuestion }) {
  if (!question.sources.length)
    return (
      <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-amber-700">
        <TriangleAlert aria-hidden="true" className="size-4 shrink-0" />
        Không tìm thấy đoạn nguồn cho câu này. Kiểm kỹ đáp án.
      </p>
    );
  return (
    <details className="group mt-3">
      <summary className="inline-flex h-8 cursor-pointer list-none items-center gap-1.5 text-sm font-medium text-ink/70 outline-hidden hover:text-ink focus-visible:ring-2 focus-visible:ring-orange/30 [&::-webkit-details-marker]:hidden">
        <ChevronRight aria-hidden="true" className="size-4 transition-transform duration-200 group-open:rotate-90" />
        Nguồn: slide {question.sources.map((s) => s.slide_number).join(", ")}
      </summary>
      <div className="mt-1 flex flex-col gap-2">
        {question.sources.map((s, i) => (
          <blockquote key={i} className="rounded-xl bg-paper-2 px-3 py-2.5 text-sm text-pretty">
            <p className="text-xs font-medium text-ink-3">Slide {s.slide_number}</p>
            <p className="mt-0.5 text-ink/80">{s.excerpt}</p>
          </blockquote>
        ))}
      </div>
    </details>
  );
}

export function ExamDetailView({ examId }: { examId: string }) {
  const { overview, reload } = useAdminData();
  const { toast } = useToast();
  const router = useRouter();
  const [detail, setDetail] = useState<AdminExamDetail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [failed, setFailed] = useState(false);
  const [key, setKey] = useState(0);
  const [syncedStatus, setSyncedStatus] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  // Load, and re-load when asked (key).
  useEffect(() => {
    const controller = new AbortController();
    getExam(examId, controller.signal)
      .then((d) => {
        setDetail(d);
        setNotFound(false);
        setFailed(false);
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return;
        if (reason instanceof ApiError && reason.status === 404) setNotFound(true);
        else setFailed(true);
      });
    return () => controller.abort();
  }, [examId, key]);

  // Poll while the exam is still being generated.
  const generating = detail?.exam.status === "generating";
  useEffect(() => {
    if (!generating) return undefined;
    const controller = new AbortController();
    const timer = setInterval(() => {
      getExam(examId, controller.signal)
        .then((d) => setDetail(d))
        .catch(() => undefined);
    }, POLL_MS);
    return () => {
      clearInterval(timer);
      controller.abort();
    };
  }, [generating, examId]);

  // Re-fetch when the overview reports a different status than the loaded detail.
  const overviewStatus = overview?.exams.find((e) => e.id === examId)?.status ?? null;
  if (detail && overviewStatus && overviewStatus !== detail.exam.status && syncedStatus !== overviewStatus) {
    setSyncedStatus(overviewStatus);
    setKey((k) => k + 1);
  }

  const title = detail?.exam.title;
  useEffect(() => {
    if (!title) return undefined;
    document.title = `${title} · Quản trị ExamCure`;
    return () => {
      document.title = "Đề thi · Quản trị ExamCure";
    };
  }, [title]);

  if (notFound)
    return (
      <div className="rounded-2xl border border-line bg-paper">
        <EmptyLine>
          Không tìm thấy đề này. Có thể đề đã bị xoá.{" "}
          <Link href="/admin/de-thi" className="font-medium text-ink underline-offset-4 hover:underline">Về danh sách đề</Link>
        </EmptyLine>
      </div>
    );
  if (failed && !detail) return <ErrorBlock onRetry={() => { setFailed(false); setKey((k) => k + 1); }} />;
  if (!detail || !overview) return <SkeletonView kind="table" />;

  const { exam, questions } = detail;
  const subject = overview.subjects.find((s) => s.id === exam.subject_id);
  const isDraft = exam.status === "draft";
  const checked = questions.filter((q) => q.status === "approved").length;
  const total = questions.length;
  const count = exam.status === "generating" ? exam.requested_count : total;
  const created = formatAdminDate(exam.created_at).replace("Hôm nay", "hôm nay").replace("Hôm qua", "hôm qua");

  const sortByPosition = (list: AdminQuestion[]) => [...list].sort((a, b) => a.position - b.position);
  const review = async (snapshot: AdminExamDetail, next: AdminExamDetail, id: string, body: ReviewQuestionBody) => {
    setDetail(next);
    try {
      await reviewQuestion(id, body);
      void reload();
      return true;
    } catch (reason) {
      setDetail(snapshot);
      toast({ tone: "error", title: "Không cập nhật được câu hỏi", detail: reason instanceof Error ? reason.message : "Vui lòng thử lại." });
      return false;
    }
  };
  const mapQuestion = (id: string, change: Partial<AdminQuestion>): AdminExamDetail => ({
    ...detail,
    questions: questions.map((q) => (q.id === id ? { ...q, ...change } : q)),
  });

  const toggleChecked = (q: AdminQuestion) => {
    const status = q.status === "approved" ? "draft" : "approved";
    void review(detail, mapQuestion(q.id, { status }), q.id, { status });
  };
  const remove = async (q: AdminQuestion, index: number) => {
    const snapshot = detail;
    const ok = await review(snapshot, { ...detail, questions: questions.filter((x) => x.id !== q.id) }, q.id, { status: "rejected" });
    if (!ok) return;
    toast({
      tone: "success",
      title: `Đã bỏ câu ${index + 1} khỏi đề`,
      action: {
        label: "Hoàn tác",
        onClick: () => {
          void reviewQuestion(q.id, { status: q.status })
            .then(() => {
              setDetail((current) => (current && !current.questions.some((x) => x.id === q.id) ? { ...current, questions: sortByPosition([...current.questions, q]) } : current));
              void reload();
            })
            .catch((reason: unknown) => toast({ tone: "error", title: "Không hoàn tác được", detail: reason instanceof Error ? reason.message : "Vui lòng thử lại." }));
        },
      },
    });
  };
  const cancelEdit = (id: string) => {
    setEditing(null);
    requestAnimationFrame(() => document.getElementById(`edit-${id}`)?.focus({ preventScroll: true }));
  };
  const saveEdit = async (q: AdminQuestion, values: QuestionEditValues) => {
    const next = mapQuestion(q.id, {
      status: "approved",
      prompt: values.prompt,
      explanation: values.explanation,
      options: values.options.map((o) => ({ position: o.position, content: o.content, is_correct: o.isCorrect })),
    });
    setEditing(null);
    const ok = await review(detail, next, q.id, { status: "approved", prompt: values.prompt, explanation: values.explanation, options: values.options });
    if (ok) {
      toast({ tone: "success", title: "Đã lưu câu hỏi", detail: "Câu đã sửa được tính là đã kiểm" });
      requestAnimationFrame(() => document.getElementById(`q-${q.id}`)?.scrollIntoView({ block: "nearest" }));
    } else setEditing(q.id);
  };

  const confirmPublish = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await publishExam(exam.id);
      setPublishOpen(false);
      toast({ tone: "success", title: "Đã xuất bản đề", detail: `Sinh viên ${subject ? subjectCode(subject) : ""} đã thấy đề`.replace("  ", " ") });
      setKey((k) => k + 1);
      void reload();
    } catch (reason) {
      setPublishOpen(false);
      toast({ tone: "error", title: "Không xuất bản được đề", detail: reason instanceof Error ? reason.message : "Vui lòng thử lại." });
    } finally {
      setBusy(false);
    }
  };
  const confirmDelete = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await deleteExam(exam.id);
      setDeleteOpen(false);
      toast({ tone: "success", title: "Đã xoá đề" });
      void reload();
      router.replace("/admin/de-thi");
    } catch (reason) {
      setDeleteOpen(false);
      toast({ tone: "error", title: "Không xoá được đề", detail: reason instanceof Error ? reason.message : "Vui lòng thử lại." });
    } finally {
      setBusy(false);
    }
  };

  const unchecked = total - checked;
  const code = subject ? subjectCode(subject) : "";
  const metaParts = [
    `${count} câu`,
    `${exam.duration_minutes} phút`,
    ...(exam.difficulty ? [DIFFICULTY_LABEL[exam.difficulty]] : []),
    `Tạo ${created}`,
  ];

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-semibold text-balance">{exam.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-3">
            <ExamStatusBadge status={exam.status} />
            <span className="min-w-0">
              {subject && (
                <>
                  <Code>{code}</Code> · {subject.name} ·{" "}
                </>
              )}
              {metaParts.join(" · ")}
            </span>
          </div>
        </div>
        {(isDraft || exam.status === "failed") && (
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row [&>button]:w-full sm:[&>button]:w-auto">
            {isDraft && (
              <Button variant="primary" icon={Send} onClick={() => setPublishOpen(true)} disabled={total === 0} title={total === 0 ? "Đề chưa có câu hỏi nào" : undefined}>
                Xuất bản đề
              </Button>
            )}
            <Button variant="outline" icon={Trash2} onClick={() => setDeleteOpen(true)}>Xoá đề</Button>
          </div>
        )}
      </header>

      {exam.source === "ai" ? (
        <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5 text-sm text-pretty text-amber-900 sm:px-5">
          <Sparkles aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-amber-700" />
          <div>
            <p className="font-medium">AI tự soạn theo kiến thức chung</p>
            <p className="mt-0.5">Lúc tạo đề, {code} chưa có tài liệu nào đã lập chỉ mục, nên các câu không có trích dẫn slide. Kiểm kỹ đáp án và lời giải trước khi xuất bản.</p>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-line bg-paper px-4 py-3.5 text-sm sm:px-5">
          <p className="font-medium">Soạn từ {exam.source_versions.length} tài liệu</p>
          <ul className="mt-1 flex flex-col gap-0.5 text-ink-3">
            {exam.source_versions.map((v) => (
              <li key={v.id} className="flex min-w-0 items-center gap-2">
                <FileChartColumn aria-hidden="true" className="size-4 shrink-0" />
                <span className="truncate">
                  {v.title ?? "Tài liệu đã xoá"}
                  {v.version_number > 1 ? ` (v${v.version_number})` : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {exam.status === "generating" && (
        <section aria-busy="true" className="overflow-hidden rounded-2xl border border-line bg-paper">
          <p className="flex items-center gap-2 px-5 py-4 text-sm text-ink-3">
            <span className="inline-flex size-4 animate-spin rounded-full border-2 border-ink-3 border-t-transparent motion-reduce:animate-none" aria-hidden="true" />
            AI đang soạn {exam.requested_count} câu hỏi, đáp án và lời giải…
          </p>
          <SkeletonRows rows={4} />
        </section>
      )}

      {exam.status === "failed" && (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-pretty text-red-800 sm:px-5">
          <p className="font-medium">Không soạn được đề</p>
          {exam.error_message && <p className="mt-0.5">{exam.error_message}</p>}
        </div>
      )}

      {(exam.status === "draft" || exam.status === "published") && (
        <section className="overflow-hidden rounded-2xl border border-line bg-paper">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-4 sm:px-5">
            <h2 className="text-base font-semibold">
              Câu hỏi <span className="text-sm font-normal tabular-nums text-ink-3">{total}</span>
            </h2>
            {isDraft && (
              <div className="flex min-w-40 flex-col items-end gap-1.5">
                <p className="text-sm tabular-nums text-ink-3">
                  Đã kiểm <span className="font-medium text-ink">{checked}</span> / {total} câu
                </p>
                <div className="h-1.5 w-40 rounded-full bg-ink/5" role="progressbar" aria-valuenow={checked} aria-valuemin={0} aria-valuemax={total} aria-label="Số câu đã kiểm">
                  <div className="h-1.5 rounded-full bg-orange" style={{ width: `${total ? (checked / total) * 100 : 0}%` }} />
                </div>
              </div>
            )}
          </header>
          {total ? (
            <ol className="divide-y divide-line">
              {questions.map((q, index) => {
                if (isDraft && editing === q.id)
                  return (
                    <li key={q.id} id={`q-${q.id}`} className="scroll-mt-24 bg-paper-2 p-4 sm:p-5">
                      <QuestionEditForm question={q} index={index} onCancel={() => cancelEdit(q.id)} onSave={(values) => void saveEdit(q, values)} />
                    </li>
                  );
                const isChecked = q.status === "approved";
                return (
                  <li key={q.id} id={`q-${q.id}`} className="scroll-mt-24 p-4 sm:p-5">
                    <article aria-labelledby={`qt-${q.id}`}>
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-medium text-ink-3">Câu {index + 1} · {DIFFICULTY_LABEL[q.difficulty]}</p>
                        {isDraft && (isChecked ? <Badge tone="success" icon={Check}>Đã kiểm</Badge> : <Badge tone="neutral">Chưa kiểm</Badge>)}
                      </div>
                      <h3 id={`qt-${q.id}`} className="mt-1.5 text-base font-medium text-pretty text-ink">{q.prompt}</h3>
                      <OptionsGrid question={q} />
                      <p className="mt-3 max-w-[75ch] text-sm text-pretty text-ink/80">
                        <span className="font-medium text-ink">Giải thích.</span> {q.explanation}
                      </p>
                      {(exam.source === "materials" || isDraft) && (
                        <div className="mt-1 flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
                          <div className="min-w-0 flex-1 basis-64">{exam.source === "materials" && <SourcesBlock question={q} />}</div>
                          {isDraft && (
                            <div className="grid w-full shrink-0 grid-cols-3 gap-2 sm:flex sm:w-auto">
                              <Button variant="ghost" icon={X} aria-label={`Bỏ câu ${index + 1} khỏi đề`} onClick={() => void remove(q, index)}>Bỏ câu</Button>
                              <Button variant="outline" icon={Pencil} id={`edit-${q.id}`} aria-label={`Sửa câu ${index + 1}`} onClick={() => setEditing(q.id)}>Sửa</Button>
                              {isChecked ? (
                                <Button variant="ghost" aria-label={`Bỏ đánh dấu đã kiểm câu ${index + 1}`} onClick={() => toggleChecked(q)}>Bỏ đánh dấu</Button>
                              ) : (
                                <Button variant="secondary" icon={Check} aria-label={`Đánh dấu đã kiểm câu ${index + 1}`} onClick={() => toggleChecked(q)}>Đã kiểm</Button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </article>
                  </li>
                );
              })}
            </ol>
          ) : (
            <EmptyLine>Đề không còn câu nào. Tạo đề mới bằng AI nếu cần.</EmptyLine>
          )}
        </section>
      )}

      <ConfirmDialog
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
        onConfirm={() => void confirmPublish()}
        busy={busy}
        tone={unchecked ? "warning" : "neutral"}
        icon={unchecked ? TriangleAlert : Send}
        title={unchecked ? "Xuất bản khi còn câu chưa kiểm?" : "Xuất bản đề?"}
        description={
          unchecked ? (
            <>
              Còn <span className="font-medium text-ink">{unchecked} / {total} câu chưa kiểm</span>. Sinh viên {code} sẽ thấy cả các câu này; câu sai đáp án sẽ chấm sai cho sinh viên.
            </>
          ) : (
            <>
              Sinh viên {code} sẽ thấy <span className="font-medium text-ink">{exam.title}</span> trong thư viện đề của môn.
            </>
          )
        }
        cancelLabel={unchecked ? "Kiểm tiếp" : "Huỷ"}
        confirmLabel={unchecked ? "Vẫn xuất bản" : "Xuất bản đề"}
      />
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => void confirmDelete()}
        busy={busy}
        tone="danger"
        icon={Trash2}
        title="Xoá đề này?"
        description={`Đề và ${total} câu hỏi AI đã soạn sẽ bị xoá vĩnh viễn.`}
        confirmLabel="Xoá đề"
      />
    </div>
  );
}
