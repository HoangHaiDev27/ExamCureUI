"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  BookOpen,
  ClipboardCheck,
  FileQuestion,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  School,
  ShieldAlert,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { ButtonLink } from "@/components/Button";
import { Logo } from "@/components/Logo";
import { getAuth, initials, login, logout } from "@/lib/auth";
import { adminApi, ApiError } from "@/lib/admin";
import { isSupabaseBrowserConfigured } from "@/lib/supabase-browser";
import { FPT_DASHBOARD_ACCENT } from "@/lib/theme";
import { ToastProvider } from "./ui";

const NAV_GROUPS = [
  {
    label: "Tổng quan",
    items: [{ href: "/admin", label: "Bảng điều khiển", icon: LayoutDashboard }],
  },
  {
    label: "Danh mục",
    items: [
      { href: "/admin/truong", label: "Trường", icon: School },
      { href: "/admin/hoc-phan", label: "Học phần", icon: BookOpen },
      { href: "/admin/cau-hoi", label: "Ngân hàng câu hỏi", icon: FileQuestion },
      { href: "/admin/noi-dung-ai", label: "Nội dung AI", icon: Sparkles },
    ],
  },
  {
    label: "Hoạt động",
    items: [
      { href: "/admin/nguoi-dung", label: "Người dùng", icon: Users },
      { href: "/admin/bai-thi", label: "Bài thi đã nộp", icon: ClipboardCheck },
    ],
  },
];

type Gate =
  | { status: "checking" }
  | { status: "ok"; name: string; email: string }
  | { status: "denied"; reason: string };

/**
 * Chỉ là lớp chắn giao diện — quyền thật do BE kiểm (RolesGuard đọc role từ DB).
 * Hỏi /auth/me thay vì tin role cache trong localStorage / cookie của proxy.ts.
 *
 * Dashboard này gọi API admin của BE NestJS. Khi FE cấu hình Supabase, token là của
 * Supabase nên NestJS sẽ trả 401 (và lib/admin sẽ logout) → chuyển sang AdminConsole.
 */
export function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [gate, setGate] = useState<Gate>({ status: "checking" });
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (isSupabaseBrowserConfigured()) {
      router.replace("/admin/noi-dung-ai");
      return;
    }
    const auth = getAuth();
    if (!auth?.token) {
      // Xoá cả cookie role, nếu không proxy sẽ đẩy trang chủ ngược về /admin.
      logout();
      router.replace("/");
      return;
    }
    adminApi
      .me()
      .then((me) => {
        // Đồng bộ role thật từ DB về localStorage + cookie.
        const isAdmin = me.role.toLowerCase() === "admin";
        if (me.role.toLowerCase() !== auth.role) login({ ...auth, role: me.role });
        setGate(
          isAdmin
            ? { status: "ok", name: me.fullName || me.email, email: me.email }
            : { status: "denied", reason: "Tài khoản của bạn không có quyền quản trị." },
        );
      })
      .catch((e: ApiError) => {
        if (e.status === 401) router.replace("/");
        else setGate({ status: "denied", reason: e.message });
      });
  }, [router]);

  // Đóng drawer bằng phím Esc.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  if (gate.status === "checking") {
    return (
      <div className="grid min-h-screen place-items-center bg-paper-2 text-[14px] text-ink-2" style={FPT_DASHBOARD_ACCENT}>
        <span className="flex items-center gap-2">
          <Loader2 size={18} className="animate-spin text-orange" /> Đang kiểm tra quyền truy cập…
        </span>
      </div>
    );
  }

  if (gate.status === "denied") {
    return (
      <div className="grid min-h-screen place-items-center bg-paper-2 px-5" style={FPT_DASHBOARD_ACCENT}>
        <div className="max-w-md text-center">
          <ShieldAlert size={36} className="mx-auto text-danger" />
          <h1 className="mt-4 font-display text-[24px] font-semibold text-ink">Không thể truy cập trang quản trị</h1>
          <p className="mt-2 text-[14.5px] text-ink-2">{gate.reason}</p>
          <div className="mt-6 flex justify-center gap-2.5">
            <ButtonLink href="/" variant="outline" size="sm">
              Về trang chủ
            </ButtonLink>
            <ButtonLink href="/dashboard" size="sm">
              Về bảng điều khiển
            </ButtonLink>
          </div>
        </div>
      </div>
    );
  }

  const isActive = (href: string) => (href === "/admin" ? pathname === href : pathname.startsWith(href));
  const signOut = () => {
    logout();
    router.replace("/");
  };

  const brand = (
    <div>
      <Logo size={28} href="/admin" />
      <p className="mt-2 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-3">Không gian quản trị</p>
    </div>
  );

  // Cùng cấu trúc với sidebar /dashboard của sinh viên (nhóm, mục active, thẻ tài khoản).
  const nav = (
    <nav className="mt-5 space-y-4" aria-label="Điều hướng quản trị">
      {NAV_GROUPS.map((group) => (
        <div key={group.label} className="space-y-1">
          <h3 className="px-3 text-[10.5px] font-bold uppercase tracking-wider text-ink-3">{group.label}</h3>
          <div className="space-y-0.5">
            {group.items.map(({ href, label, icon: Icon }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={`relative flex w-full items-center gap-3 rounded-[7px] px-3 py-2.5 text-[13px] font-medium transition-all duration-200 ${
                    active
                      ? "translate-x-1 bg-orange-soft font-semibold text-orange-dark"
                      : "text-ink-2 hover:translate-x-0.5 hover:bg-paper-2 hover:text-ink"
                  }`}
                >
                  {active && <span className="absolute -left-1 h-5 w-0.5 rounded-full bg-orange" aria-hidden="true" />}
                  <Icon size={15} className={active ? "text-orange" : "text-ink-3"} />
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );

  const account = (
    <div className="flex items-center gap-3 rounded-[10px] border border-line bg-paper-2/60 p-2.5">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink text-[13px] font-semibold text-white">{initials(gate.name)}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13.5px] font-semibold leading-tight text-ink">{gate.name}</p>
        <p className="truncate text-[11.5px] leading-tight text-ink-3">Quản trị viên · {gate.email}</p>
      </div>
      <button
        onClick={signOut}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-[6px] text-ink-3 transition-colors hover:bg-danger-soft hover:text-danger"
        aria-label="Đăng xuất"
        title="Đăng xuất"
      >
        <LogOut size={16} />
      </button>
    </div>
  );

  return (
    <ToastProvider>
      <div className="dashboard-shell flex min-h-screen w-full bg-paper-2" style={FPT_DASHBOARD_ACCENT}>
        {/* Sidebar (desktop) */}
        <aside className="dashboard-sidebar sticky top-0 hidden h-[100dvh] w-[268px] flex-none self-start overflow-y-auto overscroll-contain border-r border-line bg-paper lg:block">
          <div className="flex min-h-full flex-col justify-between p-6">
            <div>
              <div className="border-b border-line px-3 pb-5">{brand}</div>
              {nav}
            </div>
            <div className="mt-6 border-t border-line pt-4">{account}</div>
          </div>
        </aside>

        {/* Drawer (mobile) */}
        {menuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu quản trị">
            <button className="absolute inset-0 bg-ink/40 animate-fadein" onClick={() => setMenuOpen(false)} aria-label="Đóng menu" />
            <aside className="dashboard-mobile-drawer absolute inset-y-0 left-0 flex w-[min(86vw,340px)] flex-col overflow-y-auto border-r border-line bg-paper p-5 shadow-2xl">
              <div className="flex items-start justify-between border-b border-line pb-4">
                {brand}
                <button
                  onClick={() => setMenuOpen(false)}
                  className="grid h-9 w-9 place-items-center rounded-[8px] text-ink-2 hover:bg-paper-2"
                  aria-label="Đóng menu"
                >
                  <X size={18} />
                </button>
              </div>
              {nav}
              <div className="mt-auto border-t border-line pt-4">{account}</div>
            </aside>
          </div>
        )}

        <div className="min-w-0 flex-1 p-5 lg:p-8">
          {/* Thanh trên (mobile) */}
          <div className="sticky top-0 z-30 -mx-5 -mt-5 mb-6 flex items-center justify-between border-b border-line bg-paper-2/95 px-5 py-3.5 backdrop-blur-md lg:hidden">
            <Logo size={24} href="/admin" />
            <button
              onClick={() => setMenuOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-[8px] border border-line bg-paper text-ink-2 shadow-[var(--shadow-1)] transition-colors hover:border-orange-border hover:bg-orange-soft hover:text-orange-dark"
              aria-label="Mở menu quản trị"
            >
              <Menu size={19} />
            </button>
          </div>

          <main className="dashboard-view mx-auto max-w-[1280px]">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
