import type { Difficulty, QuestionKind, School, Subject } from "./types";
import { getSchool } from "./schools";

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

const FPTU_POOL: SubjectSeed[] = [
  // --- Kỹ thuật Phần mềm ---
  { name: "Lập trình hướng đối tượng", code: "PRO192", faculty: "Kỹ thuật phần mềm", kind: "code", fields: ["Công nghệ"], dur: 60, q: 40, diff: "Trung bình" },
  { name: "Cấu trúc dữ liệu & Giải thuật", code: "CSD201", faculty: "Kỹ thuật phần mềm", kind: "code", fields: ["Công nghệ"], dur: 90, q: 40, diff: "Nâng cao" },
  { name: "Cơ sở dữ liệu", code: "DBI202", faculty: "Kỹ thuật phần mềm", kind: "code", fields: ["Công nghệ"], dur: 60, q: 35, diff: "Trung bình" },
  { name: "Nhập môn Kỹ nghệ phần mềm", code: "SWE201", faculty: "Kỹ thuật phần mềm", kind: "code", fields: ["Công nghệ"], dur: 60, q: 40, diff: "Trung bình" },
  { name: "Lập trình Web cơ bản", code: "WEB201", faculty: "Kỹ thuật phần mềm", kind: "code", fields: ["Công nghệ"], dur: 75, q: 35, diff: "Trung bình" },
  { name: "Lập trình ứng dụng .NET (PRN211)", code: "PRN211", faculty: "Kỹ thuật phần mềm", kind: "code", fields: ["Công nghệ"], dur: 90, q: 40, diff: "Nâng cao" },
  { name: "Lập trình di động ứng dụng", code: "PRM391", faculty: "Kỹ thuật phần mềm", kind: "code", fields: ["Công nghệ"], dur: 90, q: 40, diff: "Nâng cao" },
  { name: "Lập trình Front-End với React", code: "FER201", faculty: "Kỹ thuật phần mềm", kind: "code", fields: ["Công nghệ"], dur: 75, q: 35, diff: "Trung bình" },
  { name: "Hệ điều hành", code: "OSG202", faculty: "Kỹ thuật phần mềm", kind: "theory", fields: ["Công nghệ"], dur: 60, q: 40, diff: "Trung bình" },
  { name: "Mạng máy tính", code: "NWC203", faculty: "Kỹ thuật phần mềm", kind: "theory", fields: ["Công nghệ"], dur: 60, q: 40, diff: "Trung bình" },

  // --- An toàn Thông tin ---
  { name: "Nhập môn An toàn thông tin", code: "IAS201", faculty: "An toàn thông tin", kind: "theory", fields: ["Công nghệ"], dur: 60, q: 40, diff: "Trung bình" },
  { name: "Mật mã học & An ninh mạng", code: "IAS301", faculty: "An toàn thông tin", kind: "theory", fields: ["Công nghệ"], dur: 75, q: 40, diff: "Nâng cao" },
  { name: "Phòng thủ mạng (Cyber Defense)", code: "IAS302", faculty: "An toàn thông tin", kind: "theory", fields: ["Công nghệ"], dur: 75, q: 40, diff: "Nâng cao" },
  { name: "Điều tra kỹ thuật số (Digital Forensics)", code: "IAS303", faculty: "An toàn thông tin", kind: "theory", fields: ["Công nghệ"], dur: 90, q: 45, diff: "Nâng cao" },

  // --- Trí tuệ Nhân tạo ---
  { name: "Học máy (Machine Learning)", code: "AIL302", faculty: "Trí tuệ nhân tạo", kind: "math", fields: ["Công nghệ"], dur: 90, q: 40, diff: "Nâng cao" },
  { name: "Học sâu (Deep Learning)", code: "AID301", faculty: "Trí tuệ nhân tạo", kind: "math", fields: ["Công nghệ"], dur: 90, q: 40, diff: "Nâng cao" },
  { name: "Thị giác máy tính (Computer Vision)", code: "AIV301", faculty: "Trí tuệ nhân tạo", kind: "math", fields: ["Công nghệ"], dur: 90, q: 40, diff: "Nâng cao" },
  { name: "Xử lý ngôn ngữ tự nhiên (NLP)", code: "NLP301", faculty: "Trí tuệ nhân tạo", kind: "math", fields: ["Công nghệ"], dur: 90, q: 40, diff: "Nâng cao" },

  // --- Quản trị Kinh doanh ---
  { name: "Nguyên lý Marketing", code: "MKT201", faculty: "Quản trị kinh doanh", kind: "theory", fields: ["Kinh tế"], dur: 60, q: 40, diff: "Cơ bản" },
  { name: "Nhập môn Quản trị học", code: "MGT103", faculty: "Quản trị kinh doanh", kind: "theory", fields: ["Kinh tế"], dur: 60, q: 45, diff: "Cơ bản" },
  { name: "Hành vi tổ chức", code: "OBG201", faculty: "Quản trị kinh doanh", kind: "theory", fields: ["Kinh tế"], dur: 60, q: 40, diff: "Trung bình" },
  { name: "Thị trường & Định chế tài chính", code: "FIN202", faculty: "Quản trị kinh doanh", kind: "econ", fields: ["Kinh tế"], dur: 60, q: 40, diff: "Trung bình" },
  { name: "Khởi nghiệp (Entrepreneurship)", code: "ENT301", faculty: "Quản trị kinh doanh", kind: "theory", fields: ["Kinh tế"], dur: 75, q: 35, diff: "Trung bình" },

  // --- Thiết kế Mỹ thuật số ---
  { name: "Nhập môn Mỹ thuật số", code: "DAD101", faculty: "Thiết kế mỹ thuật số", kind: "theory", fields: ["Đa ngành"], dur: 60, q: 40, diff: "Cơ bản" },
  { name: "Nguyên lý thị giác & Màu sắc", code: "DAD201", faculty: "Thiết kế mỹ thuật số", kind: "theory", fields: ["Đa ngành"], dur: 60, q: 40, diff: "Cơ bản" },
  { name: "Tạo hình 3D & Hoạt cảnh", code: "DAD301", faculty: "Thiết kế mỹ thuật số", kind: "theory", fields: ["Đa ngành"], dur: 90, q: 35, diff: "Nâng cao" },

  // --- Đại cương & Ngoại ngữ ---
  { name: "Toán rời rạc (Discrete Mathematics)", code: "MAD101", faculty: "Đại cương & Ngoại ngữ", kind: "math", fields: ["Công nghệ", "Kỹ thuật"], dur: 90, q: 35, diff: "Trung bình" },
  { name: "Giải tích 1", code: "MAE101", faculty: "Đại cương & Ngoại ngữ", kind: "math", fields: ["Công nghệ", "Kỹ thuật"], dur: 90, q: 30, diff: "Nâng cao" },
  { name: "Xác suất thống kê", code: "MAS291", faculty: "Đại cương & Ngoại ngữ", kind: "math", fields: ["Công nghệ", "Kinh tế", "Kỹ thuật"], dur: 75, q: 35, diff: "Trung bình" },
  { name: "Triết học Mác – Lênin", code: "MLN111", faculty: "Đại cương & Ngoại ngữ", kind: "theory", fields: ["Công nghệ", "Kinh tế", "Kỹ thuật", "Ngoại ngữ"], dur: 60, q: 45, diff: "Cơ bản" },
  { name: "Tư tưởng Hồ Chí Minh", code: "HCM201", faculty: "Đại cương & Ngoại ngữ", kind: "theory", fields: ["Công nghệ", "Kinh tế", "Kỹ thuật", "Ngoại ngữ"], dur: 60, q: 40, diff: "Cơ bản" },
  { name: "Kỹ năng học tập đại học (SSL101)", code: "SSL101", faculty: "Đại cương & Ngoại ngữ", kind: "theory", fields: ["Công nghệ", "Kinh tế", "Kỹ thuật", "Ngoại ngữ"], dur: 60, q: 40, diff: "Cơ bản" },
  { name: "Tiếng Nhật cơ bản 1A", code: "JPN111", faculty: "Đại cương & Ngoại ngữ", kind: "english", fields: ["Ngoại ngữ"], dur: 60, q: 40, diff: "Cơ bản" },
  { name: "Viết luận Tiếng Anh (ENW301)", code: "ENW301", faculty: "Đại cương & Ngoại ngữ", kind: "english", fields: ["Ngoại ngữ"], dur: 60, q: 40, diff: "Trung bình" }
];

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

  return list.map((seed): Subject => {
    const h = hash(schoolId + seed.code);
    const examCount = 4 + (h % 9); // 4–12 đề
    const attempted = h % 3 !== 0; // ~2/3 đã từng thi
    const rawScore = 5.5 + ((h >> 4) % 40) / 10; // 5.5–9.4
    const lastScore = attempted ? Math.round(rawScore * 10) / 10 : null;

    return {
      id: `${schoolId}-${seed.code.toLowerCase()}`,
      schoolId,
      name: seed.name,
      code: seed.code,
      faculty: seed.faculty,
      semester: SEMESTERS[h % SEMESTERS.length],
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
