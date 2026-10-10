import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quản trị — ExamCure",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
