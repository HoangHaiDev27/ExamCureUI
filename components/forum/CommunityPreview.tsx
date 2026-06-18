import Link from "next/link";
import { ArrowRight, Heart, MessageSquare, TrendingUp } from "lucide-react";
import { SEED_POSTS, CHAT_SEED, trendingTags, type Post } from "@/lib/feed";
import { Avatar } from "./Avatar";

function firstText(post: Post): string {
  const p = post.content.find((b) => b.type === "p");
  return p && p.type === "p" ? p.text : "";
}

export function CommunityPreview() {
  const recent = SEED_POSTS.slice(0, 3);
  const trending = trendingTags(SEED_POSTS, 8);
  const chat = CHAT_SEED.slice(-3);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      {/* Bài đăng mới nhất */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-[14px] font-semibold uppercase tracking-wide text-ink-2">
            Bài đăng mới nhất
          </h3>
          <Link href="/dien-dan" className="inline-flex items-center gap-1 text-[13px] font-medium text-orange hover:text-orange-dark">
            Vào cộng đồng <ArrowRight size={15} />
          </Link>
        </div>

        <div className="space-y-3">
          {recent.map((p) => (
            <Link
              key={p.id}
              href="/dien-dan"
              className="group block rounded-[10px] border border-line bg-paper p-4 shadow-[var(--shadow-1)] transition-colors hover:border-line-strong hover:bg-paper-2"
            >
              <div className="flex items-center gap-2.5">
                <Avatar name={p.author} size={34} />
                <div className="min-w-0">
                  <p className="text-[13.5px] font-semibold text-ink">{p.author}</p>
                  <p className="text-[12px] text-ink-3">{p.date}</p>
                </div>
              </div>

              {p.title ? (
                <h4 className="mt-2.5 line-clamp-1 text-[15px] font-semibold text-ink transition-colors group-hover:text-orange">
                  {p.title}
                </h4>
              ) : null}
              <p className="mt-1 line-clamp-2 text-[13.5px] leading-relaxed text-ink-2">
                {firstText(p)}
              </p>

              <div className="mt-2.5 flex items-center gap-2">
                <div className="flex flex-wrap gap-1.5">
                  {p.hashtags.slice(0, 3).map((h) => (
                    <span key={h} className="rounded-full bg-blue-soft px-2 py-0.5 text-[11.5px] font-medium text-blue-dark">
                      #{h}
                    </span>
                  ))}
                </div>
                <span className="ml-auto flex items-center gap-3 text-[12px] text-ink-3">
                  <span className="inline-flex items-center gap-1"><Heart size={13} /> {p.likes}</span>
                  <span className="inline-flex items-center gap-1"><MessageSquare size={13} /> {p.comments.length}</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Rail: hashtag + chat teaser */}
      <aside className="space-y-4">
        <div className="rounded-[10px] border border-line bg-paper p-4 shadow-[var(--shadow-1)]">
          <h3 className="flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-wide text-ink-2">
            <TrendingUp size={15} className="text-orange" /> Hashtag nổi bật
          </h3>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {trending.map((t) => (
              <Link
                key={t.tag}
                href={`/dien-dan?tag=${t.tag}`}
                className="inline-flex items-center gap-1 rounded-full border border-line bg-paper px-2.5 py-1 text-[12.5px] font-medium text-ink-2 transition-colors hover:border-line-strong hover:bg-paper-2"
              >
                #{t.tag}
                <span className="tnum text-[11px] text-ink-3">{t.count}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-[10px] border border-line bg-paper shadow-[var(--shadow-1)]">
          <div className="flex items-center gap-2 border-b border-line px-4 py-3">
            <span className="inline-block h-2 w-2 rounded-full bg-green" />
            <h3 className="text-[13.5px] font-semibold text-ink">Trò chuyện chung</h3>
            <span className="ml-auto text-[12px] text-ink-3">32 online</span>
          </div>
          <div className="space-y-2.5 px-4 py-3">
            {chat.map((m) => (
              <div key={m.id} className="flex items-start gap-2">
                <Avatar name={m.author} size={26} />
                <p className="min-w-0 text-[12.5px] leading-snug text-ink-2">
                  <span className="font-medium text-ink">{m.author}</span>{" "}
                  <span className="line-clamp-1 align-top">{m.text}</span>
                </p>
              </div>
            ))}
          </div>
          <Link
            href="/dien-dan"
            className="flex items-center justify-center gap-1.5 border-t border-line bg-paper-2 py-2.5 text-[13px] font-medium text-orange transition-colors hover:bg-paper-3"
          >
            Tham gia trò chuyện <ArrowRight size={15} />
          </Link>
        </div>
      </aside>
    </div>
  );
}
