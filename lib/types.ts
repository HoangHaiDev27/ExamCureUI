export type Region = "Miền Bắc" | "Miền Trung" | "Miền Nam";
export type Field =
  | "Công nghệ"
  | "Kinh tế"
  | "Kỹ thuật"
  | "Đa ngành"
  | "Ngoại ngữ";

/** Each school's exam room mimics a different real CBT software. */
export type ExamLayout = "classic" | "moodle" | "banded";

export interface ExamTheme {
  /** Header / accent color of the simulated exam software. */
  brand: string;
  brandDark: string;
  /** Text color on top of brand. */
  onBrand: string;
  /** Soft tint derived from brand, for selected states inside the room. */
  tint: string;
  /** Header composition variant. */
  layout: ExamLayout;
  /** Name of the exam software being simulated. */
  systemName: string;
  /** Monogram silhouette. */
  mark: "square" | "shield" | "circle" | "hex";
}

export interface School {
  id: string;
  name: string;
  abbr: string;
  city: string;
  region: Region;
  field: Field;
  popular: boolean;
  subjectCount: number;
  examCount: number;
  /** Active learners, in thousands — social proof. */
  learnersK: number;
  theme: ExamTheme;
}

export type Difficulty = "Cơ bản" | "Trung bình" | "Nâng cao";
export type QuestionKind = "code" | "math" | "econ" | "theory" | "english";

export interface Subject {
  id: string;
  schoolId: string;
  name: string;
  code: string;
  faculty: string;
  semester: string;
  examCount: number;
  durationMin: number;
  questionCount: number;
  difficulty: Difficulty;
  /** Most recent practice score on the school's grading scale, or null. */
  lastScore: number | null;
  scale: "10" | "letter";
  kind: QuestionKind;
}

export interface Question {
  id: string;
  /** Plain prompt text. */
  prompt: string;
  /** Optional monospace block (code, for programming subjects). */
  code?: string;
  /** Optional formula line, rendered in serif italic. */
  formula?: string;
  options: string[];
  /** Index of the correct option. */
  answer: number;
  /** Expandable explanation shown on the results screen. */
  explain: string;
}
