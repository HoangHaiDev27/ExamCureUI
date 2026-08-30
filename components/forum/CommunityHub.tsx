"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Hash,
  Heart,
  MessageSquare,
  Send,
  TrendingUp,
  X,
} from "lucide-react";
import {
  type ChatMessage,
  type FeedComment,
  type Post,
  parseHashtags,
  readUserPosts,
  saveUserPost,
  trendingTags,
} from "@/lib/feed";
import { STUDENT } from "@/lib/student";
import { Avatar } from "./Avatar";
import { ForumContent } from "./ForumContent";
import { ChatChannel } from "./ChatChannel";
import { useAuth } from "@/lib/auth";

export function CommunityHub({
  seedPosts,
  chatSeed,
  initialTag,
}: {
  seedPosts: Post[];
  chatSeed: ChatMessage[];
  initialTag: string | null;
}) {
  const user = useAuth();
  const schoolId = user?.schoolId || "fptu";

  // Lọc các bài post mẫu theo trường của user
  const schoolSeedPosts = useMemo(() => {
    return seedPosts.filter((p) => p.schoolId === schoolId);
  }, [seedPosts, schoolId]);

  // Lọc các tin nhắn chat mẫu theo trường của user
  const schoolChatSeed = useMemo(() => {
    return chatSeed.filter((c) => c.schoolId === schoolId);
  }, [chatSeed, schoolId]);

  const [posts, setPosts] = useState<Post[]>([]);
  const [activeTag, setActiveTag] = useState<string | null>(initialTag);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<"feed" | "chat">("feed");

  const [prevInitialTag, setPrevInitialTag] = useState(initialTag);
  if (initialTag !== prevInitialTag) {
    setPrevInitialTag(initialTag);
    setActiveTag(initialTag);
  }

  // Bài đăng do người dùng tạo trong phiên (chỉ lọc bài của trường này)
  useEffect(() => {
    const mine = readUserPosts().filter((p) => p.schoolId === schoolId);
    setTimeout(() => {
      setPosts([...mine, ...schoolSeedPosts]);
    }, 0);
  }, [schoolSeedPosts, schoolId]);

  const trending = useMemo(() => trendingTags(posts), [posts]);
  const filtered = activeTag
    ? posts.filter((p) => p.hashtags.includes(activeTag))
    : posts;

  function selectTag(tag: string | null) {
    setActiveTag(tag);
    setTab("feed");
  }

  function addPost(title: string, content: string, tagsInput: string) {
    const tags = parseHashtags(tagsInput);
    const post: Post = {
      id: `p-${Date.now().toString(36)}`,
      author: STUDENT.name,
      date: "Vừa xong",
      ts: Date.now(),
      title: title.trim() || undefined,
      content: content
        .trim()
        .split(/\n{2,}/)
        .filter(Boolean)
        .map((t) => ({ type: "p" as const, text: t.trim() })),
      schoolId: schoolId,
      hashtags: tags,
      likes: 0,
      comments: [],
    };
    saveUserPost(post);
    setPosts((prev) => [post, ...prev]);
  }

  function toggleLike(id: string) {
    setLiked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleComments(id: string) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function addComment(id: string, body: string) {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              comments: [
                ...p.comments,
                { id: `c-${Date.now().toString(36)}`, author: STUDENT.name, date: "Vừa xong", body },
              ],
            }
          : p
      )
    );
  }

  return (
    <div>
      {/* Hashtag nổi bật */}
      <TrendingBar tags={trending} active={activeTag} onSelect={selectTag} />

      {/* Tabs (mobile) */}
      <div
        role="tablist"
        aria-label="Chế độ xem cộng đồng"
        className="mt-4 flex gap-1 rounded-[8px] border border-line bg-paper p-1 lg:hidden"
      >
        <TabBtn active={tab === "feed"} onClick={() => setTab("feed")}>Bảng tin</TabBtn>
        <TabBtn active={tab === "chat"} onClick={() => setTab("chat")}>Trò chuyện</TabBtn>
      </div>

      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* FEED */}
        <div className={tab === "chat" ? "hidden lg:block" : ""}>
          <Composer onPost={addPost} />

          {activeTag && (
            <div className="mt-4 flex items-center gap-2 rounded-[8px] border border-orange-border bg-orange-soft px-3.5 py-2.5 text-[13.5px] text-orange-dark">
              <Hash size={15} />
              Đang lọc theo <b>#{activeTag}</b>
              <button
                onClick={() => setActiveTag(null)}
                className="ml-auto inline-flex items-center gap-1 rounded-[5px] px-1.5 py-0.5 text-[12.5px] font-medium hover:bg-orange-border/50"
              >
                <X size={13} /> Bỏ lọc
              </button>
            </div>
          )}

          <div className="mt-4 space-y-4">
            {filtered.length === 0 ? (
              <div className="rounded-[10px] border border-dashed border-line-strong bg-paper px-5 py-14 text-center">
                <p className="text-[15px] font-medium text-ink">Chưa có bài đăng nào</p>
                <p className="mt-1 text-[14px] text-ink-2">Hãy là người đầu tiên chia sẻ với hashtag #{activeTag}.</p>
              </div>
            ) : (
              filtered.map((p) => (
                <PostCard
                  key={p.id}
                  post={p}
                  liked={liked.has(p.id)}
                  open={open.has(p.id)}
                  onLike={() => toggleLike(p.id)}
                  onToggleComments={() => toggleComments(p.id)}
                  onSelectTag={selectTag}
                  onComment={(body) => addComment(p.id, body)}
                />
              ))
            )}
          </div>
        </div>

        {/* CHAT */}
        <div className={tab === "feed" ? "hidden lg:block" : ""}>
          <div className="lg:sticky lg:top-20">
            <ChatChannel seed={schoolChatSeed} schoolId={schoolId} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------- Trending bar */

function TrendingBar({
  tags,
  active,
  onSelect,
}: {
  tags: { tag: string; count: number }[];
  active: string | null;
  onSelect: (t: string | null) => void;
}) {
  return (
    <div className="rounded-[10px] border border-line bg-paper p-3.5 shadow-[var(--shadow-1)]">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 pr-1 text-[12.5px] font-semibold uppercase tracking-wide text-ink-3">
          <TrendingUp size={15} className="text-orange" /> Nổi bật
        </span>
        {tags.map((t) => {
          const on = active === t.tag;
          return (
            <button
              key={t.tag}
              onClick={() => onSelect(on ? null : t.tag)}
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[12.5px] font-medium transition-colors ${
                on
                  ? "border-orange bg-orange-soft text-orange-dark"
                  : "border-line bg-paper text-ink-2 hover:border-line-strong hover:bg-paper-2"
              }`}
            >
              #{t.tag}
              <span className="tnum text-[11px] text-ink-3">{t.count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ----------------------------------------------------- Composer */

function Composer({
  onPost,
}: {
  onPost: (title: string, content: string, tags: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const valid = content.trim().length >= 5;

  function submit() {
    if (!valid) return;
    onPost(title, content, tags);
    setTitle("");
    setContent("");
    setTags("");
    setExpanded(false);
  }

  return (
    <div className="rounded-[10px] border border-line bg-paper p-4 shadow-[var(--shadow-1)]">
      <div className="flex items-center gap-3">
        <Avatar name={STUDENT.name} size={40} />
        {!expanded ? (
          <button
            onClick={() => setExpanded(true)}
            className="h-11 flex-1 rounded-[8px] border border-line bg-paper-2 px-4 text-left text-[14.5px] text-ink-3 transition-colors hover:bg-paper-3"
          >
            Chia sẻ kiến thức với cộng đồng…
          </button>
        ) : (
          <span className="text-[14.5px] font-medium text-ink">Tạo bài đăng mới</span>
        )}
      </div>

      {expanded && (
        <div className="mt-3 space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Tiêu đề (không bắt buộc)"
            className="h-11 w-full rounded-[7px] border border-line bg-paper px-3.5 text-[15px] font-medium outline-none transition-colors placeholder:font-normal placeholder:text-ink-3 focus:border-orange"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            autoFocus
            placeholder="Bạn muốn chia sẻ điều gì?"
            className="w-full resize-y rounded-[7px] border border-line bg-paper p-3.5 text-[15px] leading-relaxed outline-none transition-colors placeholder:text-ink-3 focus:border-orange"
          />
          <div className="relative">
            <Hash size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Hashtag, cách nhau bởi dấu cách (vd: java oop)"
              className="h-11 w-full rounded-[7px] border border-line bg-paper pl-9 pr-3.5 text-[14px] outline-none transition-colors placeholder:text-ink-3 focus:border-orange"
            />
          </div>
          <div className="flex justify-end gap-2.5">
            <button
              onClick={() => setExpanded(false)}
              className="h-10 rounded-[7px] border border-line-strong bg-paper px-4 text-[14px] font-medium text-ink transition-colors hover:bg-paper-3"
            >
              Hủy
            </button>
            <button
              onClick={submit}
              disabled={!valid}
              className="inline-flex h-10 items-center gap-1.5 rounded-[7px] bg-orange px-4 text-[14px] font-medium text-white transition-colors hover:bg-orange-dark disabled:opacity-45"
            >
              <Send size={15} /> Đăng bài
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ----------------------------------------------------- Post card */

function PostCard({
  post,
  liked,
  open,
  onLike,
  onToggleComments,
  onSelectTag,
  onComment,
}: {
  post: Post;
  liked: boolean;
  open: boolean;
  onLike: () => void;
  onToggleComments: () => void;
  onSelectTag: (t: string) => void;
  onComment: (body: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const likeCount = post.likes + (liked ? 1 : 0);

  return (
    <article className="rounded-[12px] border border-line bg-paper p-5 shadow-[var(--shadow-1)]">
      {/* Header */}
      <header className="flex items-center gap-3">
        <Avatar name={post.author} size={42} />
        <div className="min-w-0">
          <p className="text-[14.5px] font-semibold text-ink">{post.author}</p>
          <p className="text-[12.5px] text-ink-3">{post.date}</p>
        </div>
      </header>

      {/* Body */}
      {post.title && (
        <h3 className="mt-3.5 text-[18px] font-semibold leading-snug text-ink">{post.title}</h3>
      )}
      <div className="mt-2">
        <ForumContent blocks={post.content} />
      </div>

      {/* Hashtags */}
      {post.hashtags.length > 0 && (
        <div className="mt-3.5 flex flex-wrap gap-1.5">
          {post.hashtags.map((h) => (
            <button
              key={h}
              onClick={() => onSelectTag(h)}
              className="rounded-full bg-blue-soft px-2.5 py-0.5 text-[12.5px] font-medium text-blue-dark transition-colors hover:brightness-95"
            >
              #{h}
            </button>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex items-center gap-1 border-t border-line pt-3">
        <button
          onClick={onLike}
          className={`inline-flex items-center gap-1.5 rounded-[7px] px-3 py-1.5 text-[13.5px] font-medium transition-colors ${
            liked ? "text-orange" : "text-ink-2 hover:bg-paper-2"
          }`}
        >
          <Heart size={16} fill={liked ? "currentColor" : "none"} />
          <span className="tnum">{likeCount}</span> Thích
        </button>
        <button
          onClick={onToggleComments}
          className={`inline-flex items-center gap-1.5 rounded-[7px] px-3 py-1.5 text-[13.5px] font-medium transition-colors ${
            open ? "bg-paper-2 text-ink" : "text-ink-2 hover:bg-paper-2"
          }`}
        >
          <MessageSquare size={16} />
          <span className="tnum">{post.comments.length}</span> Bình luận
        </button>
      </div>

      {/* Comments */}
      {open && (
        <div className="mt-3 space-y-3 border-t border-line pt-3">
          {post.comments.map((c: FeedComment) => (
            <div key={c.id} className="flex gap-2.5">
              <Avatar name={c.author} size={32} />
              <div className="min-w-0 flex-1 rounded-[8px] bg-paper-2 px-3 py-2">
                <p className="flex items-center gap-2 text-[12.5px]">
                  <span className="font-medium text-ink">{c.author}</span>
                  <span className="text-ink-3">{c.date}</span>
                </p>
                <p className="mt-0.5 text-[14px] leading-relaxed text-ink-2">{c.body}</p>
              </div>
            </div>
          ))}

          <div className="flex gap-2.5">
            <Avatar name={STUDENT.name} size={32} />
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && draft.trim()) {
                    onComment(draft.trim());
                    setDraft("");
                  }
                }}
                placeholder="Viết bình luận…"
                className="h-10 min-w-0 flex-1 rounded-[7px] border border-line bg-paper px-3.5 text-[14px] outline-none transition-colors placeholder:text-ink-3 focus:border-orange"
              />
              <button
                onClick={() => {
                  if (draft.trim()) {
                    onComment(draft.trim());
                    setDraft("");
                  }
                }}
                disabled={!draft.trim()}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-[7px] bg-ink text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                aria-label="Gửi bình luận"
              >
                <Send size={15} />
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

function TabBtn({
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
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`h-10 flex-1 rounded-[6px] text-[14px] font-medium transition-colors ${
        active ? "bg-orange-soft text-orange-dark" : "text-ink-2 hover:bg-paper-2"
      }`}
    >
      {children}
    </button>
  );
}
