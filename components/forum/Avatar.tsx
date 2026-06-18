import { authorColor, initial } from "@/lib/forum";

/** Avatar monogram màu mềm theo tên tác giả. */
export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const c = authorColor(name);
  return (
    <span
      className="grid shrink-0 place-items-center rounded-[8px] font-semibold"
      style={{
        width: size,
        height: size,
        background: c.bg,
        color: c.fg,
        fontSize: Math.round(size * 0.42),
      }}
      aria-hidden
    >
      {initial(name)}
    </span>
  );
}
