"use client";

import { useState, useSyncExternalStore, type ReactNode } from "react";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/lib/auth";

const noopSubscribe = () => () => {};
/** true chỉ sau khi client đã hydrate xong — tránh chặn nhầm trước khi useAuth() kịp đọc localStorage. */
function useHasHydrated() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

/**
 * Chặn /admin ở phía client cho user không có role "admin" — lớp phòng thủ
 * thứ hai, sau proxy.ts (chặn ở edge dựa trên cookie examcure_role cho
 * user đã biết chắc không phải admin). AdminGuard còn xử lý thêm trường hợp
 * middleware cố tình bỏ qua: user CHƯA đăng nhập (không có cookie), vì
 * AdminConsole còn hỗ trợ luồng bootstrap (dán ADMIN_BOOTSTRAP_TOKEN để cấp
 * quyền admin lần đầu, khi chưa có tài khoản nào mang role admin) — nút "Tôi
 * có mã bootstrap quản trị" cho phép luồng đó tiếp tục hoạt động dù middleware
 * đã cho qua. Cả hai lớp đều chỉ là UX; quyền thật vẫn do backend
 * (requireSupabaseAdmin + RLS) quyết định.
 */
export function AdminGuard({ children }: { children: ReactNode }) {
  const user = useAuth();
  const checked = useHasHydrated();
  const [bootstrapOverride, setBootstrapOverride] = useState(false);

  if (!checked) {
    return (
      <main className="grid min-h-[60vh] place-items-center px-5">
        <p className="text-[13.5px] text-ink-3">Đang kiểm tra quyền truy cập...</p>
      </main>
    );
  }

  if (user?.role === "admin" || bootstrapOverride) {
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
          Trang quản trị chỉ dành cho tài khoản có vai trò admin.
        </p>
        <Link
          href={user ? "/dashboard" : "/"}
          className="mt-5 inline-flex h-10 items-center justify-center rounded-[7px] bg-orange px-5 text-[13px] font-semibold text-white transition-colors hover:bg-orange-dark"
        >
          {user ? "Về bảng điều khiển" : "Về trang chủ"}
        </Link>
        <button
          type="button"
          onClick={() => setBootstrapOverride(true)}
          className="mt-4 block w-full text-[12px] text-ink-3 underline decoration-dotted underline-offset-2 hover:text-ink"
        >
          Tôi có mã bootstrap quản trị
        </button>
      </div>
    </main>
  );
}
