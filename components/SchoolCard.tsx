import Link from "next/link";
import { ArrowRight, BookOpen, FileText, MonitorCheck } from "lucide-react";
import type { School } from "@/lib/types";
import { SchoolMark } from "./SchoolMark";

export function SchoolCard({ school }: { school: School }) {
  return (
    <Link
      href="/dashboard"
      className="group relative flex flex-col rounded-[8px] border border-line bg-paper p-5 shadow-[var(--shadow-1)] transition-all duration-150 hover:-translate-y-0.5 hover:border-orange hover:shadow-[var(--shadow-2)] focus-visible:border-orange"
    >
      <div className="flex items-start gap-3.5">
        <SchoolMark theme={school.theme} abbr={school.abbr} size={48} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-semibold uppercase tracking-wide text-ink-3">
              {school.abbr}
            </span>
            <span className="h-1 w-1 rounded-full bg-line-strong" />
            <span className="truncate text-[12px] text-ink-3">{school.field}</span>
          </div>
          <h3 className="mt-0.5 text-[16px] font-semibold leading-snug text-ink">
            {school.name}
          </h3>
          <p className="mt-0.5 truncate text-[13px] text-ink-2">{school.city}</p>
        </div>
        <ArrowRight
          size={18}
          className="mt-1 shrink-0 text-ink-3 transition-all duration-150 group-hover:translate-x-0.5 group-hover:text-orange"
        />
      </div>

      <div className="mt-4 flex items-center gap-1.5 rounded-[6px] border border-line bg-paper-2 px-2.5 py-1.5">
        <MonitorCheck size={14} className="shrink-0 text-blue" />
        <span className="truncate text-[12.5px] text-ink-2">
          Mô phỏng phần mềm thi:{" "}
          <span className="font-medium text-ink">{school.theme.systemName}</span>
        </span>
      </div>

      <div className="mt-3 flex items-center gap-4 text-[13px] text-ink-2">
        <span className="inline-flex items-center gap-1.5">
          <BookOpen size={14} className="text-ink-3" />
          <span className="tnum font-medium text-ink">{school.subjectCount}</span> môn
        </span>
        <span className="inline-flex items-center gap-1.5">
          <FileText size={14} className="text-ink-3" />
          <span className="tnum font-medium text-ink">{school.examCount}</span> đề
        </span>
      </div>
    </Link>
  );
}
