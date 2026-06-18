export interface Grade {
  letter: string;
  label: string;
  /** semantic tone for coloring */
  tone: "green" | "blue" | "warning" | "danger";
}

/** Xếp loại theo thang điểm 10 (quy đổi gần đúng học chế tín chỉ). */
export function classify(score10: number): Grade {
  if (score10 >= 9) return { letter: "A", label: "Xuất sắc", tone: "green" };
  if (score10 >= 8) return { letter: "B+", label: "Giỏi", tone: "green" };
  if (score10 >= 7) return { letter: "B", label: "Khá", tone: "blue" };
  if (score10 >= 6) return { letter: "C+", label: "Trung bình khá", tone: "warning" };
  if (score10 >= 5) return { letter: "C", label: "Trung bình", tone: "warning" };
  if (score10 >= 4) return { letter: "D", label: "Yếu", tone: "danger" };
  return { letter: "F", label: "Kém", tone: "danger" };
}

export const TONE_COLOR: Record<Grade["tone"], string> = {
  green: "var(--color-green)",
  blue: "var(--color-blue)",
  warning: "#c98a06",
  danger: "var(--color-danger)",
};
