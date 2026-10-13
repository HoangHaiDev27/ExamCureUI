"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { formatAdminDate, subjectCode, type ExamStatus, type ExamSummary } from "@/lib/admin";
import { AiExamSheet } from "../forms/AiExamSheet";
import { useAdminData } from "../AdminData";
import { Badge, Button, EmptyLine, SearchBox, TD, TH, TableCard, Tabs, Toolbar, cx, nf } from "../ui";
import { Code, ViewGate, clip } from "./common";

type Tab = "all" | "draft" | "published";

export function ExamStatusBadge({ status }: { status: ExamStatus }) {
  if (status === "generating") return <Badge tone="neutral" spinner>AI đang soạn</Badge>;
  if (status === "draft") return <Badge tone="warning">Chờ duyệt</Badge>;
  if (status === "published") return <Badge tone="success">Đã xuất bản</Badge>;
  return <Badge tone="error">Không soạn được</Badge>;
}

export function ExamSourceText({ source }: { source: ExamSummary["source"] }) {
  return source === "ai" ? <span className="font-medium text-amber-700">AI tự soạn</span> : <span className="text-ink/70">Từ tài liệu</span>;
}

function StatusCell({ exam }: { exam: ExamSummary }) {
  if (exam.status !== "draft") return <ExamStatusBadge status={exam.status} />;
  return (
    <span className="inline-flex items-center gap-2">
      <ExamStatusBadge status="draft" />
      <span className="text-xs tabular-nums text-ink-3" title={`Đã kiểm ${exam.checked_count} / ${exam.question_count} câu`}>
        {exam.checked_count}/{exam.question_count}
      </span>
    </span>
  );
}

const countOf = (e: ExamSummary) => (e.status === "generating" ? e.requested_count : e.question_count);

function ExamsTable({ onCreate, tab, setTab }: { onCreate: () => void; tab: Tab; setTab: (tab: Tab) => void }) {
  const { services } = useAdminData();
  return (
    <ViewGate>
      {(overview) => {
        const { exams, subjects } = overview;
        return <ExamsList exams={exams} subjectCodes={new Map(subjects.map((s) => [s.id, subjectCode(s)]))} hasSubjects={subjects.length > 0} openai={services?.openai !== false} onCreate={onCreate} tab={tab} setTab={setTab} />;
      }}
    </ViewGate>
  );
}

function ExamsList({
  exams,
  subjectCodes,
  hasSubjects,
  openai,
  onCreate,
  tab,
  setTab,
}: {
  exams: ExamSummary[];
  subjectCodes: Map<string, string>;
  hasSubjects: boolean;
  openai: boolean;
  onCreate: () => void;
  tab: Tab;
  setTab: (tab: Tab) => void;
}) {
  const [query, setQuery] = useState("");
  const codeOf = (e: ExamSummary) => subjectCodes.get(e.subject_id) ?? "—";
  const tabs: Array<{ value: Tab; label: string; count: number }> = [
    { value: "all", label: "Tất cả", count: exams.length },
    { value: "draft", label: "Chờ duyệt", count: exams.filter((e) => e.status === "draft" || e.status === "generating").length },
    { value: "published", label: "Đã xuất bản", count: exams.filter((e) => e.status === "published").length },
  ];
  const needle = query.trim().toLocaleLowerCase("vi");
  const rows = [...exams]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .filter((e) => tab === "all" || (tab === "draft" ? e.status === "draft" || e.status === "generating" : e.status === "published"))
    .filter((e) => !needle || `${e.title} ${codeOf(e)}`.toLocaleLowerCase("vi").includes(needle));

  let empty;
  if (!exams.length)
    empty = <EmptyLine>{hasSubjects ? "Chưa có đề thi nào. Chọn môn, AI soạn đề, bạn kiểm rồi xuất bản." : "Chưa có đề thi nào. Thêm môn học trước để AI có môn soạn đề."}</EmptyLine>;
  else if (needle)
    empty = (
      <EmptyLine>
        Không có đề nào khớp “{clip(query.trim(), 24)}”. Thử từ khoá khác.{" "}
        <button type="button" onClick={() => setQuery("")} className="cursor-pointer font-medium text-ink underline-offset-4 outline-hidden hover:underline">
          Xoá tìm kiếm
        </button>
      </EmptyLine>
    );
  else empty = <EmptyLine>{tab === "draft" ? "Không có đề nào chờ duyệt." : "Chưa có đề nào được xuất bản."}</EmptyLine>;

  const reason = !hasSubjects ? "Thêm môn học trước" : !openai ? "OpenAI chưa cấu hình" : undefined;
  return (
    <>
      <Toolbar
        tabs={<Tabs label="Trạng thái" tabs={tabs} value={tab} onChange={setTab} />}
        middle={<SearchBox value={query} onChange={setQuery} placeholder="Tìm theo tên đề hoặc mã môn" />}
        action={
          <Button variant="primary" icon={Sparkles} onClick={onCreate} disabled={Boolean(reason)} title={reason}>
            Tạo đề bằng AI
          </Button>
        }
      />
      <TableCard>
        {rows.length ? (
          <>
            <table className="hidden w-full table-fixed text-sm sm:table">
              <thead className="border-b border-line">
                <tr>
                  <th className={TH}>Tên đề</th>
                  <th className={cx(TH, "w-28")}>Môn</th>
                  <th className={cx(TH, "hidden w-32 @3xl:table-cell")}>Nguồn</th>
                  <th className={cx(TH, "w-20 text-right")}>Số câu</th>
                  <th className={cx(TH, "w-44")}>Trạng thái</th>
                  <th className={cx(TH, "hidden w-36 @4xl:table-cell")}>Tạo lúc</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((e) => (
                  <tr key={e.id} className="relative transition-colors hover:bg-paper-2">
                    <td className={TD}>
                      <Link href={`/admin/de-thi/${e.id}`} className="block truncate font-medium outline-hidden after:absolute after:inset-0 focus-visible:after:ring-2 focus-visible:after:ring-orange/30 focus-visible:after:ring-inset" title={e.title}>
                        {e.title}
                      </Link>
                    </td>
                    <td className={TD}><Code>{codeOf(e)}</Code></td>
                    <td className={cx(TD, "hidden @3xl:table-cell")}><ExamSourceText source={e.source} /></td>
                    <td className={cx(TD, "text-right tabular-nums")}>
                      {e.status === "generating" ? <span className="text-ink-3">{countOf(e)}</span> : countOf(e)}
                    </td>
                    <td className={TD}><StatusCell exam={e} /></td>
                    <td className={cx(TD, "hidden whitespace-nowrap text-ink/70 @4xl:table-cell")}>{formatAdminDate(e.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <ul className="divide-y divide-line sm:hidden">
              {rows.map((e) => (
                <li key={e.id} className="relative px-4 py-3">
                  <Link href={`/admin/de-thi/${e.id}`} className="line-clamp-2 text-sm font-medium text-pretty outline-hidden after:absolute after:inset-0">
                    {e.title}
                  </Link>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <StatusCell exam={e} />
                    <span className="text-xs tabular-nums text-ink-3">
                      <Code>{codeOf(e)}</Code> · {countOf(e)} câu{e.source === "ai" ? " · AI tự soạn" : ""}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
            <div className="border-t border-line px-4 py-3 text-sm tabular-nums text-ink-3">{nf.format(rows.length)} đề thi</div>
          </>
        ) : (
          empty
        )}
      </TableCard>
    </>
  );
}

export function ExamsView() {
  const [sheet, setSheet] = useState(false);
  const [tab, setTab] = useState<Tab>("all");
  return (
    <>
      <ExamsTable onCreate={() => setSheet(true)} tab={tab} setTab={setTab} />
      <AiExamSheet open={sheet} onClose={() => setSheet(false)} onCreated={() => setTab("all")} />
    </>
  );
}
