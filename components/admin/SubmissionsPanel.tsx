"use client";

import { useState } from "react";
import { CheckCircle2, Eye, MinusCircle, XCircle } from "lucide-react";
import { Button } from "@/components/Button";
import { adminApi, fmtDate, fmtScore } from "@/lib/admin";
import { ScoreBadge } from "./OverviewPanel";
import {
  Empty,
  ErrorBanner,
  Card,
  Modal,
  PageHeader,
  Pagination,
  SearchBox,
  Spinner,
  Table,
  Td,
  Toolbar,
  useDebounced,
  useLoader,
} from "./ui";

const LETTERS = "ABCDEF";

export function SubmissionsPanel() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const q = useDebounced(search);
  const { data, error, loading, reload } = useLoader(() => adminApi.submissions({ page, search: q }), `${page}|${q}`);
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <>
      <PageHeader title="Bài thi đã nộp" description="Toàn bộ lượt thi thử của sinh viên, kèm bản chụp câu hỏi và đáp án đã chọn." />
      {error && <ErrorBanner message={error} onRetry={reload} />}

      <Card className="mt-4">
        <Toolbar>
          <SearchBox
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Tìm email, họ tên, học phần…"
          />
        </Toolbar>
        {loading && !data ? (
          <Spinner />
        ) : data && data.items.length === 0 ? (
          <Empty title="Chưa có bài nộp phù hợp" />
        ) : (
          data && (
            <>
              <Table head={["Sinh viên", "Học phần", "Điểm", "Đúng", "Thời gian làm", "Nộp lúc", ""]}>
                {data.items.map((r) => (
                  <tr key={r.id} className={loading ? "opacity-60" : ""}>
                    <Td>
                      <p className="font-medium text-ink">{r.user.fullName || r.user.email}</p>
                      <p className="text-[12.5px] text-ink-3">{r.user.email}</p>
                    </Td>
                    <Td>
                      {r.subject.name} <span className="text-ink-3">· {r.subject.code}</span>
                    </Td>
                    <Td>
                      <ScoreBadge score={r.score} grade={r.grade} />
                    </Td>
                    <Td className="tabular-nums text-ink-2">
                      {r.correct}/{r.total}
                    </Td>
                    <Td className="tabular-nums text-ink-2">{r.durationUsedMin} phút</Td>
                    <Td className="whitespace-nowrap text-ink-2">{fmtDate(r.createdAt, true)}</Td>
                    <Td className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => setOpenId(r.id)}>
                        <Eye size={15} /> Xem
                      </Button>
                    </Td>
                  </tr>
                ))}
              </Table>
              <Pagination page={data.page} limit={data.limit} total={data.total} onPage={setPage} />
            </>
          )
        )}
      </Card>

      {openId && <SubmissionDetailModal id={openId} onClose={() => setOpenId(null)} />}
    </>
  );
}

function SubmissionDetailModal({ id, onClose }: { id: string; onClose: () => void }) {
  const { data, error, loading } = useLoader(() => adminApi.submission(id), id);

  return (
    <Modal open wide title="Chi tiết bài thi" onClose={onClose}>
      {error && <ErrorBanner message={error} />}
      {loading && <Spinner />}
      {data && !loading && (
        <>
          <div className="grid gap-3 rounded-[8px] bg-paper-2 p-4 text-[13.5px] sm:grid-cols-4">
            <Stat label="Sinh viên" value={data.user.fullName || data.user.email} sub={data.user.email} />
            <Stat label="Học phần" value={data.subject.code} sub={data.subject.name} />
            <Stat label="Điểm" value={`${fmtScore(data.score)} · ${data.grade}`} sub={`${data.correct}/${data.total} câu đúng`} />
            <Stat label="Nộp lúc" value={fmtDate(data.createdAt, true)} sub={`Làm trong ${data.durationUsedMin} phút`} />
          </div>

          <ol className="mt-5 space-y-4">
            {data.questions.map((q, i) => {
              const skipped = q.studentAnswerIndex < 0;
              return (
                <li key={q.questionId + i} className="rounded-[8px] border border-line p-4">
                  <div className="flex items-start gap-2.5">
                    {q.isCorrect ? (
                      <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-green" aria-label="Đúng" />
                    ) : skipped ? (
                      <MinusCircle size={18} className="mt-0.5 shrink-0 text-ink-3" aria-label="Bỏ qua" />
                    ) : (
                      <XCircle size={18} className="mt-0.5 shrink-0 text-danger" aria-label="Sai" />
                    )}
                    <p className="text-[14px] font-medium text-ink">
                      <span className="text-ink-3">Câu {i + 1}. </span>
                      {q.prompt}
                    </p>
                  </div>
                  <ul className="mt-2.5 space-y-1 pl-7">
                    {q.options.map((o, j) => {
                      const correct = j === q.correctAnswerIndex;
                      const chosen = j === q.studentAnswerIndex;
                      return (
                        <li
                          key={j}
                          className={`flex items-center gap-2 rounded-[6px] px-2.5 py-1 text-[13.5px] ${
                            correct ? "bg-green-soft text-ink" : chosen ? "bg-danger-soft text-ink" : "text-ink-2"
                          }`}
                        >
                          <span className="font-semibold text-ink-3">{LETTERS[j]}.</span>
                          <span className="flex-1">{o}</span>
                          {chosen && <span className="text-[12px] font-semibold text-ink-2">Đã chọn</span>}
                          {correct && <span className="text-[12px] font-semibold text-green">Đáp án</span>}
                        </li>
                      );
                    })}
                  </ul>
                  {skipped && <p className="mt-2 pl-7 text-[12.5px] text-ink-3">Sinh viên bỏ qua câu này.</p>}
                  {q.explain && <p className="mt-2 pl-7 text-[13px] text-ink-2">Giải thích: {q.explain}</p>}
                </li>
              );
            })}
          </ol>
        </>
      )}
    </Modal>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[12px] font-semibold uppercase tracking-[0.04em] text-ink-3">{label}</p>
      <p className="mt-0.5 truncate font-semibold text-ink">{value}</p>
      {sub && <p className="truncate text-[12.5px] text-ink-2">{sub}</p>}
    </div>
  );
}
