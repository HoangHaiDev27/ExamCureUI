import type { Difficulty, QuestionKind, School, Subject } from "./types";
import { getSchool } from "./schools";
import { FPTU_SUBJECTS } from "./fpt-subjects";

interface SubjectSeed {
  name: string;
  code: string;
  faculty: string;
  kind: QuestionKind;
  /** Which school fields this course fits. */
  fields: School["field"][];
  dur: number;
  q: number;
  diff: Difficulty;
  curriculumTerm?: number;
}

/** Master pool of học phần. getSubjects() picks the ones that fit a school. */
const POOL: SubjectSeed[] = [
  // --- Công nghệ / Kỹ thuật ---
  { name: "Lập trình hướng đối tượng", code: "PRO192", faculty: "CNTT", kind: "code", fields: ["Công nghệ", "Kỹ thuật"], dur: 60, q: 40, diff: "Trung bình" },
  { name: "Cấu trúc dữ liệu & Giải thuật", code: "CSD201", faculty: "CNTT", kind: "code", fields: ["Công nghệ", "Kỹ thuật"], dur: 90, q: 40, diff: "Nâng cao" },
  { name: "Cơ sở dữ liệu", code: "DBI202", faculty: "CNTT", kind: "code", fields: ["Công nghệ"], dur: 60, q: 35, diff: "Trung bình" },
  { name: "Lập trình Web", code: "WEB201", faculty: "CNTT", kind: "code", fields: ["Công nghệ"], dur: 75, q: 35, diff: "Trung bình" },
  { name: "Mạng máy tính", code: "NWC203", faculty: "CNTT", kind: "theory", fields: ["Công nghệ", "Kỹ thuật"], dur: 60, q: 40, diff: "Trung bình" },
  { name: "Kỹ thuật lập trình C", code: "PRF192", faculty: "CNTT", kind: "code", fields: ["Công nghệ", "Kỹ thuật", "Đa ngành"], dur: 60, q: 40, diff: "Cơ bản" },
  // --- Toán ---
  { name: "Giải tích 1", code: "MAE101", faculty: "Toán cơ bản", kind: "math", fields: ["Công nghệ", "Kỹ thuật", "Đa ngành"], dur: 90, q: 30, diff: "Nâng cao" },
  { name: "Đại số tuyến tính", code: "MAS101", faculty: "Toán cơ bản", kind: "math", fields: ["Công nghệ", "Kỹ thuật"], dur: 75, q: 30, diff: "Trung bình" },
  { name: "Xác suất thống kê", code: "MAS291", faculty: "Toán cơ bản", kind: "math", fields: ["Công nghệ", "Kinh tế", "Kỹ thuật", "Đa ngành"], dur: 75, q: 35, diff: "Trung bình" },
  // --- Kinh tế ---
  { name: "Kinh tế vi mô", code: "ECO111", faculty: "Kinh tế học", kind: "econ", fields: ["Kinh tế", "Đa ngành"], dur: 60, q: 40, diff: "Trung bình" },
  { name: "Kinh tế vĩ mô", code: "ECO112", faculty: "Kinh tế học", kind: "econ", fields: ["Kinh tế", "Đa ngành"], dur: 60, q: 40, diff: "Trung bình" },
  { name: "Nguyên lý kế toán", code: "ACC101", faculty: "Kế toán — Kiểm toán", kind: "econ", fields: ["Kinh tế"], dur: 75, q: 45, diff: "Trung bình" },
  { name: "Tài chính — Tiền tệ", code: "FIN202", faculty: "Tài chính — Ngân hàng", kind: "econ", fields: ["Kinh tế"], dur: 60, q: 40, diff: "Trung bình" },
  { name: "Marketing căn bản", code: "MKT201", faculty: "Quản trị kinh doanh", kind: "theory", fields: ["Kinh tế", "Đa ngành"], dur: 60, q: 40, diff: "Cơ bản" },
  { name: "Quản trị học", code: "MGT103", faculty: "Quản trị kinh doanh", kind: "theory", fields: ["Kinh tế", "Đa ngành"], dur: 60, q: 40, diff: "Cơ bản" },
  // --- Đại cương / Ngoại ngữ ---
  { name: "Triết học Mác – Lênin", code: "MLN111", faculty: "Lý luận chính trị", kind: "theory", fields: ["Công nghệ", "Kinh tế", "Kỹ thuật", "Đa ngành", "Ngoại ngữ"], dur: 60, q: 45, diff: "Cơ bản" },
  { name: "Tiếng Anh học thuật", code: "AET201", faculty: "Ngoại ngữ", kind: "english", fields: ["Ngoại ngữ", "Kinh tế", "Đa ngành"], dur: 60, q: 40, diff: "Trung bình" },
];

const FPTU_POOL: SubjectSeed[] = FPTU_SUBJECTS.map((subject) => ({
  ...subject,
  fields: ["Công nghệ", "Kinh tế", "Kỹ thuật", "Đa ngành", "Ngoại ngữ"],
}));

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const SEMESTERS = ["HK1 2024–2025", "HK2 2024–2025", "HK Hè 2025"];

/** Deterministic course list for a school: stable on server & client. */
export function getSubjects(schoolId: string): Subject[] {
  const school = getSchool(schoolId);
  if (!school) return [];

  const isFPT = schoolId === "fptu";
  const sourcePool = isFPT ? FPTU_POOL : POOL;
  const fitting = isFPT ? FPTU_POOL : POOL.filter((s) => s.fields.includes(school.field));
  const list = fitting.length >= 6 ? fitting : sourcePool; // fallback to full pool
  const codeCounts = list.reduce((counts, seed) => {
    counts.set(seed.code, (counts.get(seed.code) ?? 0) + 1);
    return counts;
  }, new Map<string, number>());

  return list.map((seed): Subject => {
    const h = hash(schoolId + seed.code);
    const examCount = 4 + (h % 9); // 4–12 đề
    const attempted = h % 3 !== 0; // ~2/3 đã từng thi
    const rawScore = 5.5 + ((h >> 4) % 40) / 10; // 5.5–9.4
    const lastScore = attempted ? Math.round(rawScore * 10) / 10 : null;

    return {
      id: codeCounts.get(seed.code)! > 1
        ? `${schoolId}-${seed.code.toLowerCase()}-k${seed.curriculumTerm}`
        : `${schoolId}-${seed.code.toLowerCase()}`,
      schoolId,
      name: seed.name,
      code: seed.code,
      faculty: seed.faculty,
      semester: isFPT && seed.curriculumTerm
        ? `Kỳ ${seed.curriculumTerm}`
        : SEMESTERS[h % SEMESTERS.length],
      examCount,
      durationMin: seed.dur,
      questionCount: seed.q,
      difficulty: seed.diff,
      lastScore,
      scale: "10",
      kind: seed.kind,
    };
  });
}

export function getSubject(
  schoolId: string,
  subjectId: string
): Subject | undefined {
  return getSubjects(schoolId).find((s) => s.id === subjectId);
}
