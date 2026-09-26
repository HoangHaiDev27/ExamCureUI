"use client";

import { useState } from "react";
import { Lock, LockOpen } from "lucide-react";
import { Button } from "@/components/Button";
import { getAuth } from "@/lib/auth";
import { adminApi, fmtDate, ROLE_LABEL, ROLES, type AdminUser, type Role } from "@/lib/admin";
import {
  Badge,
  Card,
  ConfirmDialog,
  Empty,
  ErrorBanner,
  PageHeader,
  Pagination,
  SearchBox,
  Select,
  Spinner,
  Table,
  Td,
  Toolbar,
  useDebounced,
  useLoader,
  useToast,
} from "./ui";

type Pending = { user: AdminUser; change: { role?: Role; isLocked?: boolean }; text: string; danger?: boolean };

export function UsersPanel() {
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const q = useDebounced(search);
  const { data, error, loading, reload } = useLoader(
    () => adminApi.users({ page, search: q, role, status }),
    `${page}|${q}|${role}|${status}`,
  );
  const [pending, setPending] = useState<Pending | null>(null);
  const [busy, setBusy] = useState(false);
  // AdminShell chỉ render nội dung sau khi xác thực ở client → đọc localStorage ở đây an toàn.
  const myEmail = getAuth()?.email;

  const filter = (fn: (v: string) => void) => (v: string) => {
    fn(v);
    setPage(1);
  };

  async function apply() {
    if (!pending) return;
    setBusy(true);
    try {
      await adminApi.updateUser(pending.user.id, pending.change);
      toast("ok", "Đã cập nhật tài khoản.");
      setPending(null);
      reload();
    } catch (e) {
      toast("error", (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader title="Người dùng" description="Phân quyền và khoá / mở khoá tài khoản." />
      {error && <ErrorBanner message={error} onRetry={reload} />}

      <Card className="mt-4">
        <Toolbar>
          <SearchBox value={search} onChange={filter(setSearch)} placeholder="Tìm email, họ tên, MSSV…" />
          <Select value={role} onChange={(e) => filter(setRole)(e.target.value)} className="!h-9 !w-auto" aria-label="Lọc theo quyền">
            <option value="">Tất cả quyền</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABEL[r]}
              </option>
            ))}
          </Select>
          <Select value={status} onChange={(e) => filter(setStatus)(e.target.value)} className="!h-9 !w-auto" aria-label="Lọc theo trạng thái">
            <option value="">Mọi trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="unverified">Chưa xác thực email</option>
            <option value="locked">Đã khoá</option>
          </Select>
        </Toolbar>

        {loading && !data ? (
          <Spinner />
        ) : data && data.items.length === 0 ? (
          <Empty title="Không có người dùng phù hợp" hint="Thử bỏ bớt bộ lọc hoặc đổi từ khoá tìm kiếm." />
        ) : (
          data && (
            <>
              <Table head={["Người dùng", "Quyền", "Trạng thái", "Hoạt động", "Ngày tạo", ""]}>
                {data.items.map((u) => (
                  <tr key={u.id} className={loading ? "opacity-60" : ""}>
                    <Td>
                      <p className="font-medium text-ink">{u.fullName || "—"}</p>
                      <p className="text-[12.5px] text-ink-3">
                        {u.email}
                        {u.mssv && ` · ${u.mssv}`}
                      </p>
                    </Td>
                    <Td>
                      <Select
                        value={u.role}
                        disabled={u.email === myEmail}
                        title={u.email === myEmail ? "Không thể tự đổi quyền của chính mình" : undefined}
                        onChange={(e) => {
                          const next = e.target.value as Role;
                          setPending({
                            user: u,
                            change: { role: next },
                            text: `Đổi quyền của ${u.email} từ "${ROLE_LABEL[u.role]}" thành "${ROLE_LABEL[next]}"?`,
                          });
                        }}
                        className="!h-8 !w-[128px] text-[13px]"
                        aria-label={`Quyền của ${u.email}`}
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {ROLE_LABEL[r]}
                          </option>
                        ))}
                      </Select>
                    </Td>
                    <Td>
                      {u.isLocked ? (
                        <Badge tone="danger">Đã khoá</Badge>
                      ) : u.isEmailVerified ? (
                        <Badge tone="green">Hoạt động</Badge>
                      ) : (
                        <Badge tone="warning">Chưa xác thực</Badge>
                      )}
                    </Td>
                    <Td className="text-[13px] text-ink-2">
                      {u.totalExamsTaken} bài thi · chuỗi {u.streakDays} ngày
                      <br />
                      <span className="text-ink-3">Lần cuối: {fmtDate(u.lastActiveDate)}</span>
                    </Td>
                    <Td className="whitespace-nowrap text-ink-2">{fmtDate(u.createdAt)}</Td>
                    <Td className="text-right">
                      {u.email === myEmail ? (
                        <span className="text-[12.5px] text-ink-3">Tài khoản của bạn</span>
                      ) : u.isLocked ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setPending({ user: u, change: { isLocked: false }, text: `Mở khoá tài khoản ${u.email}?` })}
                        >
                          <LockOpen size={15} /> Mở khoá
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-danger hover:!bg-danger-soft hover:!text-danger"
                          onClick={() =>
                            setPending({
                              user: u,
                              change: { isLocked: true },
                              danger: true,
                              text: `Khoá tài khoản ${u.email}? Người dùng sẽ bị đăng xuất khỏi mọi thiết bị khi phiên hiện tại hết hạn và không thể đăng nhập lại.`,
                            })
                          }
                        >
                          <Lock size={15} /> Khoá
                        </Button>
                      )}
                    </Td>
                  </tr>
                ))}
              </Table>
              <Pagination page={data.page} limit={data.limit} total={data.total} onPage={setPage} />
            </>
          )
        )}
      </Card>

      <ConfirmDialog
        open={!!pending}
        title={pending?.change.isLocked === true ? "Khoá tài khoản" : pending?.change.isLocked === false ? "Mở khoá tài khoản" : "Đổi quyền"}
        message={pending?.text}
        confirmLabel={pending?.change.isLocked === true ? "Khoá tài khoản" : "Xác nhận"}
        danger={pending?.danger}
        busy={busy}
        onConfirm={apply}
        onClose={() => setPending(null)}
      />
    </>
  );
}
