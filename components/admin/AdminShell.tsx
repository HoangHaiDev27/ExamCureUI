"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  BookOpen,
  ChevronRight,
  ClipboardCheck,
  FileQuestion,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  School,
  ShieldAlert,
  Users,
  X,
} from "lucide-react";
import { ButtonLink } from "@/components/Button";
import { getAuth, initials, login, logout } from "@/lib/auth";
import { adminApi, ApiError } from "@/lib/admin";
import { ToastProvider } from "./ui";

const NAV_GROUPS = [
  {
    label: "Điều hành",
    items: [{ href: "/admin", label: "Bảng điều khiển", icon: LayoutDashboard }],
  },
  {
    label: "Danh mục",
    items: [
      { href: "/admin/truong", label: "Trường", icon: School },
      { href: "/admin/hoc-phan", label: "Học phần", icon: BookOpen },
      { href: "/admin/cau-hoi", label: "Ngân hàng câu hỏi", icon: FileQuestion },
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
const NAV = NAV_GROUPS.flatMap((g) => g.items);

type Gate =
  | { status: "checking" }
  | { status: "ok"; name: string; email: string }
  | { status: "denied"; reason: string };

/**
 * Chỉ là lớp chắn giao diện — quyền thật do BE kiểm (RolesGuard đọc role từ DB).
 * Hỏi /auth/me thay vì tin role cache trong localStorage / cookie của proxy.ts.
 */
export function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [gate, setGate] = useState<Gate>({ status: "checking" });
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    if (!auth?.token) {
      // Xoá cả cookie role, nếu không proxy sẽ đẩy /dang-nhap ngược về /admin.
      logout();
      router.replace("/dang-nhap");
      return;
    }
    adminApi
      .me()
      .then((me) => {
        // Đồng bộ role thật từ DB về localStorage + cookie.
        if (me.role !== auth.role) login({ ...auth, role: me.role });
        setGate(
          me.role === "Admin"
            ? { status: "ok", name: me.fullName || me.email, email: me.email }
            : { status: "denied", reason: "Tài khoản của bạn không có quyền quản trị." },
        );
      })
      .catch((e: ApiError) => {
        if (e.status === 401) router.replace("/dang-nhap");
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
      <div className="grid min-h-screen place-items-center bg-[#0f1216] text-[14px] text-white/70">
        <span className="flex items-center gap-2">
          <Loader2 size={18} className="animate-spin" /> Đang kiểm tra quyền truy cập…
        </span>
      </div>
    );
  }

  if (gate.status === "denied") {
    return (
      <div className="grid min-h-screen place-items-center px-5">
        <div className="max-w-md text-center">
          <ShieldAlert size={36} className="mx-auto text-danger" />
          <h1 className="mt-4 text-[22px] font-bold text-ink">Không thể truy cập trang quản trị</h1>
          <p className="mt-2 text-[14.5px] text-ink-2">{gate.reason}</p>
          <div className="mt-6 flex justify-center gap-2.5">
            <ButtonLink href="/" variant="outline" size="sm">
              Về trang chủ
            </ButtonLink>
            <ButtonLink href="/dang-nhap" size="sm">
              Đăng nhập tài khoản khác
            </ButtonLink>
          </div>
        </div>
      </div>
    );
  }

  const isActive = (href: string) => (href === "/admin" ? pathname === href : pathname.startsWith(href));
  const current = NAV.find((n) => isActive(n.href));
  const signOut = () => {
    logout();
    router.replace("/dang-nhap");
  };

  const sidebar = (
    <div className="flex h-full flex-col bg-[#0f1216] text-white">
      <div className="flex h-16 shrink-0 items-center gap-2.5 px-5">
        <Link href="/admin" className="inline-flex items-baseline text-[22px] tracking-tight">
          <span className="font-sans font-semibold text-white">Exam</span>
          <span className="ml-0.5 font-display font-bold italic text-orange">Cure</span>
        </Link>
        <span className="rounded-[4px] border border-white/15 px-1.5 py-[1px] font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-white/60">
          Admin
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4" aria-label="Điều hướng quản trị">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mt-5 first:mt-2">
            <p className="px-3 pb-1.5 font-mono text-[10.5px] font-medium uppercase tracking-[0.14em] text-white/35">{group.label}</p>
            {group.items.map(({ href, label, icon: Icon }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setMenuOpen(false)}
                  className={`relative flex items-center gap-2.5 rounded-[6px] px-3 py-2 text-[14px] font-medium transition-colors ${
                    active ? "bg-white/[0.08] text-white" : "text-white/60 hover:bg-white/[0.04] hover:text-white"
                  }`}
                >
                  {active && <span className="absolute inset-y-2 -left-3 w-[3px] rounded-r-full bg-orange" aria-hidden />}
                  <Icon size={17} className={active ? "text-orange" : "text-white/40"} />
                  {label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="border-t border-white/[0.08] p-3">
        <div className="flex items-center gap-3 rounded-[8px] px-2 py-2">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-orange text-[12.5px] font-semibold text-white">
            {initials(gate.name)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13.5px] font-semibold leading-tight text-white">{gate.name}</p>
            <p className="truncate text-[12px] leading-tight text-white/45">{gate.email}</p>
          </div>
          <button
            onClick={signOut}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-[6px] text-white/50 transition-colors hover:bg-danger/20 hover:text-[#ff8a8d]"
            aria-label="Đăng xuất"
            title="Đăng xuất"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <ToastProvider>
      <div className="min-h-screen lg:pl-[256px]">
        {/* Sidebar (desktop) */}
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-[256px] lg:block">{sidebar}</aside>

        {/* Drawer (mobile) */}
        {menuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu quản trị">
            <button className="absolute inset-0 bg-ink/50 animate-fadein" onClick={() => setMenuOpen(false)} aria-label="Đóng menu" />
            <aside className="absolute inset-y-0 left-0 w-[272px] max-w-[85vw] shadow-[var(--shadow-pop)]">{sidebar}</aside>
          </div>
        )}

        {/* Topbar */}
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-paper/90 px-4 backdrop-blur-[6px] lg:px-8">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="grid h-10 w-10 place-items-center rounded-[6px] text-ink hover:bg-paper-3 lg:hidden"
            aria-label={menuOpen ? "Đóng menu quản trị" : "Mở menu quản trị"}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <nav className="flex min-w-0 items-center gap-1.5 text-[13.5px]" aria-label="Breadcrumb">
            <Link href="/admin" className="hidden text-ink-3 hover:text-ink sm:inline">
              Quản trị
            </Link>
            <ChevronRight size={14} className="hidden shrink-0 text-ink-3 sm:inline" />
            <span className="truncate font-semibold text-ink">{current?.label ?? "Quản trị"}</span>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <TodayStamp />
            <span className="grid h-9 w-9 place-items-center rounded-full bg-ink text-[12.5px] font-semibold text-white lg:hidden">
              {initials(gate.name)}
            </span>
          </div>
        </header>

        <main className="mx-auto max-w-[1360px] px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </ToastProvider>
  );
}

/** Ngày hiện tại. Khung admin chỉ hiện sau khi gate chạy ở client nên không lo lệch khi hydrate. */
function TodayStamp() {
  const text = new Date().toLocaleDateString("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" });
  return (
    <span className="hidden rounded-[6px] border border-line bg-paper-2 px-2.5 py-1 font-mono text-[12px] text-ink-2 tabular-nums sm:inline">
      {text}
    </span>
  );
}
