import type { Block } from "@/lib/forum";

/** Render nội dung bài viết diễn đàn từ các block. */
export function ForumContent({ blocks }: { blocks: Block[] }) {
  return (
    <div className="space-y-4">
      {blocks.map((b, i) => {
        switch (b.type) {
          case "h":
            return (
              <h4 key={i} className="pt-1 text-[17px] font-semibold text-ink">
                {b.text}
              </h4>
            );
          case "code":
            return (
              <pre
                key={i}
                className="overflow-x-auto rounded-[7px] border border-line bg-[#1a1d21] p-4 font-mono text-[13.5px] leading-relaxed text-[#e6e8eb]"
              >
                <code>{b.text}</code>
              </pre>
            );
          case "ul":
            return (
              <ul key={i} className="space-y-1.5 pl-1">
                {b.items.map((it, j) => (
                  <li key={j} className="flex gap-2.5 text-[15.5px] leading-relaxed text-ink">
                    <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange" />
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            );
          default:
            return (
              <p key={i} className="text-[15.5px] leading-[1.75] text-ink-2">
                {b.text}
              </p>
            );
        }
      })}
    </div>
  );
}
