import Link from "next/link";
import { ArrowLeftRight, MonitorCheck } from "lucide-react";
import type { School } from "@/lib/types";
import { SchoolMark } from "./SchoolMark";
import { Logo } from "./Logo";

/** Thanh ngữ cảnh: nhắc người dùng đang ở trong không gian của trường nào. */
export function SchoolContextBar({ school }: { school: School }) {
  return (
    <div className="sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur-[6px]">
      <div className="mx-auto flex h-[60px] max-w-[1180px] items-center gap-3 px-5 lg:px-8">
        <Logo size={26} />
        <span className="mx-1 hidden h-6 w-px bg-line sm:block" />

        <div className="hidden min-w-0 items-center gap-2.5 sm:flex">
          <SchoolMark theme={school.theme} abbr={school.abbr} size={32} />
          <div className="min-w-0">
            <p className="truncate text-[13.5px] font-semibold leading-tight text-ink">
              {school.name}
            </p>
            <p className="flex items-center gap-1 text-[11.5px] leading-tight text-ink-3">
              <MonitorCheck size={11} className="text-blue" />
              {school.theme.systemName}
            </p>
          </div>
        </div>

        <Link
          href="/schools"
          className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-[6px] border border-line-strong bg-paper px-3 text-[13px] font-medium text-ink-2 transition-colors hover:border-ink-3 hover:text-ink"
        >
          <ArrowLeftRight size={15} /> Đổi trường
        </Link>
      </div>
    </div>
  );
}
