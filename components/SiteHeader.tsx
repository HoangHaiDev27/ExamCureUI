"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, LayoutDashboard, LogOut, Menu, ShieldCheck, X } from "lucide-react";
import { Logo } from "./Logo";
import { Button } from "./Button";
import { useAuth, logout, initials, type AuthUser } from "@/lib/auth";
import { useAuthModal } from "@/components/auth/AuthModalProvider";

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const user = useAuth();
  const { openAuth } = useAuthModal();

  const schoolId = user?.schoolId || "fptu";
  const schoolLabel = schoolId === "fptu" ? "FPTU" : schoolId.toUpperCase();

  const navItems = [
    { href: `/schools/${schoolId}/subjects`, label: `Luyện thi ${schoolLabel}` },
    { href: "/dien-dan", label: "Diễn đàn" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur-[6px]">
      <div className="mx-auto flex h-16 max-w-[1240px] items-center gap-4 px-5 lg:px-8">
        {/* Left: logo */}
        <div className="flex flex-1 items-center">
          <Logo size={100} />
        </div>

        {/* Center: nav */}
        <nav className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => {
            const active = pathname === item.href.split("?")[0];
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`rounded-[6px] px-3 py-2 text-[14px] font-medium transition-colors ${
                  active
                    ? "bg-paper-3 text-ink"
                    : "text-ink-2 hover:bg-paper-2 hover:text-ink"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: auth + mobile toggle */}
        <div className="flex flex-1 items-center justify-end gap-2.5">
          {user ? (
            <div className="hidden lg:block">
              <UserMenu user={user} />
            </div>
          ) : (
            <div className="hidden items-center gap-2.5 lg:flex">
              <Button onClick={() => openAuth("login")} variant="outline" size="sm">
                Đăng nhập
              </Button>
              <Button onClick={() => openAuth("login")} variant="primary" size="sm">
                Thi thử ngay
              </Button>
            </div>
          )}

          <button
            onClick={() => setOpen((v) => !v)}
            className="grid h-10 w-10 place-items-center rounded-[6px] text-ink hover:bg-paper-3 lg:hidden"
            aria-label="Mở menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-line bg-paper lg:hidden">
          <nav className="mx-auto flex max-w-[1240px] flex-col gap-1 px-5 py-3">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-[6px] px-3 py-2.5 text-[15px] font-medium text-ink-2 hover:bg-paper-2"
              >
                {item.label}
              </Link>
            ))}

            {user ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 rounded-[6px] px-3 py-2.5 text-[15px] font-medium text-ink-2 hover:bg-paper-2"
                >
                  <LayoutDashboard size={17} className="text-ink-3" /> Bảng điều khiển
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setOpen(false);
                  }}
                  className="flex items-center gap-2.5 rounded-[6px] px-3 py-2.5 text-left text-[15px] font-medium text-danger hover:bg-danger-soft"
                >
                  <LogOut size={17} /> Đăng xuất
                </button>
              </>
            ) : (
              <div className="mt-2 flex gap-2.5">
                <Button
                  onClick={() => {
                    setOpen(false);
                    openAuth("login");
                  }}
                  variant="outline"
                  size="md"
                  className="flex-1"
                >
                  Đăng nhập
                </Button>
                <Button
                  onClick={() => {
                    setOpen(false);
                    openAuth("login");
                  }}
                  variant="primary"
                  size="md"
                  className="flex-1"
                >
                  Thi thử ngay
                </Button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

function UserMenu({ user }: { user: AuthUser }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const short = user.name.trim().split(/\s+/).slice(-2).join(" ");

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-line bg-paper py-1 pl-1 pr-2.5 transition-colors hover:border-line-strong hover:bg-paper-2"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="grid h-8 w-8 place-items-center rounded-full bg-ink text-[12px] font-semibold text-white">
          {initials(user.name)}
        </span>
        <span className="max-w-[120px] truncate text-[13.5px] font-medium text-ink">{short}</span>
        <ChevronDown size={15} className={`text-ink-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+8px)] w-60 overflow-hidden rounded-[10px] border border-line bg-paper py-1 shadow-[var(--shadow-pop)]"
        >
          <div className="flex items-center gap-3 border-b border-line px-4 py-3">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-ink text-[13px] font-semibold text-white">
              {initials(user.name)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[13.5px] font-semibold text-ink">{user.name}</p>
              {user.email && <p className="truncate text-[12px] text-ink-3">{user.email}</p>}
            </div>
          </div>

          <Link
            href="/dashboard"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-[14px] font-medium text-ink-2 transition-colors hover:bg-paper-2 hover:text-ink"
            role="menuitem"
          >
            <LayoutDashboard size={16} className="text-ink-3" /> Bảng điều khiển
          </Link>

          {user.role === "admin" && (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-[14px] font-medium text-ink-2 transition-colors hover:bg-paper-2 hover:text-ink"
              role="menuitem"
            >
              <ShieldCheck size={16} className="text-orange" /> Quản trị nội dung AI
            </Link>
          )}

          <div className="my-1 h-px bg-line" />

          <button
            onClick={() => {
              setOpen(false);
              logout();
              router.push("/");
            }}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-[14px] font-medium text-danger transition-colors hover:bg-danger-soft"
            role="menuitem"
          >
            <LogOut size={16} /> Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
}
