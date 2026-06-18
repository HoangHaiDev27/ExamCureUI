import { type Block, THREADS, slugify } from "./forum";

/* ============================================================
   Bảng tin cộng đồng — bài đăng (post) gắn hashtag + chat chung.
   ============================================================ */

export interface FeedComment {
  id: string;
  author: string;
  date: string;
  body: string;
}

export interface Post {
  id: string;
  author: string;
  date: string;
  ts: number;
  title?: string;
  content: Block[];
  /** hashtag dạng token ascii, không kèm dấu '#'. */
  hashtags: string[];
  likes: number;
  comments: FeedComment[];
}

export interface ChatMessage {
  id: string;
  author: string;
  time: string;
  text: string;
}

/* --- ánh xạ chuyên mục / thẻ cũ sang hashtag --- */
export const CATEGORY_HASHTAG: Record<string, string> = {
  "lap-trinh": "laptrinh",
  "ngon-ngu": "ngoaingu",
  security: "security",
  "toan-hoc": "toan",
};

const TAG_HASHTAG: Record<string, string> = {
  "C#, C++": "csharp",
  Golang: "golang",
  "HTML/CSS": "htmlcss",
  Java: "java",
  Javascript: "javascript",
  Python: "python",
  Chinese: "tiengtrung",
  English: "english",
  Japanese: "tiengnhat",
  Korean: "tienghan",
  "Game Hacking": "gamehacking",
  Network: "network",
  "Unpack / Crack": "reverse",
  MAD101: "mad101",
  MAE101: "mae101",
  MAI391: "mai391",
  MAS202: "mas202",
  MAS291: "mas291",
};

function tagToken(tag: string): string {
  return TAG_HASHTAG[tag] ?? slugify(tag).replace(/-/g, "");
}

/* --- Bài đăng dựng từ dữ liệu chủ đề + vài status ngắn --- */
const fromThreads: Post[] = THREADS.map((t) => ({
  id: t.id,
  author: t.author,
  date: t.date,
  ts: t.ts,
  title: t.title,
  content: t.body,
  hashtags: Array.from(
    new Set([tagToken(t.tag), CATEGORY_HASHTAG[t.categoryId]].filter(Boolean))
  ),
  likes: Math.max(3, Math.round(t.views / 25)),
  comments: t.replies.map((r) => ({
    id: r.id,
    author: r.author,
    date: r.date,
    body: r.body,
  })),
}));

const statusPosts: Post[] = [
  {
    id: "status-git-dong-an",
    author: "hoangdz",
    date: "Hôm nay",
    ts: 112,
    content: [
      { type: "p", text: "Mẹo nhỏ cho anh em làm đồ án: dùng Git và commit từ ngày đầu tiên. Sau này gộp nhóm, sửa bug hay quay lại bản cũ đỡ khổ hơn rất nhiều." },
    ],
    hashtags: ["laptrinh"],
    likes: 41,
    comments: [
      { id: "c1", author: "ngoc99", date: "Hôm nay", body: "Chuẩn luôn, học kỳ trước mình không dùng Git suýt mất cả bài." },
    ],
  },
  {
    id: "status-nhom-on-mas291",
    author: "tuan_anh",
    date: "Hôm qua",
    ts: 108,
    content: [
      { type: "p", text: "Có ai đang ôn MAS291 cuối kỳ không? Lập một nhóm ôn chung, mỗi người phụ trách một chương rồi chia sẻ lại nhé." },
    ],
    hashtags: ["mas291", "toan"],
    likes: 18,
    comments: [],
  },
  {
    id: "status-toeic-30-ngay",
    author: "ngoc99",
    date: "2 ngày trước",
    ts: 104,
    content: [
      { type: "p", text: "Vừa hoàn thành thử thách 30 ngày học từ vựng TOEIC. Recommend mọi người thử — quan trọng là đều đặn chứ không cần học nhiều một lúc." },
    ],
    hashtags: ["english", "ngoaingu"],
    likes: 27,
    comments: [],
  },
];

export const SEED_POSTS: Post[] = [...statusPosts, ...fromThreads].sort(
  (a, b) => b.ts - a.ts
);

export function trendingTags(
  posts: Post[],
  n = 10
): { tag: string; count: number }[] {
  const m = new Map<string, number>();
  posts.forEach((p) => p.hashtags.forEach((h) => m.set(h, (m.get(h) ?? 0) + 1)));
  return [...m.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
    .slice(0, n);
}

/* --- Chat chung --- */
export const CHAT_SEED: ChatMessage[] = [
  { id: "m1", author: "lan.pham", time: "08:42", text: "Chào cả nhà, tuần này có ai thi thử PRO192 chưa?" },
  { id: "m2", author: "hoangdz", time: "08:45", text: "Mình thi rồi, giao diện y hệt phần mềm thi của trường luôn, quen tay phết." },
  { id: "m3", author: "k10n10", time: "08:51", text: "Phần đánh dấu xem lại tiện thật, lúc thi thật mình hay quên mất câu khó." },
  { id: "m4", author: "ngoc99", time: "09:03", text: "Mọi người ôn TOEIC bằng tài liệu nào vậy? Cho mình xin với." },
  { id: "m5", author: "tuan_anh", time: "09:10", text: "Có bài viết 1000 từ TOEIC 30 ngày trên bảng tin đó, ngon lắm." },
];

/* --- Lưu nội dung người dùng tạo trong phiên (sessionStorage) --- */
export const USER_POSTS_KEY = "thithu:feed:userPosts";
export const CHAT_KEY = "thithu:feed:chat";

export function readUserPosts(): Post[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(USER_POSTS_KEY);
    const arr = raw ? (JSON.parse(raw) as Post[]) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function saveUserPost(post: Post): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      USER_POSTS_KEY,
      JSON.stringify([post, ...readUserPosts()])
    );
  } catch {
    /* ignore */
  }
}

export function readUserChat(): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(CHAT_KEY);
    const arr = raw ? (JSON.parse(raw) as ChatMessage[]) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function saveUserChat(msg: ChatMessage): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      CHAT_KEY,
      JSON.stringify([...readUserChat(), msg])
    );
  } catch {
    /* ignore */
  }
}

/** Tách hashtag người dùng nhập (cách nhau bởi dấu cách hoặc phẩy). */
export function parseHashtags(input: string): string[] {
  return Array.from(
    new Set(
      input
        .split(/[\s,]+/)
        .map((t) => t.replace(/^#/, "").trim())
        .map((t) => slugify(t).replace(/-/g, ""))
        .filter(Boolean)
    )
  ).slice(0, 5);
}
