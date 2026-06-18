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
  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/Logo.svg"
      alt="ExamCure"
      style={{ height: size, width: "auto" }}
      className={`block max-w-none select-none${
        mono ? " [filter:brightness(0)_invert(1)]" : ""
      }`}
    />
  );

  if (href === null) return img;
  return (
    <Link
      href={href}
      aria-label="ExamCure — trang chủ"
      className="inline-flex items-center"
    >
      {img}
    </Link>
  );
}
