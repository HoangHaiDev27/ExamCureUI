import type { Metadata } from "next";
import { AdminConsole } from "@/components/admin/AdminConsole";

export const metadata: Metadata = {
  title: "Quản trị nội dung AI — ExamCure",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminConsole />;
}
