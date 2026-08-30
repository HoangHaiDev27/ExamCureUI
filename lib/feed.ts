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
  schoolId?: string;
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
  schoolId?: string;
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
function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/* --- Bài đăng dựng từ dữ liệu chủ đề + vài status ngắn --- */
const fromThreads: Post[] = THREADS.map((t) => {
  let schoolId = "fptu";
  const tagLower = t.tag.toLowerCase();
  if (tagLower.includes("mae101") || tagLower.includes("mae")) schoolId = "hust";
  else if (tagLower.includes("eco")) schoolId = "neu";
  else if (tagLower.includes("mas291")) schoolId = "fptu";
  else {
    const h = hash(t.id);
    const schools = ["fptu", "hust", "neu", "hcmut"];
    schoolId = schools[h % schools.length];
  }

  return {
    id: t.id,
    author: t.author,
    date: t.date,
    ts: t.ts,
    title: t.title,
    content: t.body,
    schoolId,
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
  };
});

const statusPosts: Post[] = [
  {
    id: "status-git-dong-an",
    author: "hoangdz",
    date: "Hôm nay",
    ts: 112,
    schoolId: "fptu",
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
    schoolId: "fptu",
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
    schoolId: "fptu",
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
  { id: "m1", author: "lan.pham", time: "08:42", text: "Chào cả nhà, tuần này có ai thi thử PRO192 chưa?", schoolId: "fptu" },
  { id: "m2", author: "hoangdz", time: "08:45", text: "Mình thi rồi, giao diện y hệt phần mềm thi của trường luôn, quen tay phết.", schoolId: "fptu" },
  { id: "m3", author: "k10n10", time: "08:51", text: "Phần đánh dấu xem lại tiện thật, lúc thi thật mình hay quên mất câu khó.", schoolId: "fptu" },
  { id: "m4", author: "ngoc99", time: "09:03", text: "Mọi người ôn TOEIC bằng tài liệu nào vậy? Cho mình xin với.", schoolId: "fptu" },
  { id: "m5", author: "tuan_anh", time: "09:10", text: "Có bài viết 1000 từ TOEIC 30 ngày trên bảng tin đó, ngon lắm.", schoolId: "fptu" },
  { id: "m_hust1", author: "bk_student", time: "09:20", text: "Bên Bách Khoa có ai làm xong đề thi Giải tích 1 chưa?", schoolId: "hust" },
  { id: "m_hust2", author: "hust_cuber", time: "09:25", text: "Đề Giải tích 1 năm nay khoai quá, Moodle load hơi chậm.", schoolId: "hust" },
  { id: "m_neu1", author: "neu_girl", time: "09:30", text: "Kinh tế vi mô thầy nào chấm dễ thở nhất mọi người ơi?", schoolId: "neu" },
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
