import { KNOWLEDGE, type KnowledgeCategory } from "./knowledge";

/* ============================================================
   Diễn đàn "Chia sẻ kiến thức" — dữ liệu chủ đề & phản hồi.
   ============================================================ */

export type Block =
  | { type: "p"; text: string }
  | { type: "h"; text: string }
  | { type: "code"; text: string }
  | { type: "ul"; items: string[] };

export interface Reply {
  id: string;
  author: string;
  date: string;
  body: string;
}

export interface Thread {
  id: string;
  categoryId: string;
  tag: string;
  title: string;
  author: string;
  date: string;
  /** số càng lớn càng mới — dùng để sắp xếp, tránh dùng Date. */
  ts: number;
  views: number;
  pinned?: boolean;
  excerpt: string;
  body: Block[];
  replies: Reply[];
}

/* --- Avatar màu mềm theo tên tác giả (đồng bộ palette hệ thống) --- */
const AVATAR_PALETTE = [
  { bg: "#e8f4fb", fg: "#1d8dc9" },
  { bg: "#e4f6ec", fg: "#00a650" },
  { bg: "#fef3df", fg: "#c98a06" },
  { bg: "#fff1e8", fg: "#d85f18" },
  { bg: "#fdeaea", fg: "#e5484d" },
  { bg: "#eef0f4", fg: "#5b6470" },
];

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function authorColor(name: string) {
  return AVATAR_PALETTE[hash(name) % AVATAR_PALETTE.length];
}

export function initial(name: string): string {
  return name.replace(/[^a-zA-ZÀ-ỹ]/g, "").charAt(0).toUpperCase() || "?";
}

/* --- Phản hồi mẫu dùng lại --- */
function reply(id: string, author: string, date: string, body: string): Reply {
  return { id, author, date, body };
}

/* ============================================================
   Chủ đề
   ============================================================ */

export const THREADS: Thread[] = [
  // ----------------------------- Lập trình -----------------------------
  {
    id: "khoa-hoc-csharp-mien-phi",
    categoryId: "lap-trinh",
    tag: "C#, C++",
    title: "Toàn bộ khóa học C# Miễn phí mà bạn nên xem qua",
    author: "Minthep",
    date: "14/11/25",
    ts: 100,
    views: 1240,
    pinned: true,
    excerpt:
      "Tổng hợp các khóa học C# chất lượng, hoàn toàn miễn phí — phù hợp cho sinh viên FPT đang học PRO192 / PRF192.",
    body: [
      { type: "p", text: "Mình gom lại các nguồn học C# tốt nhất, miễn phí và đi từ cơ bản đến nâng cao. Phù hợp cho ai đang học PRF192, PRO192 hoặc muốn ôn lại trước kỳ thi." },
      { type: "h", text: "Lộ trình gợi ý" },
      { type: "ul", items: [
        "Nền tảng: cú pháp, biến, kiểu dữ liệu, vòng lặp, mảng.",
        "Hướng đối tượng: class, kế thừa, đa hình, interface.",
        "Nâng cao: LINQ, generics, async/await, xử lý ngoại lệ.",
      ] },
      { type: "p", text: "Một ví dụ nhỏ về LINQ mà mình hay dùng để lọc danh sách:" },
      { type: "code", text: "var passed = students\n    .Where(s => s.Score >= 5)\n    .OrderByDescending(s => s.Score)\n    .ToList();" },
      { type: "p", text: "Sau mỗi phần nên làm bài tập nhỏ và tự code lại, đừng chỉ xem video. Chúc mọi người học tốt!" },
    ],
    replies: [
      reply("r1", "hoangdz", "14/11/25", "Cảm ơn bạn, đúng cái mình đang cần để ôn PRO192."),
      reply("r2", "ngoc99", "15/11/25", "Phần async/await có khóa nào dễ hiểu không bạn? Mình hơi mông lung chỗ này."),
      reply("r3", "Minthep", "15/11/25", "Bạn cứ nắm chắc Task trước, async/await chỉ là cú pháp gọn hơn thôi. Mình sẽ viết riêng một bài."),
    ],
  },
  {
    id: "roadmap-java-backend",
    categoryId: "lap-trinh",
    tag: "Java",
    title: "Roadmap học Java back-end 2025 cho sinh viên FPT",
    author: "hoangdz",
    date: "10/11/25",
    ts: 95,
    views: 880,
    excerpt: "Đi từ Core Java đến Spring Boot, kèm dự án thực hành để bỏ túi trước khi đi thực tập OJT.",
    body: [
      { type: "p", text: "Nếu bạn định theo hướng back-end, đây là lộ trình mình đã đi và thấy hiệu quả." },
      { type: "ul", items: [
        "Core Java: OOP, Collections, Exception, Stream API.",
        "JDBC & SQL cơ bản, hiểu cách app nói chuyện với database.",
        "Spring Boot: REST API, Dependency Injection, JPA/Hibernate.",
        "Làm 1–2 dự án nhỏ: quản lý sinh viên, blog API.",
      ] },
      { type: "p", text: "Quan trọng nhất là làm dự án thật, đừng học lý thuyết suông." },
    ],
    replies: [reply("r1", "tuan_anh", "11/11/25", "Spring Boot lúc đầu hơi nản nhưng quen rồi thì nhanh lắm. Ủng hộ roadmap này.")],
  },
  {
    id: "toi-uu-dom-javascript",
    categoryId: "lap-trinh",
    tag: "Javascript",
    title: "Mẹo tối ưu thao tác DOM khi học Javascript",
    author: "lan.pham",
    date: "02/11/25",
    ts: 88,
    views: 540,
    excerpt: "Vài kỹ thuật nhỏ giúp trang web mượt hơn: gom thao tác DOM, dùng DocumentFragment, tránh reflow.",
    body: [
      { type: "p", text: "Thao tác DOM nhiều lần liên tục là nguyên nhân phổ biến khiến trang giật. Một mẹo đơn giản là gom các thay đổi rồi chèn một lần." },
      { type: "code", text: "const frag = document.createDocumentFragment();\nitems.forEach(t => {\n  const li = document.createElement('li');\n  li.textContent = t;\n  frag.appendChild(li);\n});\nlist.appendChild(frag);" },
      { type: "p", text: "Cách này chỉ gây một lần reflow thay vì nhiều lần, rất hữu ích khi render danh sách dài." },
    ],
    replies: [],
  },
  {
    id: "golang-vs-nodejs",
    categoryId: "lap-trinh",
    tag: "Golang",
    title: "So sánh Golang và Node.js cho người mới bắt đầu",
    author: "tuan_anh",
    date: "28/10/25",
    ts: 80,
    views: 690,
    excerpt: "Nên chọn ngôn ngữ nào cho dự án đầu tiên? Cùng phân tích ưu nhược điểm một cách ngắn gọn.",
    body: [
      { type: "p", text: "Cả hai đều mạnh cho back-end. Golang nhanh, biên dịch ra binary, hợp với hệ thống hiệu năng cao. Node.js dễ bắt đầu, hệ sinh thái npm khổng lồ." },
      { type: "p", text: "Lời khuyên: nếu bạn đã quen Javascript thì học Node.js trước, còn muốn tìm hiểu về concurrency thì Golang rất đáng học." },
    ],
    replies: [],
  },
  {
    id: "bo-cuc-html-css-portfolio",
    categoryId: "lap-trinh",
    tag: "HTML/CSS",
    title: "Bố cục HTML/CSS chuẩn cho trang portfolio cá nhân",
    author: "ngoc99",
    date: "20/10/25",
    ts: 72,
    views: 410,
    excerpt: "Cấu trúc semantic, dùng Flexbox/Grid hợp lý và responsive cho trang giới thiệu bản thân.",
    body: [
      { type: "p", text: "Một trang portfolio gọn gàng giúp ích rất nhiều khi xin thực tập. Hãy ưu tiên thẻ semantic và bố cục rõ ràng." },
      { type: "ul", items: [
        "Dùng header / main / section / footer thay cho div tràn lan.",
        "Flexbox cho thanh điều hướng, Grid cho lưới dự án.",
        "Luôn kiểm tra trên màn hình điện thoại.",
      ] },
    ],
    replies: [],
  },

  // ----------------------------- Ngôn ngữ -----------------------------
  {
    id: "toeic-30-days-1000-tu",
    categoryId: "ngon-ngu",
    tag: "English",
    title: "Từ vựng TOEIC 30 days - 1000 từ thông dụng nhất",
    author: "Minthep",
    date: "22/8/25",
    ts: 99,
    views: 2100,
    pinned: true,
    excerpt: "Kế hoạch học 1000 từ vựng TOEIC trong 30 ngày, chia nhỏ mỗi ngày kèm cách ôn lại hiệu quả.",
    body: [
      { type: "p", text: "Mục tiêu là 1000 từ trong 30 ngày, tức khoảng 33 từ mỗi ngày. Nghe nhiều nhưng nếu học đúng cách thì hoàn toàn khả thi." },
      { type: "h", text: "Cách học" },
      { type: "ul", items: [
        "Mỗi ngày học 1 cụm chủ đề (văn phòng, hợp đồng, du lịch…).",
        "Học từ trong câu ví dụ, không học từ đơn lẻ.",
        "Ôn lại theo nguyên tắc lặp lại ngắt quãng: ngày 1, 3, 7.",
      ] },
      { type: "p", text: "Cuối mỗi tuần làm một đề mini để kiểm tra. Kiên trì 30 ngày bạn sẽ thấy khác biệt rõ rệt." },
    ],
    replies: [
      reply("r1", "lan.pham", "23/8/25", "Mình áp dụng lặp lại ngắt quãng thấy nhớ lâu hơn hẳn. Cảm ơn bạn!"),
      reply("r2", "ngoc99", "24/8/25", "Có file Anki không bạn ơi? Học trên app cho tiện."),
    ],
  },
  {
    id: "tu-hoc-tieng-nhat-n5-n3",
    categoryId: "ngon-ngu",
    tag: "Japanese",
    title: "Lộ trình tự học tiếng Nhật từ N5 lên N3",
    author: "hoangdz",
    date: "18/8/25",
    ts: 90,
    views: 760,
    excerpt: "Chia giai đoạn rõ ràng: bảng chữ cái, ngữ pháp nền, Kanji và luyện nghe.",
    body: [
      { type: "p", text: "Tự học tiếng Nhật cần kỷ luật. Mình chia thành các mốc nhỏ để không bị nản." },
      { type: "ul", items: [
        "N5: thuộc Hiragana, Katakana, ngữ pháp cơ bản.",
        "N4: mở rộng Kanji, luyện nghe hội thoại ngắn.",
        "N3: đọc hiểu đoạn dài, ngữ pháp trung cấp.",
      ] },
    ],
    replies: [],
  },
  {
    id: "luyen-phat-am-tieng-anh",
    categoryId: "ngon-ngu",
    tag: "English",
    title: "Cách luyện phát âm tiếng Anh mỗi ngày 15 phút",
    author: "lan.pham",
    date: "10/8/25",
    ts: 84,
    views: 520,
    excerpt: "Phương pháp shadowing đơn giản giúp cải thiện phát âm và phản xạ nói.",
    body: [
      { type: "p", text: "Shadowing là nghe và nói nhại lại ngay theo người bản xứ. Chỉ 15 phút mỗi ngày nhưng đều đặn sẽ rất hiệu quả." },
      { type: "p", text: "Chọn đoạn hội thoại ngắn, nghe → nhại → so sánh. Ghi âm lại giọng mình để tự sửa." },
    ],
    replies: [],
  },
  {
    id: "bang-chu-hangul-co-ban",
    categoryId: "ngon-ngu",
    tag: "Korean",
    title: "Bảng chữ Hangul cơ bản cho người mới",
    author: "ngoc99",
    date: "02/8/25",
    ts: 78,
    views: 380,
    excerpt: "Hangul không khó như bạn nghĩ — nắm quy tắc ghép phụ âm + nguyên âm là đọc được.",
    body: [
      { type: "p", text: "Tiếng Hàn dùng bảng chữ Hangul rất logic. Mỗi khối chữ là tổ hợp phụ âm và nguyên âm." },
      { type: "p", text: "Học thuộc 14 phụ âm và 10 nguyên âm cơ bản, sau đó luyện ghép là bạn đã đọc được hầu hết." },
    ],
    replies: [],
  },

  // ----------------------------- Security -----------------------------
  {
    id: "cheat-engine-tim-dia-chi",
    categoryId: "security",
    tag: "Game Hacking",
    title: "Cách dùng Cheat Engine tìm địa chỉ giá trị",
    author: "k10n10",
    date: "22/5/26",
    ts: 100,
    views: 1500,
    pinned: true,
    excerpt: "Hướng dẫn nhập môn: scan giá trị, lọc kết quả và khóa địa chỉ — chỉ dùng cho mục đích học tập.",
    body: [
      { type: "p", text: "Bài này dùng cho mục đích học tập về bộ nhớ và reverse engineering trên ứng dụng/máy ảo của chính bạn. Không áp dụng cho game online hay phần mềm của người khác." },
      { type: "h", text: "Các bước cơ bản" },
      { type: "ul", items: [
        "Mở tiến trình mục tiêu trong Cheat Engine.",
        "First Scan với giá trị hiện tại (ví dụ máu = 100).",
        "Cho giá trị thay đổi rồi Next Scan để lọc dần.",
        "Khi còn vài địa chỉ, thêm vào bảng và khóa giá trị.",
      ] },
      { type: "p", text: "Hiểu được cách giá trị nằm trong RAM sẽ giúp bạn học tốt phần con trỏ và cấu trúc dữ liệu." },
    ],
    replies: [
      reply("r1", "tuan_anh", "22/5/26", "Lưu ý mọi người chỉ thực hành trên máy/ứng dụng của mình thôi nhé."),
      reply("r2", "hoangdz", "23/5/26", "Phần pointer scan có thể viết thêm một bài không bạn? Mình hay bị mất địa chỉ sau khi khởi động lại."),
    ],
  },
  {
    id: "wireshark-co-ban",
    categoryId: "security",
    tag: "Network",
    title: "Phân tích gói tin với Wireshark cơ bản",
    author: "tuan_anh",
    date: "15/5/26",
    ts: 92,
    views: 640,
    excerpt: "Bắt gói, lọc theo giao thức và đọc hiểu một phiên TCP bắt tay 3 bước.",
    body: [
      { type: "p", text: "Wireshark là công cụ tuyệt vời để hiểu mạng hoạt động thế nào. Bắt đầu bằng việc lọc theo giao thức." },
      { type: "code", text: "tcp.port == 80 && ip.addr == 192.168.1.10" },
      { type: "p", text: "Hãy thử quan sát quá trình bắt tay 3 bước SYN → SYN/ACK → ACK để hiểu cách TCP thiết lập kết nối." },
    ],
    replies: [],
  },
  {
    id: "nhap-mon-reverse-x64dbg",
    categoryId: "security",
    tag: "Unpack / Crack",
    title: "Nhập môn reverse engineering với x64dbg",
    author: "k10n10",
    date: "08/5/26",
    ts: 85,
    views: 720,
    excerpt: "Làm quen giao diện x64dbg, đặt breakpoint và đọc thanh ghi — phục vụ nghiên cứu phần mềm của bạn.",
    body: [
      { type: "p", text: "x64dbg là debugger mã nguồn mở phổ biến. Bài này giới thiệu cách đặt breakpoint và theo dõi luồng thực thi." },
      { type: "p", text: "Chỉ thực hành trên phần mềm bạn có quyền phân tích. Mục tiêu là học cách chương trình hoạt động ở mức assembly." },
    ],
    replies: [],
  },

  // ----------------------------- Toán học -----------------------------
  {
    id: "cong-thuc-fe-mas291",
    categoryId: "toan-hoc",
    tag: "MAS291",
    title: "Công thức FE MAS291 — Xác suất thống kê",
    author: "Minthep",
    date: "11/4/25",
    ts: 98,
    views: 980,
    pinned: true,
    excerpt: "Tổng hợp công thức trọng tâm cho kỳ thi cuối kỳ MAS291: kỳ vọng, phương sai, phân phối.",
    body: [
      { type: "p", text: "Mình tổng hợp các công thức hay ra trong đề FE của MAS291. Học thuộc và hiểu bản chất sẽ làm bài nhanh hơn." },
      { type: "h", text: "Một số công thức trọng tâm" },
      { type: "ul", items: [
        "Kỳ vọng: E[X] = Σ xᵢ · P(xᵢ)",
        "Phương sai: Var(X) = E[X²] − (E[X])²",
        "Tổ hợp: C(n,k) = n! / (k!·(n−k)!)",
      ] },
      { type: "p", text: "Lưu ý phân biệt rõ phân phối nhị thức và phân phối chuẩn, đề hay đánh lừa ở chỗ này." },
    ],
    replies: [
      reply("r1", "lan.pham", "12/4/25", "Cứu tinh mùa thi đây rồi, cảm ơn bạn nhiều!"),
      reply("r2", "ngoc99", "12/4/25", "Bổ sung thêm phần kiểm định giả thuyết nữa thì trọn bộ luôn."),
    ],
  },
  {
    id: "tong-hop-de-mad101",
    categoryId: "toan-hoc",
    tag: "MAD101",
    title: "Tổng hợp đề MAD101 có lời giải",
    author: "hoangdz",
    date: "05/4/25",
    ts: 90,
    views: 870,
    excerpt: "Bộ đề toán rời rạc MAD101 kèm hướng dẫn giải chi tiết theo từng chương.",
    body: [
      { type: "p", text: "MAD101 (Toán rời rạc) khá nặng lý thuyết. Mình gom đề theo chương để dễ ôn." },
      { type: "ul", items: [
        "Logic mệnh đề & bảng chân trị.",
        "Tập hợp, quan hệ, hàm.",
        "Đồ thị và cây.",
      ] },
    ],
    replies: [],
  },
  {
    id: "meo-nho-cong-thuc-xac-suat",
    categoryId: "toan-hoc",
    tag: "MAS291",
    title: "Mẹo nhớ công thức xác suất MAS291",
    author: "lan.pham",
    date: "28/3/25",
    ts: 82,
    views: 450,
    excerpt: "Vài cách liên tưởng giúp nhớ công thức lâu hơn thay vì học vẹt.",
    body: [
      { type: "p", text: "Thay vì học vẹt, hãy gắn công thức với ý nghĩa. Ví dụ phương sai đo mức 'phân tán' của dữ liệu quanh kỳ vọng." },
      { type: "p", text: "Làm nhiều bài tập cùng dạng cũng giúp công thức tự khắc in vào đầu." },
    ],
    replies: [],
  },
];

/* ============================================================
   Helpers
   ============================================================ */

export function getCategory(id: string): KnowledgeCategory | undefined {
  return KNOWLEDGE.find((c) => c.id === id);
}

export function threadsByCategory(categoryId: string): Thread[] {
  return THREADS.filter((t) => t.categoryId === categoryId).sort(
    (a, b) => Number(b.pinned ?? false) - Number(a.pinned ?? false) || b.ts - a.ts
  );
}

export function getThread(threadId: string): Thread | undefined {
  return THREADS.find((t) => t.id === threadId);
}

export function recentThreads(n: number): Thread[] {
  return [...THREADS].sort((a, b) => b.ts - a.ts).slice(0, n);
}

export function postCount(thread: Thread): number {
  return 1 + thread.replies.length;
}

export const FORUM_STATS = {
  threads: THREADS.length,
  posts: THREADS.reduce((sum, t) => sum + postCount(t), 0),
  members: 1280,
};

/** Bài viết do người dùng tạo trong phiên — lưu sessionStorage. */
export const USER_THREADS_KEY = "thithu:forum:userThreads";

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** Đọc danh sách bài viết người dùng đã tạo (client-side). */
export function readUserThreads(): Thread[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(USER_THREADS_KEY);
    const arr = raw ? (JSON.parse(raw) as Thread[]) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function saveUserThread(thread: Thread): void {
  if (typeof window === "undefined") return;
  try {
    const list = readUserThreads();
    sessionStorage.setItem(USER_THREADS_KEY, JSON.stringify([thread, ...list]));
  } catch {
    /* ignore */
  }
}
