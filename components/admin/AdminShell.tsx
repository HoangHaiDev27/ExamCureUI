"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  BookOpen,
  ClipboardCheck,
  ExternalLink,
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
import { Logo } from "@/components/Logo";
import { ButtonLink } from "@/components/Button";
import { getAuth, initials, logout } from "@/lib/auth";
import { adminApi, ApiError } from "@/lib/admin";
import { ToastProvider } from "./ui";

const NAV = [
  { href: "/admin", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/admin/nguoi-dung", label: "Người dùng", icon: Users },
  { href: "/admin/truong", label: "Trường", icon: School },
  { href: "/admin/hoc-phan", label: "Học phần", icon: BookOpen },
  { href: "/admin/cau-hoi", label: "Ngân hàng câu hỏi", icon: FileQuestion },
  { href: "/admin/bai-thi", label: "Bài thi đã nộp", icon: ClipboardCheck },
];

type Gate =
  | { status: "checking" }
  | { status: "ok"; name: string; email: string }
  | { status: "denied"; reason: string };

/**
 * Chỉ là lớp chắn giao diện — quyền thật do BE kiểm (RolesGuard đọc role từ DB).
 * Hỏi /auth/me thay vì tin role cache trong localStorage.
 */
export function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [gate, setGate] = useState<Gate>({ status: "checking" });
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!getAuth()?.token) {
      router.replace("/dang-nhap");
      return;
    }
    adminApi
      .me()
      .then((me) =>
        me.role === "Admin"
          ? setGate({ status: "ok", name: me.fullName || me.email, email: me.email })
          : setGate({ status: "denied", reason: "Tài khoản của bạn không có quyền quản trị." }),
      )
      .catch((e: ApiError) => {
        if (e.status === 401) router.replace("/dang-nhap");
        else setGate({ status: "denied", reason: e.message });
      });
  }, [router]);

  if (gate.status === "checking") {
    return (
      <div className="grid min-h-screen place-items-center text-[14px] text-ink-2">
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

  const nav = (
    <nav className="flex flex-col gap-0.5 p-3">
      {NAV.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          onClick={() => setMenuOpen(false)}
          className={`flex items-center gap-2.5 rounded-[6px] px-3 py-2 text-[14px] font-medium transition-colors ${
            isActive(href) ? "bg-orange-soft text-orange-dark" : "text-ink-2 hover:bg-paper-2 hover:text-ink"
          }`}
        >
          <Icon size={17} className={isActive(href) ? "text-orange" : "text-ink-3"} />
          {label}
        </Link>
      ))}
    </nav>
  );

  return (
    <ToastProvider>
      <div className="min-h-screen lg:pl-[248px]">
        {/* Sidebar (desktop) */}
        <aside className="fixed inset-y-0 left-0 hidden w-[248px] flex-col border-r border-line bg-paper lg:flex">
          <div className="flex h-16 items-center gap-2 border-b border-line px-5">
            <Logo size={28} href="/admin" />
            <span className="rounded-[4px] bg-ink px-1.5 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.06em] text-white">Admin</span>
          </div>
          <div className="flex-1 overflow-y-auto">{nav}</div>
          <div className="border-t border-line p-3">
            <Link href="/" className="flex items-center gap-2.5 rounded-[6px] px-3 py-2 text-[13.5px] font-medium text-ink-2 hover:bg-paper-2 hover:text-ink">
              <ExternalLink size={16} className="text-ink-3" /> Xem trang người dùng
            </Link>
          </div>
        </aside>

        {/* Topbar */}
        <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-line bg-paper/90 px-4 backdrop-blur-[6px] lg:px-8">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="grid h-10 w-10 place-items-center rounded-[6px] text-ink hover:bg-paper-3 lg:hidden"
            aria-label="Mở menu quản trị"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <span className="text-[14px] font-semibold text-ink lg:hidden">Quản trị ExamCure</span>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-[13.5px] font-semibold leading-tight text-ink">{gate.name}</p>
              <p className="text-[12px] leading-tight text-ink-3">{gate.email}</p>
            </div>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-ink text-[12.5px] font-semibold text-white">{initials(gate.name)}</span>
            <button
              onClick={() => {
                logout();
                router.replace("/dang-nhap");
              }}
              className="grid h-9 w-9 place-items-center rounded-[6px] text-ink-3 hover:bg-danger-soft hover:text-danger"
              aria-label="Đăng xuất"
              title="Đăng xuất"
            >
              <LogOut size={17} />
            </button>
          </div>
        </header>

        {menuOpen && <div className="border-b border-line bg-paper lg:hidden">{nav}</div>}

        <main className="mx-auto max-w-[1280px] px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </ToastProvider>
  );
}
