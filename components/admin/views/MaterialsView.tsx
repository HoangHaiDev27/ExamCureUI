"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import {
  formatAdminDate,
  latestVersion,
  materialStatusGroup,
  subjectCode,
  type AdminMaterial,
  type AdminMaterialVersion,
  type AdminOverview,
  type MaterialStatusGroup,
} from "@/lib/admin";
import { UploadSheet } from "../forms/UploadSheet";
import { Badge, Button, EmptyLine, SearchBox, TD, TH, TableCard, Tabs, Toolbar, cx, nf } from "../ui";
import { Code, ViewGate, clip } from "./common";

type Tab = "all" | MaterialStatusGroup;
type Row = { material: AdminMaterial; version: AdminMaterialVersion; code: string };

function VersionBadge({ version }: { version: AdminMaterialVersion }) {
  const group = materialStatusGroup(version.status);
  if (group === "ready") return <Badge tone="success">Sẵn sàng</Badge>;
  if (group === "failed") return <Badge tone="error">Lỗi xử lý</Badge>;
  return <Badge tone="neutral" spinner>Đang xử lý</Badge>;
}

const EMPTY_BY_TAB: Record<MaterialStatusGroup, string> = {
  ready: "Chưa có tài liệu nào sẵn sàng.",
  processing: "Không có tài liệu nào đang xử lý.",
  failed: "Không có tài liệu nào bị lỗi.",
};

function MaterialsTable({ overview, onUpload }: { overview: AdminOverview; onUpload: () => void }) {
  const { subjects, materials } = overview;
  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState("");
  const subjectCodes = new Map(subjects.map((s) => [s.id, subjectCode(s)]));

  const all: Row[] = materials.flatMap((material) => {
    const version = latestVersion(material);
    return version ? [{ material, version, code: subjectCodes.get(material.subject_id) ?? "—" }] : [];
  });
  all.sort((a, b) => b.version.created_at.localeCompare(a.version.created_at));
  const count = (group: MaterialStatusGroup) => all.filter((r) => materialStatusGroup(r.version.status) === group).length;
  const tabs: Array<{ value: Tab; label: string; count: number }> = [
    { value: "all", label: "Tất cả", count: all.length },
    { value: "ready", label: "Sẵn sàng", count: count("ready") },
    { value: "processing", label: "Đang xử lý", count: count("processing") },
    { value: "failed", label: "Lỗi", count: count("failed") },
  ];
  const needle = query.trim().toLocaleLowerCase("vi");
  const rows = all
    .filter((r) => tab === "all" || materialStatusGroup(r.version.status) === tab)
    .filter((r) => !needle || `${r.material.title} ${r.version.original_filename} ${r.code}`.toLocaleLowerCase("vi").includes(needle));

  let empty;
  if (!materials.length) empty = <EmptyLine>Chưa có tài liệu nào. Tải PowerPoint lên để AI soạn đề bám đúng nội dung môn.</EmptyLine>;
  else if (needle)
    empty = (
      <EmptyLine>
        Không có tài liệu nào khớp “{clip(query.trim(), 24)}”. Thử từ khoá khác.{" "}
        <button type="button" onClick={() => setQuery("")} className="cursor-pointer font-medium text-ink underline-offset-4 outline-hidden hover:underline">
          Xoá tìm kiếm
        </button>
      </EmptyLine>
    );
  else empty = <EmptyLine>{tab === "all" ? "Chưa có tài liệu nào." : EMPTY_BY_TAB[tab]}</EmptyLine>;

  const noSubject = subjects.length === 0;
  return (
    <>
      <Toolbar
        tabs={<Tabs label="Trạng thái" tabs={tabs} value={tab} onChange={setTab} />}
        middle={<SearchBox value={query} onChange={setQuery} placeholder="Tìm theo tên tài liệu hoặc mã môn" />}
        action={
          <Button variant="primary" icon={Upload} onClick={onUpload} disabled={noSubject} title={noSubject ? "Thêm môn học trước" : undefined}>
            Tải PowerPoint lên
          </Button>
        }
      />
      <TableCard>
        {rows.length ? (
          <>
            <table className="hidden w-full table-fixed text-sm sm:table">
              <thead className="border-b border-line">
                <tr>
                  <th className={TH}>Tài liệu</th>
                  <th className={cx(TH, "w-28")}>Môn</th>
                  <th className={cx(TH, "hidden w-24 @3xl:table-cell")}>Phiên bản</th>
                  <th className={cx(TH, "w-20 text-right")}>Slide</th>
                  <th className={cx(TH, "w-36")}>Trạng thái</th>
                  <th className={cx(TH, "hidden w-36 @4xl:table-cell")}>Tải lên</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map(({ material, version, code }) => (
                  <tr key={material.id} className="transition-colors hover:bg-paper-2">
                    <td className={TD}>
                      <p className="truncate font-medium" title={material.title}>{material.title}</p>
                      {version.status === "failed" ? (
                        <p className="mt-0.5 truncate text-xs text-red-600" title={version.error_message ?? undefined}>{version.error_message}</p>
                      ) : (
                        <p className="mt-0.5 truncate text-xs text-ink-3" title={version.original_filename}>{version.original_filename}</p>
                      )}
                    </td>
                    <td className={TD}><Code>{code}</Code></td>
                    <td className={cx(TD, "hidden text-ink/70 @3xl:table-cell")}>v{version.version_number}</td>
                    <td className={cx(TD, "text-right tabular-nums", !version.slide_count && "text-ink-3")}>{version.slide_count ? nf.format(version.slide_count) : "—"}</td>
                    <td className={TD}><VersionBadge version={version} /></td>
                    <td className={cx(TD, "hidden whitespace-nowrap text-ink/70 @4xl:table-cell")}>{formatAdminDate(version.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <ul className="divide-y divide-line sm:hidden">
              {rows.map(({ material, version, code }) => (
                <li key={material.id} className="px-4 py-3">
                  <p className="line-clamp-2 text-sm font-medium text-pretty">{material.title}</p>
                  {version.status === "failed" && <p className="mt-0.5 text-xs text-pretty text-red-600">{version.error_message}</p>}
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <VersionBadge version={version} />
                    <span className="text-xs tabular-nums text-ink-3"><Code>{code}</Code> · {version.slide_count ? `${version.slide_count} slide` : "—"}</span>
                  </div>
                </li>
              ))}
            </ul>
            <div className="border-t border-line px-4 py-3 text-sm tabular-nums text-ink-3">{nf.format(rows.length)} tài liệu</div>
          </>
        ) : (
          empty
        )}
      </TableCard>
    </>
  );
}

export function MaterialsView() {
  const [sheet, setSheet] = useState(false);
  return (
    <>
      <ViewGate>{(overview) => <MaterialsTable overview={overview} onUpload={() => setSheet(true)} />}</ViewGate>
      <UploadSheet open={sheet} onClose={() => setSheet(false)} />
    </>
  );
}
