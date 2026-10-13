"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, ShieldOff } from "lucide-react";
import { changeUserRole, formatAdminDate, listUsers, type AdminUser, type UserRole } from "@/lib/admin";
import { useAuth } from "@/lib/auth";
import { useToast } from "../AdminData";
import { ConfirmDialog } from "../overlays";
import { Avatar, Badge, EmptyLine, ErrorBlock, Pager, SearchBox, SkeletonView, TD, TH, TableCard, Tabs, Toolbar, cx } from "../ui";
import { clip, schoolAbbr } from "./common";

const PAGE_SIZE = 10;
type Tab = "all" | UserRole;

function Who({ user, me }: { user: AdminUser; me: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar name={user.fullName} />
      <div className="min-w-0">
        <p className="flex min-w-0 items-center gap-2">
          <span className="truncate font-medium" title={user.fullName}>{user.fullName}</span>
          {me && <Badge tone="brand">Bạn</Badge>}
        </p>
        <p className={cx("truncate text-xs text-ink-3", !user.email && "italic")} title={user.email || undefined}>{user.email || "Chưa có email"}</p>
      </div>
    </div>
  );
}

const RoleText = ({ role }: { role: UserRole }) =>
  role === "admin" ? <span className="font-medium text-ink">Quản trị</span> : <span className="text-ink/70">Sinh viên</span>;

export function UsersView() {
  const me = useAuth()?.id;
  const { toast } = useToast();
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [key, setKey] = useState(0);
  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [target, setTarget] = useState<AdminUser | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    listUsers(controller.signal)
      .then((list) => {
        setUsers(list);
        setFailed(false);
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      });
    return () => controller.abort();
  }, [key]);

  const retry = () => {
    setFailed(false);
    setUsers(null);
    setKey((k) => k + 1);
  };

  if (failed && !users) return <ErrorBlock onRetry={retry} />;
  if (!users) return <SkeletonView kind="table" />;

  const multiSchool = new Set(users.map((u) => u.schoolId).filter(Boolean)).size > 1;
  const tabs: Array<{ value: Tab; label: string; count: number }> = [
    { value: "all", label: "Tất cả", count: users.length },
    { value: "admin", label: "Quản trị", count: users.filter((u) => u.role === "admin").length },
    { value: "student", label: "Sinh viên", count: users.filter((u) => u.role === "student").length },
  ];
  const needle = query.trim().toLocaleLowerCase("vi");
  const filtered = users
    .filter((u) => tab === "all" || u.role === tab)
    .filter((u) => !needle || [u.fullName, u.email, multiSchool ? schoolAbbr(u.schoolId) : null].some((v) => v?.toLocaleLowerCase("vi").includes(needle)));
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const toAdmin = target ? target.role !== "admin" : true;
  const confirm = async () => {
    if (!target || busy) return;
    setBusy(true);
    try {
      await changeUserRole(target.id, toAdmin ? "admin" : "student");
      setConfirmOpen(false);
      toast({ tone: "success", title: toAdmin ? `Đã cấp quyền quản trị cho ${target.fullName}` : `Đã bỏ quyền quản trị của ${target.fullName}` });
      setKey((k) => k + 1);
    } catch (reason) {
      setConfirmOpen(false);
      toast({ tone: "error", title: "Không đổi được quyền", detail: reason instanceof Error ? reason.message : "Vui lòng thử lại." });
    } finally {
      setBusy(false);
    }
  };
  const ask = (user: AdminUser) => {
    setTarget(user);
    setConfirmOpen(true);
  };
  const action = (u: AdminUser) =>
    u.id === me ? null : (
      <button
        type="button"
        onClick={() => ask(u)}
        className="inline-flex h-8 cursor-pointer items-center rounded-lg border border-line-strong bg-paper px-3 text-sm font-medium whitespace-nowrap outline-hidden transition-colors hover:bg-paper-3 focus-visible:ring-2 focus-visible:ring-orange/30"
      >
        {u.role === "admin" ? "Bỏ quyền quản trị" : "Cấp quyền quản trị"}
      </button>
    );

  const empty = needle ? (
    <EmptyLine>
      Không có người dùng nào khớp “{clip(query.trim(), 24)}”. Thử từ khoá khác.{" "}
      <button type="button" onClick={() => setQuery("")} className="cursor-pointer font-medium text-ink underline-offset-4 outline-hidden hover:underline">
        Xoá tìm kiếm
      </button>
    </EmptyLine>
  ) : (
    <EmptyLine>{tab === "admin" ? "Chưa có tài khoản quản trị nào khác." : "Chưa có sinh viên nào đăng ký."}</EmptyLine>
  );

  const dn = target?.fullName ?? "";
  return (
    <>
      <Toolbar
        tabs={<Tabs label="Vai trò" tabs={tabs} value={tab} onChange={(v) => { setTab(v); setPage(1); }} />}
        middle={<SearchBox value={query} onChange={(v) => { setQuery(v); setPage(1); }} placeholder={multiSchool ? "Tìm theo họ tên, email hoặc trường" : "Tìm theo họ tên hoặc email"} />}
      />
      <TableCard>
        {rows.length ? (
          <>
            <table className="hidden w-full table-fixed text-sm sm:table">
              <thead className="border-b border-line">
                <tr>
                  <th className={TH}>Người dùng</th>
                  {multiSchool && <th className={cx(TH, "w-24")}>Trường</th>}
                  <th className={cx(TH, "w-28")}>Vai trò</th>
                  <th className={cx(TH, "hidden w-32 @3xl:table-cell")}>Tham gia</th>
                  <th className={cx(TH, "w-48")}><span className="sr-only">Thao tác</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((u) => (
                  <tr key={u.id} className="transition-colors hover:bg-paper-2">
                    <td className={TD}><Who user={u} me={u.id === me} /></td>
                    {multiSchool && <td className={cx(TD, u.schoolId ? "text-ink/70" : "text-ink-3")}>{schoolAbbr(u.schoolId) || "—"}</td>}
                    <td className={TD}><RoleText role={u.role} /></td>
                    <td className={cx(TD, "hidden whitespace-nowrap text-ink/70 @3xl:table-cell")}>{formatAdminDate(u.createdAt)}</td>
                    <td className={cx(TD, "text-right")}>{action(u)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <ul className="divide-y divide-line sm:hidden">
              {rows.map((u) => (
                <li key={u.id} className="px-4 py-3">
                  <Who user={u} me={u.id === me} />
                  <div className="mt-2 flex items-center justify-between gap-3 pl-11">
                    <span className="text-xs">
                      <RoleText role={u.role} />
                      {multiSchool && <span className="text-ink-3"> · {schoolAbbr(u.schoolId) || "Chưa chọn trường"}</span>}
                    </span>
                    {action(u)}
                  </div>
                </li>
              ))}
            </ul>
            <Pager page={current} pageSize={PAGE_SIZE} total={filtered.length} noun="người dùng" onPage={setPage} />
          </>
        ) : (
          empty
        )}
      </TableCard>
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => void confirm()}
        busy={busy}
        tone={toAdmin ? "neutral" : "danger"}
        icon={toAdmin ? ShieldCheck : ShieldOff}
        title={toAdmin ? "Cấp quyền quản trị?" : "Bỏ quyền quản trị?"}
        description={
          toAdmin ? (
            <>
              <span className="font-medium text-ink">{dn}</span> sẽ vào được trang quản trị: tải tài liệu, tạo và xuất bản đề, đổi quyền người khác.
            </>
          ) : (
            <>
              <span className="font-medium text-ink">{dn}</span> sẽ mất quyền vào trang quản trị từ lần tải trang tiếp theo. Tài liệu và đề người này đã tạo vẫn giữ nguyên.
            </>
          )
        }
        confirmLabel={toAdmin ? "Cấp quyền quản trị" : "Bỏ quyền quản trị"}
      />
    </>
  );
}
