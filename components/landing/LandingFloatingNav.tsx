"use client";

import Link from "next/link";
import {
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import { useState, type CSSProperties } from "react";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo";
import { useAuthModal } from "@/components/auth/AuthModalProvider";

const NAV_ITEMS = [
  { href: "/", label: "Trang chủ" },
  { href: "/pricing", label: "Pricing" },
];

export function LandingFloatingNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const { openAuth } = useAuthModal();

  return (
    <div className="flex justify-center px-3 pt-4 sm:px-4 sm:pt-6">
      <div className="relative flex w-full max-w-[760px] items-center rounded-full border border-neutral-200 bg-white py-2 pl-2 pr-2 shadow-sm">
        <Link
          href="/"
          className="shrink-0"
          aria-label="Trang chủ ExamCure"
          style={{ "--color-orange": "#e9783a" } as CSSProperties}
        >
          <Logo size={24} href={null} />
        </Link>

        <nav
          className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-6 md:flex"
          aria-label="Điều hướng chính"
        >
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              aria-current={pathname === item.href ? "page" : undefined}
              className={`rounded-full px-3 py-1.5 text-[14px] font-medium transition-colors duration-200 ${
                pathname === item.href
                  ? "bg-[#fff0e9] text-[#c9421f]"
                  : "text-neutral-700 hover:text-neutral-950"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              openAuth("login");
            }}
            aria-haspopup="dialog"
            className="inline-flex items-center gap-2 rounded-full bg-[#ef4d23] py-1.5 pl-4 pr-1.5 text-[12px] font-semibold text-white transition-colors duration-200 hover:bg-[#d9421d] sm:pl-5 sm:text-[13px]"
          >
            <span>Thi thử ngay</span>
            <span className="grid h-7 w-7 place-items-center rounded-full bg-white/20">
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </span>
          </button>
          <button
            type="button"
            onClick={() => setMenuOpen((current) => !current)}
            aria-expanded={menuOpen}
            aria-controls="landing-mobile-menu"
            aria-label={menuOpen ? "Đóng menu" : "Mở menu"}
            className="grid h-9 w-9 place-items-center rounded-full text-neutral-700 md:hidden"
          >
            {menuOpen ? (
              <X className="h-[18px] w-[18px]" aria-hidden="true" />
            ) : (
              <Menu className="h-[18px] w-[18px]" aria-hidden="true" />
            )}
          </button>
        </div>

        {menuOpen && (
          <div
            id="landing-mobile-menu"
            className="absolute left-2 right-2 top-full z-20 mt-2 rounded-2xl border border-neutral-200 bg-white p-3 shadow-lg md:hidden"
          >
            <nav className="space-y-1" aria-label="Điều hướng mobile">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  aria-current={pathname === item.href ? "page" : undefined}
                  className={`flex items-center rounded-xl px-3 py-2.5 text-[14px] font-medium ${
                    pathname === item.href
                      ? "bg-[#fff0e9] text-[#c9421f]"
                      : "text-neutral-700"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    </div>
  );
}
