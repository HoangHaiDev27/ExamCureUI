"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  ChevronLeft,
  ChevronsUpDown,
  ClipboardList,
  FileChartColumn,
  LayoutDashboard,
  LogOut,
  Menu as MenuIcon,
  MessageSquare,
  RefreshCw,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Logo } from "@/components/Logo";
import { logout } from "@/lib/auth";
import { FPT_DASHBOARD_ACCENT } from "@/lib/theme";
import { useAdminUser } from "./AdminGuard";
import { AdminDataProvider, ToastProvider, useAdminData, useToast } from "./AdminData";
import { Drawer, Menu } from "./overlays";
import { Avatar, IconButton, PopItem, cx } from "./ui";

interface NavItem {
  href: string;
  title: string;
  icon: LucideIcon;
}
const OVERVIEW: NavItem = { href: "/admin", title: "Tổng quan", icon: LayoutDashboard };
const SUBJECTS: NavItem = { href: "/admin/mon-hoc", title: "Môn học", icon: BookOpen };
const MATERIALS: NavItem = { href: "/admin/tai-lieu", title: "Tài liệu", icon: FileChartColumn };
const EXAMS: NavItem = { href: "/admin/de-thi", title: "Đề thi", icon: ClipboardList };
const FEEDBACK: NavItem = { href: "/admin/phan-hoi", title: "Phản hồi", icon: MessageSquare };
const USERS: NavItem = { href: "/admin/nguoi-dung", title: "Người dùng", icon: Users };
const NAV: Array<{ label?: string; items: NavItem[] }> = [
  { items: [OVERVIEW] },
  { label: "Nội dung", items: [SUBJECTS, MATERIALS, EXAMS] },
  { label: "Hệ thống", items: [FEEDBACK, USERS] },
];
const ALL = [OVERVIEW, SUBJECTS, MATERIALS, EXAMS, FEEDBACK, USERS];

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);
}
const isExamDetail = (pathname: string) => /^\/admin\/de-thi\/[^/]+/.test(pathname);

function ProfileRow() {
  const user = useAdminUser();
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);
  const name = user?.name || "Quản trị viên";
  const email = user?.email ?? "";
  const [local = "", domain] = email.split("@");

  const signOut = async () => {
    setOpen(false);
    if (busy) return;
    setBusy(true);
    try {
      await logout();
      router.replace("/");
    } catch {
      toast({ tone: "error", title: "Không đăng xuất được", detail: "Vui lòng thử lại." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        ref={ref}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-full cursor-pointer items-center gap-2.5 overflow-hidden rounded-xl px-1 text-left outline-hidden transition-colors hover:bg-paper-3 focus-visible:ring-2 focus-visible:ring-orange/30 aria-expanded:bg-paper-3"
      >
        <Avatar name={name} />
        <span className="min-w-0 flex-1 truncate text-sm font-medium">{name}</span>
        <ChevronsUpDown aria-hidden="true" className="size-4 shrink-0 text-ink-3" />
      </button>
      <Menu open={open} anchorRef={ref} onClose={() => setOpen(false)} width="auto" ariaLabel="Tài khoản">
        {email && (
          <>
            <div className="px-1">
              <p className="flex min-w-0 px-3 py-2 text-xs text-ink-3">
                <span className="truncate">{local}</span>
                {domain !== undefined && <span className="shrink-0">@{domain}</span>}
              </p>
            </div>
            <hr className="my-1 border-line" />
          </>
        )}
        <div className="px-1">
          <PopItem role="menuitem" label="Đăng xuất" icon={LogOut} danger onClick={() => void signOut()} />
        </div>
      </Menu>
    </>
  );
}

function SidebarInner({ pathname, pending, feedback }: { pathname: string; pending: number; feedback: number }) {
  return (
    <>
      <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-line px-5">
        <Logo size={24} href="/admin" />
        <span className="text-sm font-medium text-ink-3">Quản trị</span>
      </div>
      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-3" aria-label="Mục quản trị">
        {NAV.map((group, index) => (
          <div key={group.label ?? "root"} className={cx(index > 0 && "mt-4")}>
            {group.label && (
              <p className="flex h-10 items-center px-3 text-xs font-medium tracking-wide text-ink-3 uppercase">{group.label}</p>
            )}
            <div className="flex flex-col gap-1">
              {group.items.map((item) => {
                const active = isActive(pathname, item.href);
                const count = item.href === EXAMS.href ? pending : item.href === FEEDBACK.href ? feedback : 0;
                const countLabel = item.href === FEEDBACK.href ? `${count} phản hồi mới` : `${count} đề chờ duyệt`;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    aria-label={count ? `${item.title}, ${countLabel}` : undefined}
                    className={cx(
                      "flex h-10 w-full items-center gap-2.5 rounded-xl px-3 text-sm outline-hidden transition-colors focus-visible:ring-2 focus-visible:ring-orange/30",
                      active ? "bg-orange-soft font-medium text-orange-dark" : "text-ink/70 hover:bg-paper-3 hover:text-ink",
                    )}
                  >
                    <Icon aria-hidden="true" className="size-4 shrink-0" />
                    <span className="min-w-0 flex-1 truncate">{item.title}</span>
                    {count > 0 && (
                      <span className={cx("shrink-0 text-xs tabular-nums", active ? "text-orange-dark" : "text-ink-3")} title={countLabel}>
                        {count}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="shrink-0 px-3 pt-2 pb-3">
        <ProfileRow />
      </div>
    </>
  );
}

function ShellFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { overview, refreshing, reload } = useAdminData();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerPath, setDrawerPath] = useState(pathname);
  if (drawerPath !== pathname) {
    setDrawerPath(pathname);
    setDrawerOpen(false);
  }
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = (event: MediaQueryListEvent) => {
      if (event.matches) setDrawerOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  const feedbackNew = overview?.feedbackNewCount ?? 0;
  const pending = overview ? overview.exams.filter((e) => e.status === "draft").length : 0;
  const detail = isExamDetail(pathname);
  const current = ALL.find((item) => isActive(pathname, item.href) && item.href !== "/admin") ?? (pathname === "/admin" ? OVERVIEW : null);
  const title = detail ? EXAMS.title : (current?.title ?? OVERVIEW.title);

  useEffect(() => {
    document.title = `${title} · Quản trị ExamCure`;
  }, [title]);

  return (
    <div className="flex min-h-dvh w-full bg-paper-2 text-ink">
      <aside
        className="sticky top-[env(safe-area-inset-top,0px)] hidden h-dvh w-64 shrink-0 flex-col bg-paper lg:flex"
        aria-label="Điều hướng quản trị"
      >
        <SidebarInner pathname={pathname} pending={pending} feedback={feedbackNew} />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-[env(safe-area-inset-top,0px)] z-30 flex h-16 shrink-0 items-center gap-2 border-b border-line bg-paper px-4 sm:px-6">
          <IconButton icon={MenuIcon} iconClassName="size-5" label="Mở menu điều hướng" className="size-10 rounded-xl lg:hidden" onClick={() => setDrawerOpen(true)} />
          {detail ? (
            <nav aria-label="Đường dẫn" className="min-w-0 flex-1">
              <Link
                href="/admin/de-thi"
                className="inline-flex h-10 items-center gap-1.5 rounded-xl text-sm font-medium text-ink/70 outline-hidden hover:text-ink focus-visible:ring-2 focus-visible:ring-orange/30"
              >
                <ChevronLeft aria-hidden="true" className="size-4" />
                Đề thi
              </Link>
            </nav>
          ) : (
            <h1 className="min-w-0 flex-1 truncate text-base font-semibold">{title}</h1>
          )}
          <IconButton
            icon={RefreshCw}
            label="Làm mới dữ liệu"
            className="size-9"
            aria-busy={refreshing || undefined}
            iconClassName={cx("size-4", refreshing && "animate-spin motion-reduce:animate-none")}
            onClick={() => void reload()}
          />
        </header>
        <main className="w-full max-w-[1600px] flex-1 p-4 pb-24 sm:p-6 sm:pb-24">{children}</main>
      </div>
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <SidebarInner pathname={pathname} pending={pending} feedback={feedbackNew} />
      </Drawer>
    </div>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div id="admin-root" style={FPT_DASHBOARD_ACCENT}>
      <ToastProvider>
        <AdminDataProvider>
          <ShellFrame>{children}</ShellFrame>
        </AdminDataProvider>
      </ToastProvider>
    </div>
  );
}
