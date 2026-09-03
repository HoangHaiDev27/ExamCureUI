"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { ChevronRight, Search, SlidersHorizontal, Star, X } from "lucide-react";
import { SCHOOLS, FIELDS, REGIONS } from "@/lib/schools";
import { SchoolCard } from "@/components/SchoolCard";
import { SchoolMark } from "@/components/SchoolMark";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d");

export default function SchoolsPage() {
  const [query, setQuery] = useState("");
  const [field, setField] = useState<string | null>(null);
  const [region, setRegion] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = norm(query.trim());
    return SCHOOLS.filter((s) => {
      if (field && s.field !== field) return false;
      if (region && s.region !== region) return false;
      if (!q) return true;
      return (
        norm(s.name).includes(q) ||
        norm(s.abbr).includes(q) ||
        norm(s.city).includes(q) ||
        norm(s.theme.systemName).includes(q)
      );
    });
  }, [query, field, region]);

  const suggestions = useMemo(() => {
    const q = norm(query.trim());
    if (!q) return [];
    return SCHOOLS.filter(
      (s) => norm(s.name).includes(q) || norm(s.abbr).includes(q)
    ).slice(0, 6);
  }, [query]);

  const hasFilters = Boolean(query || field || region);
  const popular = SCHOOLS.filter((s) => s.popular);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-[1240px] px-5 pb-20 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 py-5 text-[13px] text-ink-3">
          <Link href="/" className="hover:text-ink">
            Trang chủ
          </Link>
          <ChevronRight size={14} />
          <span className="font-medium text-ink-2">Chọn trường</span>
        </nav>

        {/* Heading */}
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-border bg-orange-soft px-3 py-1 text-[12.5px] font-medium text-orange-dark">
            Bước 1 / 2 · Chọn trường
          </span>
          <h1 className="mt-3 font-display text-[34px] font-semibold leading-tight text-ink sm:text-[42px]">
            Chọn trường của bạn
          </h1>
          <p className="mt-2 text-[16px] leading-relaxed text-ink-2">
            Mỗi trường có một giao diện phòng thi riêng. Chọn trường để vào đúng
            môi trường thi mô phỏng phần mềm trường bạn đang dùng.
          </p>
        </div>

        {/* Search + filters */}
        <div className="mt-7 rounded-[10px] border border-line bg-paper p-3.5 shadow-[var(--shadow-1)]">
          <div ref={boxRef} className="relative">
            <Search
              size={18}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setTimeout(() => setFocused(false), 120)}
              placeholder="Tìm theo tên trường, mã trường hoặc tên phần mềm thi…"
              className="h-12 w-full rounded-[7px] border border-line bg-paper-2 pl-11 pr-10 text-[15px] text-ink outline-none transition-colors placeholder:text-ink-3 focus:border-orange focus:bg-paper"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-ink-3 hover:bg-paper-3 hover:text-ink"
                aria-label="Xóa tìm kiếm"
              >
                <X size={16} />
              </button>
            )}

            {/* Type-ahead */}
            {focused && suggestions.length > 0 && (
              <ul className="absolute left-0 right-0 top-[calc(100%+6px)] z-20 overflow-hidden rounded-[8px] border border-line bg-paper py-1 shadow-[var(--shadow-pop)]">
                {suggestions.map((s) => (
                  <li key={s.id}>
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-3 px-3 py-2 hover:bg-paper-2"
                    >
                      <SchoolMark theme={s.theme} abbr={s.abbr} size={30} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] font-medium text-ink">
                          {s.name}
                        </span>
                        <span className="block truncate text-[12px] text-ink-3">
                          {s.abbr} · {s.city}
                        </span>
                      </span>
                      <ChevronRight size={15} className="text-ink-3" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Filter rows */}
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-line pt-3">
            <span className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-ink-3">
              <SlidersHorizontal size={14} /> Khối ngành
            </span>
            <div className="flex flex-wrap gap-1.5">
              {FIELDS.map((f) => (
                <Chip key={f} active={field === f} onClick={() => setField(field === f ? null : f)}>
                  {f}
                </Chip>
              ))}
            </div>
          </div>
          <div className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-3">
            <span className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-ink-3">
              <SlidersHorizontal size={14} className="opacity-0" /> Khu vực
            </span>
            <div className="flex flex-wrap gap-1.5">
              {REGIONS.map((r) => (
                <Chip key={r} active={region === r} onClick={() => setRegion(region === r ? null : r)}>
                  {r}
                </Chip>
              ))}
            </div>
          </div>
        </div>

        {/* Popular (pinned) — only when no active filtering */}
        {!hasFilters && (
          <section className="mt-10">
            <div className="flex items-center gap-2">
              <Star size={16} className="text-orange" fill="currentColor" />
              <h2 className="text-[15px] font-semibold uppercase tracking-wide text-ink-2">
                Trường phổ biến
              </h2>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {popular.map((s) => (
                <SchoolCard key={s.id} school={s} />
              ))}
            </div>
          </section>
        )}

        {/* All / results */}
        <section className="mt-10">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[15px] font-semibold uppercase tracking-wide text-ink-2">
              {hasFilters ? "Kết quả" : "Tất cả các trường"}
            </h2>
            <span className="tnum text-[13px] text-ink-3">
              {filtered.length} trường
            </span>
          </div>

          {filtered.length > 0 ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((s) => (
                <SchoolCard key={s.id} school={s} />
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-[10px] border border-dashed border-line-strong bg-paper py-16 text-center">
              <p className="text-[15px] font-medium text-ink">Không tìm thấy trường phù hợp</p>
              <p className="mt-1 text-[14px] text-ink-2">
                Thử bỏ bớt bộ lọc hoặc tìm với từ khóa khác.
              </p>
              <button
                onClick={() => {
                  setQuery("");
                  setField(null);
                  setRegion(null);
                }}
                className="mt-4 text-[14px] font-medium text-orange hover:text-orange-dark"
              >
                Xóa tất cả bộ lọc
              </button>
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-[6px] border px-3 py-1.5 text-[13px] font-medium transition-colors ${
        active
          ? "border-orange bg-orange-soft text-orange-dark"
          : "border-line bg-paper text-ink-2 hover:border-line-strong hover:bg-paper-2"
      }`}
    >
      {children}
    </button>
  );
}
