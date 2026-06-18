import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { CommunityHub } from "@/components/forum/CommunityHub";
import { SEED_POSTS, CHAT_SEED } from "@/lib/feed";

export const metadata = {
  title: "Cộng đồng — Bảng tin & Trò chuyện | ExamCure",
};

export default async function ForumPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string | string[] }>;
}) {
  const sp = await searchParams;
  const initialTag = typeof sp.tag === "string" ? sp.tag : null;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-[1180px] px-5 pb-20 lg:px-8">
        <nav className="flex items-center gap-1.5 py-5 text-[13px] text-ink-3">
          <Link href="/" className="hover:text-ink">Trang chủ</Link>
          <ChevronRight size={14} />
          <span className="font-medium text-ink-2">Cộng đồng</span>
        </nav>

        <div className="max-w-2xl">
          <p className="text-[13px] font-semibold uppercase tracking-wide text-orange">Cộng đồng</p>
          <h1 className="mt-2 font-display text-[32px] font-semibold leading-tight text-ink sm:text-[40px]">
            Bảng tin &amp; trò chuyện
          </h1>
          <p className="mt-2 text-[16px] leading-relaxed text-ink-2">
            Đăng bài chia sẻ kiến thức kèm hashtag, hoặc trao đổi trực tiếp với
            cộng đồng tại kênh trò chuyện chung.
          </p>
        </div>

        <div className="mt-7">
          <CommunityHub seedPosts={SEED_POSTS} chatSeed={CHAT_SEED} initialTag={initialTag} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
