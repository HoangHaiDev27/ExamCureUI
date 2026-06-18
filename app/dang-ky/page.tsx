import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata = {
  title: "Đăng ký | ExamCure",
};

export default function RegisterPage() {
  return (
    <AuthShell
      title="Đăng ký ExamCure"
      subtitle="Tạo tài khoản để lưu lịch sử thi và theo dõi tiến bộ của bạn"
      footer={
        <>
          Bạn đã có tài khoản?{" "}
          <Link
            href="/dang-nhap"
            className="font-semibold text-ink transition-colors hover:text-orange"
          >
            Đăng nhập
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
