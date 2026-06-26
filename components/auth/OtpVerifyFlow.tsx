"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, ShieldCheck } from "lucide-react";
import { AuthHeading } from "./AuthShell";
import { OtpInput } from "./OtpInput";
import { verifyOtpAPI, login as localLogin } from "@/lib/auth";

export function OtpVerifyFlow({ email }: { email: string }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [done, setDone] = useState(false);
  const [resendIn, setResendIn] = useState(60);

  useEffect(() => {
    if (resendIn <= 0) return;
    const id = setInterval(() => setResendIn((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(id);
  }, [resendIn]);

  async function verify() {
    if (code.length !== 6) {
      setError("Vui lòng nhập đủ 6 chữ số");
      return;
    }
    setError(null);
    setVerifying(true);
    
    try {
      const data = await verifyOtpAPI(email, code);
      localLogin({
        name: data.fullName || data.email,
        email: data.email,
        token: data.token,
        refreshToken: data.refreshToken,
        role: data.role
      });
      setDone(true);
    } catch (err: any) {
      setError(err.message || "Mã OTP không hợp lệ.");
    } finally {
      setVerifying(false);
    }
  }

  if (done) {
    return (
      <div className="text-center">
        <div className="mx-auto mt-2 grid h-14 w-14 place-items-center rounded-full bg-green-soft text-green">
          <CheckCircle2 size={28} />
        </div>
        <h1 className="mt-4 font-display text-[24px] font-semibold leading-tight text-ink">
          Xác thực thành công
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-[14.5px] leading-relaxed text-ink-2">
          Tài khoản của bạn đã được kích hoạt. Chào mừng bạn đến với ExamCure!
        </p>
        <button
          onClick={() => router.push("/dashboard")}
          className="mt-6 h-12 w-full rounded-[8px] bg-orange text-[15px] font-semibold text-white shadow-[0_1px_2px_rgba(7,141,248,0.32)] transition-colors hover:bg-orange-dark"
        >
          Vào bảng điều khiển
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mx-auto -mb-1 grid h-14 w-14 place-items-center rounded-full bg-orange-soft text-orange">
        <ShieldCheck size={26} />
      </div>
      <AuthHeading
        title="Xác thực tài khoản"
        subtitle={`Nhập mã gồm 6 chữ số đã gửi tới ${email}`}
      />

      <div className="mt-7 space-y-4">
        <div>
          <OtpInput
            value={code}
            onChange={(v) => {
              setCode(v);
              setError(null);
            }}
            invalid={!!error}
          />
          {error && (
            <p className="mt-1.5 text-center text-[12.5px] text-danger">
              {error}
            </p>
          )}
        </div>

        <button
          onClick={verify}
          disabled={verifying || code.length !== 6}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[8px] bg-orange text-[15px] font-semibold text-white shadow-[0_1px_2px_rgba(7,141,248,0.32)] transition-colors hover:bg-orange-dark disabled:opacity-45"
        >
          {verifying ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-white" />
              Đang xác thực…
            </>
          ) : (
            "Xác thực"
          )}
        </button>

        <p className="text-center text-[13.5px] text-ink-2">
          Không nhận được mã?{" "}
          {resendIn > 0 ? (
            <span className="text-ink-3">Gửi lại sau {resendIn}s</span>
          ) : (
            <button
              onClick={() => {
                setResendIn(60);
                setCode("");
                setError(null);
              }}
              className="font-medium text-orange transition-colors hover:text-orange-dark"
            >
              Gửi lại mã
            </button>
          )}
        </p>
      </div>

      <div className="mt-6 border-t border-line pt-5 text-center">
        <Link
          href="/dang-ky"
          className="inline-flex items-center gap-1.5 text-[14px] font-medium text-ink-2 transition-colors hover:text-orange"
        >
          <ArrowLeft size={15} /> Sai email? Đăng ký lại
        </Link>
      </div>
    </div>
  );
}
