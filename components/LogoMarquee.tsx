import { SCHOOLS } from "@/lib/schools";
import { SchoolMark } from "./SchoolMark";

/**
 * Dải logo trường nằm ngang, trượt liên tục (trái → phải), màu thương hiệu đầy đủ.
 * Lặp danh sách nhiều lần để một "nửa" luôn rộng hơn màn hình (kể cả màn rộng),
 * nhờ vậy vòng lặp không bị hở. Tạm dừng khi hover, tắt khi reduced-motion.
 */
export function LogoMarquee() {
  // 2× để một nửa track rộng hơn cả màn hình lớn; ×2 nữa để lặp vô tận.
  const half = [...SCHOOLS, ...SCHOOLS];
  const loop = [...half, ...half];

  return (
    <div className="marquee">
      <div className="marquee__track" aria-hidden>
        {loop.map((s, i) => (
          <div key={i} className="flex shrink-0 items-center gap-3 px-8">
            <SchoolMark theme={s.theme} abbr={s.abbr} size={48} />
            <span className="whitespace-nowrap text-[15px] font-semibold leading-tight text-ink">
              {s.abbr}
            </span>
          </div>
        ))}
      </div>
      <span className="sr-only">
        Mô phỏng phần mềm thi của: {SCHOOLS.map((s) => s.name).join(", ")}.
      </span>
    </div>
  );
}
