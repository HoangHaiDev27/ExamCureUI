"use client";

import { useEffect, useState } from "react";
import { formatAdminDate, listFeedback, setFeedbackStatus, type AdminFeedback, type FeedbackStatus } from "@/lib/admin";
import { FEEDBACK_CATEGORY_LABEL } from "@/lib/feedback";
import { useAdminData, useToast } from "../AdminData";
import { Badge, Button, EmptyLine, ErrorBlock, Pager, SearchBox, SkeletonView, TD, TH, TableCard, Tabs, Toolbar, cx, nf } from "../ui";
import { clip } from "./common";

const PAGE_SIZE = 20;
type Tab = "new" | "resolved" | "all";

function Sender({ item }: { item: AdminFeedback }) {
  if (!item.user) return <span className="italic text-ink-3">Tài khoản đã xoá</span>;
  return (
    <div className="min-w-0">
      <p className="truncate font-medium" title={item.user.fullName}>{item.user.fullName}</p>
      <p className="truncate text-xs text-ink-3" title={item.user.email}>{item.user.email}</p>
    </div>
  );
}

function Message({ item, expanded, onToggle }: { item: AdminFeedback; expanded: boolean; onToggle: () => void }) {
  const long = item.message.length > 140 || item.message.includes("\n");
  return (
    <div className="min-w-0">
      <p className={cx("text-sm text-pretty whitespace-pre-line", !expanded && "line-clamp-2")}>{item.message}</p>
      {long && (
        <button type="button" onClick={onToggle} aria-expanded={expanded} className="mt-0.5 cursor-pointer text-xs font-medium text-ink/70 underline-offset-4 outline-hidden hover:text-ink hover:underline focus-visible:ring-2 focus-visible:ring-orange/30">
          {expanded ? "Thu gọn" : "Xem đủ"}
        </button>
      )}
      {item.page && <p className="mt-1 truncate font-mono text-xs text-ink-3" title={item.page}>{item.page}</p>}
    </div>
  );
}

function StatusAction({ item, onChange }: { item: AdminFeedback; onChange: (status: FeedbackStatus) => void }) {
  return item.status === "new" ? (
    <Button variant="outline" onClick={() => onChange("resolved")} className="min-h-8 px-3 text-sm whitespace-nowrap">Đánh dấu đã xử lý</Button>
  ) : (
    <Button variant="ghost" onClick={() => onChange("new")} className="min-h-8 px-3 text-sm whitespace-nowrap">Mở lại</Button>
  );
}

function FeedbackList({ initial }: { initial: AdminFeedback[] }) {
  const { reload } = useAdminData();
  const { toast } = useToast();
  const [items, setItems] = useState(initial);
  const [tab, setTab] = useState<Tab>("new");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<Set<string>>(new Set());

  const change = async (item: AdminFeedback, status: FeedbackStatus) => {
    const apply = (next: FeedbackStatus) => (list: AdminFeedback[]) =>
      list.map((f) => (f.id === item.id ? { ...f, status: next, ...(next === "new" ? { resolvedAt: null, resolvedBy: null } : {}) } : f));
    setItems(apply(status));
    try {
      await setFeedbackStatus(item.id, status);
      toast({ tone: "success", title: status === "resolved" ? "Đã đánh dấu đã xử lý" : "Đã mở lại phản hồi" });
      void reload();
    } catch (reason) {
      setItems((list) => list.map((f) => (f.id === item.id ? item : f)));
      toast({ tone: "error", title: "Không cập nhật được phản hồi", detail: reason instanceof Error ? reason.message : "Vui lòng thử lại." });
    }
  };

  const count = (s: FeedbackStatus) => items.filter((f) => f.status === s).length;
  const tabs: Array<{ value: Tab; label: string; count: number }> = [
    { value: "new", label: "Mới", count: count("new") },
    { value: "resolved", label: "Đã xử lý", count: count("resolved") },
    { value: "all", label: "Tất cả", count: items.length },
  ];
  const needle = query.trim().toLocaleLowerCase("vi");
  const rows = items
    .filter((f) => tab === "all" || f.status === tab)
    .filter((f) => !needle || `${f.user?.fullName ?? ""} ${f.user?.email ?? ""} ${f.message}`.toLocaleLowerCase("vi").includes(needle));
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const pageRows = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const toggle = (id: string) =>
    setOpen((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  let empty;
  if (!items.length) empty = <EmptyLine>Chưa có phản hồi nào.</EmptyLine>;
  else if (needle)
    empty = (
      <EmptyLine>
        Không có phản hồi nào khớp “{clip(query.trim(), 24)}”. Thử từ khoá khác.{" "}
        <button type="button" onClick={() => setQuery("")} className="cursor-pointer font-medium text-ink underline-offset-4 outline-hidden hover:underline">Xoá tìm kiếm</button>
      </EmptyLine>
    );
  else empty = <EmptyLine>{tab === "new" ? "Không có phản hồi mới." : "Chưa xử lý phản hồi nào."}</EmptyLine>;

  return (
    <>
      <Toolbar
        tabs={<Tabs label="Trạng thái" tabs={tabs} value={tab} onChange={(v) => { setTab(v); setPage(1); }} />}
        middle={<SearchBox value={query} onChange={(v) => { setQuery(v); setPage(1); }} placeholder="Tìm theo người gửi hoặc nội dung" />}
      />
      <TableCard>
        {pageRows.length ? (
          <>
            <table className="hidden w-full table-fixed text-sm sm:table">
              <thead className="border-b border-line">
                <tr>
                  <th className={cx(TH, "w-56")}>Người gửi</th>
                  <th className={cx(TH, "w-40")}>Loại</th>
                  <th className={TH}>Nội dung</th>
                  <th className={cx(TH, "hidden w-36 @4xl:table-cell")}>Gửi lúc</th>
                  <th className={cx(TH, "w-44")}><span className="sr-only">Thao tác</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {pageRows.map((f) => (
                  <tr key={f.id} className="align-top transition-colors hover:bg-paper-2">
                    <td className={TD}><Sender item={f} /></td>
                    <td className={TD}>
                      <div className="flex flex-col items-start gap-1.5">
                        <Badge tone={f.category === "bug" ? "error" : "neutral"}>{FEEDBACK_CATEGORY_LABEL[f.category]}</Badge>
                        {f.status === "resolved" && <Badge tone="success">Đã xử lý</Badge>}
                      </div>
                    </td>
                    <td className={TD}><Message item={f} expanded={open.has(f.id)} onToggle={() => toggle(f.id)} /></td>
                    <td className={cx(TD, "hidden whitespace-nowrap text-ink/70 @4xl:table-cell")}>{formatAdminDate(f.createdAt)}</td>
                    <td className={cx(TD, "text-right")}><StatusAction item={f} onChange={(s) => void change(f, s)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <ul className="divide-y divide-line sm:hidden">
              {pageRows.map((f) => (
                <li key={f.id} className="flex flex-col gap-2 px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <Sender item={f} />
                    <span className="shrink-0 text-xs tabular-nums text-ink-3">{formatAdminDate(f.createdAt)}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge tone={f.category === "bug" ? "error" : "neutral"}>{FEEDBACK_CATEGORY_LABEL[f.category]}</Badge>
                    {f.status === "resolved" && <Badge tone="success">Đã xử lý</Badge>}
                  </div>
                  <Message item={f} expanded={open.has(f.id)} onToggle={() => toggle(f.id)} />
                  <div><StatusAction item={f} onChange={(s) => void change(f, s)} /></div>
                </li>
              ))}
            </ul>
            <Pager page={current} pageSize={PAGE_SIZE} total={rows.length} noun="phản hồi" onPage={setPage} />
          </>
        ) : (
          empty
        )}
      </TableCard>
      <p className="sr-only">{nf.format(rows.length)} phản hồi</p>
    </>
  );
}

export function FeedbackView() {
  const [items, setItems] = useState<AdminFeedback[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [key, setKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    listFeedback(undefined, controller.signal)
      .then((list) => {
        setItems(list);
        setFailed(false);
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      });
    return () => controller.abort();
  }, [key]);

  const retry = () => {
    setFailed(false);
    setItems(null);
    setKey((k) => k + 1);
  };
  if (failed && !items) return <ErrorBlock onRetry={retry} />;
  if (!items) return <SkeletonView kind="table" />;
  return <FeedbackList initial={items} />;
}
