import type { ExamTheme } from "@/lib/types";

const SHAPES: Record<ExamTheme["mark"], string> = {
  square: "8px",
  circle: "999px",
  shield: "",
  hex: "",
};

const CLIP: Partial<Record<ExamTheme["mark"], string>> = {
  shield:
    "polygon(50% 0%, 100% 16%, 100% 60%, 50% 100%, 0% 60%, 0% 16%)",
  hex: "polygon(25% 2%, 75% 2%, 100% 50%, 75% 98%, 25% 98%, 0% 50%)",
};

/**
 * Monogram nhận diện trường — không dùng ảnh AI, render thuần CSS.
 * Lấy chữ viết tắt + màu thương hiệu, biến đổi hình theo `mark`.
 */
export function SchoolMark({
  theme,
  abbr,
  size = 44,
}: {
  theme: ExamTheme;
  abbr: string;
  size?: number;
}) {
  const letters = abbr.length > 4 ? abbr.slice(0, 4) : abbr;
  const fontSize = Math.round(size * (letters.length > 3 ? 0.3 : 0.36));

  return (
    <span
      aria-hidden
      className="inline-grid place-items-center font-semibold shrink-0 tracking-tight select-none"
      style={{
        width: size,
        height: size,
        background: theme.brand,
        color: theme.onBrand,
        fontSize,
        lineHeight: 1,
        borderRadius: SHAPES[theme.mark] || undefined,
        clipPath: CLIP[theme.mark],
        boxShadow:
          theme.mark === "square" || theme.mark === "circle"
            ? "inset 0 0 0 1px rgba(255,255,255,0.14)"
            : undefined,
      }}
    >
      {letters}
    </span>
  );
}
