import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = {
  title: "Đăng nhập | ExamCure",
};

export default function LoginPage() {
  return (
    <AuthShell
      title="Đăng nhập ExamCure"
      subtitle="Vui lòng nhập thông tin để đăng nhập vào tài khoản của bạn"
      footer={
        <>
          Nếu bạn chưa có tài khoản.{" "}
          <Link
            href="/dang-ky"
            className="font-semibold text-ink transition-colors hover:text-orange"
          >
            Đăng ký
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthShell>
  );
}
