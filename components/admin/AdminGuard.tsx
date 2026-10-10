"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { refreshAuthProfile, useAuth, useAuthReady } from "@/lib/auth";
import { apiRequest } from "@/lib/api";

// UI access follows the refreshed profile. Admin APIs independently verify
// the session and current database role; no bootstrap token opens this UI.
export function AdminGuard({ children }: { children: ReactNode }) {
  const user = useAuth();
  const checked = useAuthReady();
  const [showBootstrap, setShowBootstrap] = useState(false);
  const [bootstrapToken, setBootstrapToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshRole = async () => {
    setBusy(true);
    setError(null);
    try { await refreshAuthProfile(); }
    catch { setError("Không thể kiểm tra quyền. Vui lòng thử lại."); }
    finally { setBusy(false); }
  };

  const bootstrap = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await apiRequest("/Admin/bootstrap", {
        method: "POST", body: JSON.stringify({ bootstrapToken: bootstrapToken.trim() }),
      });
      setBootstrapToken("");
      const current = await refreshAuthProfile();
      if (current?.role !== "admin") throw new Error("Đã cấp quyền. Hãy kiểm tra lại quyền hoặc đăng nhập lại.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể khởi tạo quản trị.");
    } finally { setBusy(false); }
  };

  if (!checked) {
    return (
      <main className="grid min-h-[60vh] place-items-center px-5">
        <p className="text-[13.5px] text-ink-3">Đang kiểm tra quyền truy cập...</p>
      </main>
    );
  }

  if (user?.role === "admin") {
    return <>{children}</>;
  }

  return (
    <main className="grid min-h-[60vh] place-items-center px-5">
      <div className="max-w-sm rounded-[12px] border border-line bg-paper p-6 text-center shadow-[var(--shadow-1)]">
        <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-danger-soft text-danger">
          <ShieldAlert size={22} aria-hidden="true" />
        </span>
        <h1 className="mt-3 text-[16px] font-bold text-ink">Không có quyền truy cập</h1>
        <p className="mt-1.5 text-[13px] leading-relaxed text-ink-3">
          {user ? "Trang quản trị chỉ dành cho tài khoản có vai trò admin." : "Đăng nhập bằng tài khoản quản trị để tiếp tục."}
        </p>
        <Link
          href={user ? "/dashboard" : "/"}
          className="mt-5 inline-flex h-10 items-center justify-center rounded-[7px] bg-orange px-5 text-[13px] font-semibold text-white transition-colors hover:bg-orange-dark"
        >
          {user ? "Về bảng điều khiển" : "Về trang chủ để đăng nhập"}
        </Link>
        {user && (
          <>
            <button type="button" disabled={busy} onClick={() => void refreshRole()} className="mt-4 block w-full text-[12px] text-ink-3 underline disabled:opacity-50">{busy ? "Đang kiểm tra..." : "Kiểm tra lại quyền"}</button>
            <button type="button" disabled={busy} onClick={() => setShowBootstrap(!showBootstrap)} className="mt-4 block w-full text-[12px] text-ink-3 underline decoration-dotted underline-offset-2">Khởi tạo tài khoản admin đầu tiên</button>
            {showBootstrap && (
              <form onSubmit={bootstrap} className="mt-4 space-y-3 text-left">
                <p className="text-[12px] text-ink-3">Mã khởi tạo chỉ dùng một lần, trước khi hệ thống có admin. Quyền được cấp cho tài khoản đang đăng nhập.</p>
                <label className="block text-[12px] text-ink-2">Mã khởi tạo
                  <input type="password" required minLength={32} maxLength={512} autoComplete="off" value={bootstrapToken} onChange={(event) => setBootstrapToken(event.target.value)} className="mt-1 h-10 w-full rounded-[8px] border border-line bg-paper-2 px-3 text-[13px] outline-none focus:border-orange" />
                </label>
                <button disabled={busy} className="h-10 w-full rounded-[8px] bg-ink px-4 text-[13px] font-semibold text-white disabled:opacity-50">Cấp quyền admin cho tài khoản này</button>
              </form>
            )}
          </>
        )}
        {error && <p role="alert" className="mt-4 text-[13px] text-danger">{error}</p>}
      </div>
    </main>
  );
}
