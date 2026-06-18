import type { Difficulty, QuestionKind, Subject } from "./types";

/* ============================================================
   Tài liệu ôn tập & danh sách đề thi thử cho từng học phần.
   Sinh deterministic (FNV-1a) để khớp giữa server và client.
   ============================================================ */

export type MaterialType =
  | "summary"
  | "slide"
  | "cheatsheet"
  | "exercises"
  | "video"
  | "flashcard";

export interface Material {
  id: string;
  type: MaterialType;
  title: string;
  /** Dòng meta ngắn: số trang / slide / phút / thẻ. */
  meta: string;
  updated: string;
  source: string;
}

export type ExamTag = "Ôn tập" | "Giữa kỳ" | "Cuối kỳ" | "Tổng hợp";

export interface ExamSet {
  id: string;
  index: number;
  name: string;
  tag: ExamTag;
  questionCount: number;
  durationMin: number;
  difficulty: Difficulty;
  /** Số lượt sinh viên đã làm đề này. */
  attempts: number;
  /** Điểm cao nhất của người dùng trên đề này, hoặc null nếu chưa làm. */
  bestScore: number | null;
}

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/* ---------- Tài liệu ôn tập ---------- */

interface MaterialSeed {
  type: MaterialType;
  title: string;
}

/** Bộ tài liệu gợi ý theo loại học phần — đọc tự nhiên, sát nội dung môn. */
const CATALOG: Record<QuestionKind, MaterialSeed[]> = {
  code: [
    { type: "summary", title: "Tóm tắt lý thuyết & cấu trúc dữ liệu trọng tâm" },
    { type: "cheatsheet", title: "Cheatsheet cú pháp và độ phức tạp thuật toán" },
    { type: "exercises", title: "Ngân hàng bài tập lập trình có lời giải" },
    { type: "slide", title: "Slide bài giảng toàn bộ chương" },
    { type: "video", title: "Video chữa đề mẫu từng dạng" },
    { type: "flashcard", title: "Flashcard thuật ngữ & từ khóa" },
  ],
  math: [
    { type: "cheatsheet", title: "Bảng công thức rút gọn (cheatsheet)" },
    { type: "summary", title: "Tóm tắt định lý & công thức trọng tâm" },
    { type: "exercises", title: "Bài tập tự luyện kèm lời giải chi tiết" },
    { type: "video", title: "Video chữa các dạng bài khó" },
    { type: "slide", title: "Slide chương: Giới hạn — Đạo hàm — Tích phân" },
    { type: "flashcard", title: "Flashcard công thức ghi nhớ nhanh" },
  ],
  econ: [
    { type: "summary", title: "Tóm tắt lý thuyết & mô hình kinh tế" },
    { type: "cheatsheet", title: "Sơ đồ tư duy cung — cầu, GDP, lạm phát" },
    { type: "exercises", title: "Bài tập tình huống có đáp án" },
    { type: "slide", title: "Slide bài giảng theo chương" },
    { type: "video", title: "Video giải đề minh họa" },
    { type: "flashcard", title: "Flashcard khái niệm kinh tế cốt lõi" },
  ],
  theory: [
    { type: "summary", title: "Đề cương ôn tập trọng tâm" },
    { type: "slide", title: "Slide hệ thống hóa kiến thức" },
    { type: "cheatsheet", title: "Sơ đồ tư duy theo chuyên đề" },
    { type: "exercises", title: "Câu hỏi ôn tập kèm gợi ý trả lời" },
    { type: "video", title: "Video tổng ôn trước kỳ thi" },
    { type: "flashcard", title: "Flashcard câu hỏi nhận biết nhanh" },
  ],
  english: [
    { type: "summary", title: "Tổng hợp ngữ pháp & từ vựng học thuật" },
    { type: "cheatsheet", title: "Cheatsheet các thì & cấu trúc câu" },
    { type: "exercises", title: "Bài luyện kèm đáp án và giải thích" },
    { type: "video", title: "Video chữa đề Reading / Listening" },
    { type: "slide", title: "Slide bài giảng theo từng unit" },
    { type: "flashcard", title: "Flashcard từ vựng academic" },
  ],
};

const SOURCES = [
  "Giảng viên bộ môn",
  "CLB Học thuật",
  "Tổ ôn tập THITHU",
  "Cựu sinh viên khóa trước",
  "Cộng đồng đóng góp",
];

const DATES = [
  "02/06/26",
  "21/05/26",
  "14/05/26",
  "30/04/26",
  "16/04/26",
  "27/03/26",
  "09/03/26",
  "18/02/26",
];

/** Tài liệu ôn tập của một học phần. */
export function getMaterials(subject: Subject): Material[] {
  const seeds = CATALOG[subject.kind] ?? CATALOG.theory;

  return seeds.map((seed, i): Material => {
    const h = hash(subject.id + seed.type + i);

    let meta: string;
    switch (seed.type) {
      case "summary":
        meta = `${12 + (h % 28)} trang`;
        break;
      case "cheatsheet":
        meta = `${2 + (h % 4)} trang`;
        break;
      case "slide":
        meta = `${24 + (h % 60)} slide`;
        break;
      case "exercises":
        meta = `${20 + (h % 60)} bài tập`;
        break;
      case "video":
        meta = `${18 + (h % 50)} phút`;
        break;
      case "flashcard":
        meta = `${30 + (h % 90)} thẻ`;
        break;
    }

    return {
      id: `${subject.id}-${seed.type}-${i}`,
      type: seed.type,
      title: seed.title,
      meta,
      updated: DATES[h % DATES.length],
      source: SOURCES[(h >> 5) % SOURCES.length],
    };
  });
}

/** Tra cứu một tài liệu cụ thể của học phần theo id. */
export function getMaterial(
  subject: Subject,
  materialId: string
): Material | undefined {
  return getMaterials(subject).find((m) => m.id === materialId);
}

/* ---------- Đề thi thử ---------- */

const DIFFS: Difficulty[] = ["Cơ bản", "Trung bình", "Nâng cao"];

function tagFor(index: number, total: number): ExamTag {
  if (index === 0) return "Giữa kỳ";
  if (index === total - 1) return "Cuối kỳ";
  if (index === total - 2 && total > 3) return "Tổng hợp";
  return "Ôn tập";
}

/** Danh sách đề thi thử của một học phần (sinh từ examCount). */
export function getExamSets(subject: Subject): ExamSet[] {
  const total = subject.examCount;
  const baseDiff = DIFFS.indexOf(subject.difficulty);

  return Array.from({ length: total }, (_, i): ExamSet => {
    const h = hash(subject.id + "exam" + i);
    const tag = tagFor(i, total);

    // Đề cuối kỳ / tổng hợp khó hơn một bậc; đề ôn tập dao động quanh độ khó môn.
    let diffIdx = baseDiff;
    if (tag === "Cuối kỳ" || tag === "Tổng hợp") diffIdx = Math.min(2, baseDiff + 1);
    else if (h % 4 === 0) diffIdx = Math.max(0, baseDiff - 1);

    // Một vài đề đầu đã được người dùng làm thử.
    const attempted = i < 3 && h % 3 !== 0;
    const bestScore = attempted ? Math.round((6 + ((h >> 6) % 35) / 10) * 10) / 10 : null;

    return {
      id: `${subject.id}-de-${i + 1}`,
      index: i + 1,
      name: `Đề số ${i + 1}`,
      tag,
      questionCount: subject.questionCount + (((h >> 2) % 3) - 1) * 5,
      durationMin: subject.durationMin,
      difficulty: DIFFS[diffIdx],
      attempts: 60 + (h % 1840),
      bestScore,
    };
  });
}
