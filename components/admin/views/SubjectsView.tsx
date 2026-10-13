"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { readyVersionsOf, subjectCode, type AdminOverview, type AdminSubject } from "@/lib/admin";
import { SubjectModal } from "../forms/SubjectModal";
import { Button, EmptyLine, Pager, SearchBox, TD, TH, TableCard, Tabs, Toolbar, cx, nf } from "../ui";
import { Code, ViewGate, clip, schoolAbbr } from "./common";

const PAGE_SIZE = 20;

function SubjectsTable({ overview, onAdd }: { overview: AdminOverview; onAdd: () => void }) {
  const { subjects, materials, exams } = overview;
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const schoolIds = [...new Set(subjects.map((s) => s.school_code))];
  const multiSchool = schoolIds.length > 1;
  const tabs = [
    { value: "all", label: "Tất cả", count: subjects.length },
    ...schoolIds.map((id) => ({ value: id, label: schoolAbbr(id) ?? id, count: subjects.filter((s) => s.school_code === id).length })),
  ];
  const activeTab = multiSchool && tabs.some((t) => t.value === tab) ? tab : "all";
  const needle = query.trim().toLocaleLowerCase("vi");
  const rows = subjects
    .filter((s) => activeTab === "all" || s.school_code === activeTab)
    .filter((s) => !needle || `${subjectCode(s)} ${s.code} ${s.name}`.toLocaleLowerCase("vi").includes(needle));
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const pageRows = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const stats = (s: AdminSubject) => ({
    materials: materials.filter((m) => m.subject_id === s.id).length,
    ready: readyVersionsOf(materials, s.id).length,
    exams: exams.filter((e) => e.subject_id === s.id).length,
  });
  const materialCell = (n: ReturnType<typeof stats>) =>
    n.ready ? (
      <span className="tabular-nums">{nf.format(n.materials)}</span>
    ) : (
      <span className="text-ink-3">{n.materials ? `${n.materials} · chưa dùng được` : "Chưa có"}</span>
    );

  let empty;
  if (!subjects.length) empty = <EmptyLine>Chưa có môn học nào. Thêm môn đầu tiên để bắt đầu tạo đề.</EmptyLine>;
  else
    empty = (
      <EmptyLine>
        Không có môn nào khớp “{clip(query.trim(), 24)}”. Thử từ khoá khác.{" "}
        <button type="button" onClick={() => setQuery("")} className="cursor-pointer font-medium text-ink underline-offset-4 outline-hidden hover:underline">
          Xoá tìm kiếm
        </button>
      </EmptyLine>
    );

  return (
    <>
      <Toolbar
        tabs={multiSchool ? <Tabs label="Trường" tabs={tabs} value={activeTab} onChange={(v) => { setTab(v); setPage(1); }} /> : undefined}
        middle={<SearchBox value={query} onChange={(v) => { setQuery(v); setPage(1); }} placeholder="Tìm theo mã hoặc tên môn" />}
        action={<Button variant="primary" icon={Plus} onClick={onAdd}>Thêm môn học</Button>}
      />
      <TableCard>
        {pageRows.length ? (
          <>
            <table className="hidden w-full table-fixed text-sm sm:table">
              <thead className="border-b border-line">
                <tr>
                  <th className={cx(TH, "w-32")}>Mã môn</th>
                  <th className={TH}>Tên môn</th>
                  {multiSchool && <th className={cx(TH, "w-24")}>Trường</th>}
                  <th className={cx(TH, "w-44")}>Tài liệu</th>
                  <th className={cx(TH, "w-24 text-right")}>Đề thi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {pageRows.map((s) => {
                  const n = stats(s);
                  return (
                    <tr key={s.id} className="transition-colors hover:bg-paper-2">
                      <td className={TD}><Code>{subjectCode(s)}</Code></td>
                      <td className={TD}><p className="truncate font-medium" title={s.name}>{s.name}</p></td>
                      {multiSchool && <td className={cx(TD, "text-ink/70")}>{schoolAbbr(s.school_code)}</td>}
                      <td className={TD}>{materialCell(n)}</td>
                      <td className={cx(TD, "text-right tabular-nums", !n.exams && "text-ink-3")}>{nf.format(n.exams)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <ul className="divide-y divide-line sm:hidden">
              {pageRows.map((s) => {
                const n = stats(s);
                return (
                  <li key={s.id} className="px-4 py-3">
                    <p className="line-clamp-2 text-sm font-medium text-pretty">{s.name}</p>
                    <p className="mt-1 flex items-center justify-between gap-3 text-xs text-ink-3">
                      <span><Code>{subjectCode(s)}</Code>{multiSchool && ` · ${schoolAbbr(s.school_code)}`}</span>
                      <span className="shrink-0 tabular-nums">{n.ready ? `${n.materials} tài liệu` : "Chưa có tài liệu"} · {n.exams} đề</span>
                    </p>
                  </li>
                );
              })}
            </ul>
            <Pager page={current} pageSize={PAGE_SIZE} total={rows.length} noun="môn học" onPage={setPage} />
          </>
        ) : (
          empty
        )}
      </TableCard>
    </>
  );
}

export function SubjectsView() {
  const [modal, setModal] = useState(false);
  return (
    <>
      <ViewGate>{(overview) => <SubjectsTable overview={overview} onAdd={() => setModal(true)} />}</ViewGate>
      <SubjectModal open={modal} onClose={() => setModal(false)} />
    </>
  );
}
