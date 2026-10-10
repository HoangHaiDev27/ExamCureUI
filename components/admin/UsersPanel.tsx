"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Users } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type Role = "student" | "admin";
type Account = {
  id: string;
  email: string | null;
  fullName: string;
  schoolId: string | null;
  role: Role;
  createdAt: string;
};
const ROLE_LABEL: Record<Role, string> = { student: "Sinh viên", admin: "Quản trị" };

export function UsersPanel() {
  const me = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<Account | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest<{ users: Account[] }>("/Admin/users", { signal });
      if (!signal?.aborted) setAccounts(data.users);
    } catch (reason) {
      if (!signal?.aborted) setError(reason instanceof Error ? reason.message : "Không thể tải tài khoản.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => void load(controller.signal), 0);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [load]);

  const apply = async () => {
    if (!pending) return;
    setBusy(true);
    setError(null);
    try {
      const role: Role = pending.role === "admin" ? "student" : "admin";
      await apiRequest(`/Admin/users/${pending.id}/role`, {
        method: "PATCH", body: JSON.stringify({ role }),
      });
      setPending(null);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể đổi quyền tài khoản.");
    } finally { setBusy(false); }
  };

  const query = search.trim().toLocaleLowerCase("vi");
  const visible = accounts.filter((account) =>
    [account.email, account.fullName, account.schoolId].some((value) => value?.toLocaleLowerCase("vi").includes(query)),
  );

  return (
    <section id="nguoi-dung" className="scroll-mt-5 rounded-[12px] border border-line bg-paper p-5 shadow-[var(--shadow-1)]">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-[15px] font-bold text-ink"><Users size={18} className="text-orange" /> Người dùng và phân quyền</h2>
        <button type="button" disabled={loading || busy} onClick={() => void load()} aria-label="Làm mới tài khoản" className="grid h-9 w-9 place-items-center rounded-[7px] border border-line text-ink-3 disabled:opacity-50"><RefreshCw size={15} /></button>
      </div>
      <input aria-label="Tìm tài khoản" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm theo họ tên, email hoặc trường" className="mt-4 h-10 w-full rounded-[8px] border border-line bg-paper-2 px-3 text-[13px] text-ink outline-none focus:border-orange" />
      {error && <p role="alert" className="mt-3 text-[13px] text-danger">{error}</p>}
      {pending && (
        <div className="mt-4 rounded-[8px] border border-line bg-paper-2 p-4 text-[13px] text-ink">
          Đổi quyền của <strong>{pending.email || pending.fullName}</strong> thành <strong>{ROLE_LABEL[pending.role === "admin" ? "student" : "admin"]}</strong>?
          <div className="mt-3 flex gap-2">
            <button type="button" disabled={busy} onClick={() => void apply()} className="rounded-[7px] bg-orange px-3 py-2 font-semibold text-white disabled:opacity-50">{busy ? "Đang lưu..." : "Xác nhận"}</button>
            <button type="button" disabled={busy} onClick={() => setPending(null)} className="rounded-[7px] border border-line px-3 py-2">Hủy</button>
          </div>
        </div>
      )}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-[13px]">
          <thead className="border-b border-line text-ink-3"><tr><th className="py-2 pr-4">Tài khoản</th><th className="pr-4">Trường</th><th className="pr-4">Vai trò</th><th>Thao tác</th></tr></thead>
          <tbody className="divide-y divide-line">
            {visible.map((account) => (
              <tr key={account.id}>
                <td className="py-3 pr-4"><p className="font-semibold text-ink">{account.fullName}</p><p className="text-ink-3">{account.email || "Chưa có email"}</p></td>
                <td className="pr-4 text-ink-2">{account.schoolId || "—"}</td>
                <td className="pr-4 text-ink-2">{ROLE_LABEL[account.role]}</td>
                <td><button type="button" disabled={busy || account.id === me?.id} onClick={() => setPending(account)} className="rounded-[7px] border border-line px-3 py-2 font-medium text-ink disabled:opacity-40">{account.id === me?.id ? "Tài khoản của bạn" : "Đổi quyền"}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading ? <p className="py-4 text-[13px] text-ink-3">Đang tải tài khoản...</p> : !visible.length && <p className="py-4 text-[13px] text-ink-3">Không có tài khoản phù hợp.</p>}
      </div>
    </section>
  );
}
