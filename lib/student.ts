/** Thí sinh demo dùng trong phòng thi & dashboard. */
export const STUDENT = {
  name: "Nguyễn Minh Quân",
  shortName: "Minh Quân",
  className: "K19 · Hệ chính quy",
};

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Mã số sinh viên theo định dạng gần đúng của từng trường. */
export function mssvFor(schoolId: string): string {
  const h = hash("mssv" + schoolId);
  if (schoolId === "fptu") return "SE" + (160000 + (h % 9000)).toString();
  if (schoolId === "ptit") return "B21DCCN" + (100 + (h % 800)).toString();
  const year = 2021 + (h % 3);
  return `${year}${(1000 + (h % 8999)).toString()}`;
}

/** Mã đề thi (3 chữ số) theo học phần. */
export function examCodeFor(subjectId: string): string {
  const h = hash("made" + subjectId);
  return (100 + (h % 899)).toString();
}
