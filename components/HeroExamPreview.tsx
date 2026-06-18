import { Clock3, Flag, Send } from "lucide-react";
import { getSchool } from "@/lib/schools";

/**
 * Ảnh mockup phòng thi thật (render UI, không phải illustration AI).
 * Dùng trong hero để minh hoạ giao diện mô phỏng phần mềm thi.
 */
export function HeroExamPreview() {
  const school = getSchool("hcmut")!;
  const t = school.theme;

  // 20 ô navigator: trộn các trạng thái
  const nav = Array.from({ length: 20 }, (_, i) => {
    if (i === 11) return "current";
    if ([1, 2, 4, 5, 7, 8, 10, 13].includes(i)) return "done";
    if ([3, 9].includes(i)) return "flag";
    return "todo";
  });

  return (
    <div className="relative" aria-hidden>
      {/* Frame */}
      <div className="overflow-hidden rounded-[12px] border border-line bg-paper shadow-[var(--shadow-pop)]">
        {/* Exam header */}
        <div
          className="flex items-center gap-2.5 px-3.5 py-2.5"
          style={{ background: t.brand, color: t.onBrand }}
        >
          <span className="grid h-7 w-7 place-items-center rounded-[6px] bg-white/15 text-[10px] font-semibold">
            {school.abbr.slice(0, 3)}
          </span>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-[12.5px] font-semibold">{t.systemName}</p>
            <p className="truncate text-[10.5px] opacity-80">Lập trình HĐT · PRO192</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 rounded-[6px] bg-black/20 px-2 py-1">
            <Clock3 size={13} />
            <span className="tnum text-[13px] font-semibold">44:58</span>
          </div>
        </div>

        {/* Body */}
        <div className="grid grid-cols-[1fr_104px] gap-0">
          <div className="border-r border-line p-3.5">
            <div className="flex items-center justify-between">
              <span className="tnum text-[12px] font-semibold text-ink">
                Câu 12<span className="text-ink-3">/20</span>
              </span>
              <span className="inline-flex items-center gap-1 rounded-[5px] border border-line px-1.5 py-0.5 text-[10px] text-ink-3">
                <Flag size={10} /> Đánh dấu
              </span>
            </div>
            <p className="mt-2 text-[12.5px] font-medium leading-snug text-ink">
              Độ phức tạp trung bình của tìm kiếm nhị phân là?
            </p>
            <div className="mt-2.5 space-y-1.5">
              {[
                { l: "A", t: "O(1)", on: false },
                { l: "B", t: "O(log n)", on: true },
                { l: "C", t: "O(n)", on: false },
                { l: "D", t: "O(n log n)", on: false },
              ].map((o) => (
                <div
                  key={o.l}
                  className="flex items-center gap-2 rounded-[6px] border px-2 py-1.5"
                  style={{
                    borderColor: o.on ? t.brand : "var(--color-line)",
                    background: o.on ? t.tint : "var(--color-paper)",
                  }}
                >
                  <span
                    className="grid h-5 w-5 place-items-center rounded-[4px] text-[10px] font-semibold"
                    style={{
                      background: o.on ? t.brand : "var(--color-paper-3)",
                      color: o.on ? "#fff" : "var(--color-ink-2)",
                    }}
                  >
                    {o.l}
                  </span>
                  <span className="font-mono text-[11.5px] text-ink">{o.t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Mini navigator */}
          <div className="flex flex-col p-2.5">
            <p className="mb-1.5 text-[9.5px] font-semibold uppercase tracking-wide text-ink-3">
              Câu hỏi
            </p>
            <div className="grid grid-cols-4 gap-1">
              {nav.map((s, i) => {
                const base =
                  "grid h-[18px] place-items-center rounded-[3px] border text-[9px] font-medium tnum";
                let cls = "border-line-strong bg-paper text-ink-3";
                if (s === "done") cls = "border-green bg-green-soft text-green";
                else if (s === "flag") cls = "border-warning bg-warning-soft text-[#9a6a06]";
                return (
                  <span
                    key={i}
                    className={`${base} ${cls}`}
                    style={
                      s === "current"
                        ? { boxShadow: `0 0 0 1.5px ${t.brand}`, borderColor: t.brand, background: t.tint, color: t.brandDark }
                        : undefined
                    }
                  >
                    {i + 1}
                  </span>
                );
              })}
            </div>
            <div
              className="mt-2.5 flex items-center justify-center gap-1 rounded-[5px] py-1.5 text-[10.5px] font-medium text-white"
              style={{ background: t.brand }}
            >
              <Send size={11} /> Nộp bài
            </div>
          </div>
        </div>
      </div>

      {/* Floating accent — recent score */}
      <div className="absolute -bottom-5 -left-5 hidden rounded-[9px] border border-line bg-paper px-3.5 py-2.5 shadow-[var(--shadow-2)] sm:block">
        <p className="text-[10.5px] text-ink-3">Điểm gần nhất · CSD201</p>
        <p className="flex items-baseline gap-1.5">
          <span className="tnum text-[20px] font-semibold text-green">8.4</span>
          <span className="rounded-[4px] bg-green px-1.5 text-[10px] font-semibold text-white">B+</span>
        </p>
      </div>

      {/* Floating accent — system badge */}
      <div className="absolute -right-3 -top-3 hidden rounded-full border border-line bg-paper px-3 py-1.5 text-[11px] font-medium text-ink-2 shadow-[var(--shadow-2)] md:block">
        <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-green align-middle" />
        Mô phỏng theo thời gian thực
      </div>
    </div>
  );
}
