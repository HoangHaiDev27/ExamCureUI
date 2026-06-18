import { AuthShell } from "@/components/auth/AuthShell";
import { OtpVerifyFlow } from "@/components/auth/OtpVerifyFlow";

export const metadata = {
  title: "Xác thực OTP | ExamCure",
};

export default async function OtpPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string | string[] }>;
}) {
  const sp = await searchParams;
  const email =
    typeof sp.email === "string" && sp.email ? sp.email : "email của bạn";

  return (
    <AuthShell>
      <OtpVerifyFlow email={email} />
    </AuthShell>
  );
}
