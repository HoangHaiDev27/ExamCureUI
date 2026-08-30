import Link from "next/link";

/**
 * Logo nền tảng — dùng file public/Logo.svg.
 * `mono` (vd. trên footer nền màu) chuyển logo sang trắng bằng filter.
 */
export function Logo({
  size = 32,
  href = "/",
  mono = false,
}: {
  size?: number;
  href?: string | null;
  mono?: boolean;
}) {
  let textClass = "text-[23px]";
  if (size >= 80) {
    textClass = "text-[30px]";
  } else if (size >= 28) {
    textClass = "text-[26px]";
  } else if (size >= 24) {
    textClass = "text-[21.5px]";
  }

  const logoText = (
    <span className={`inline-flex items-baseline tracking-tight select-none ${textClass} transition-colors`}>
      <span className={mono ? "font-sans font-semibold text-white" : "font-sans font-semibold text-slate-800"}>
        Exam
      </span>
      <span className={`font-display font-bold italic ml-0.5 ${
        mono ? "text-white/90" : "text-orange"
      }`}>
        Cure
      </span>
    </span>
  );

  if (href === null) return logoText;
  return (
    <Link
      href={href}
      aria-label="ExamCure — trang chủ"
      className="inline-flex items-center"
    >
      {logoText}
    </Link>
  );
}
