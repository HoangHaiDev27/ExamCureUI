"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, MailCheck } from "lucide-react";
import { AuthHeading } from "./AuthShell";
import { Captcha } from "./Captcha";
import { TextField, PasswordField, SubmitButton } from "./Fields";
import { OtpInput } from "./OtpInput";

type Step = "request" | "sent" | "reset" | "done";

export function ForgotPasswordFlow() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("request");

  // request
  const [email, setEmail] = useState("");
  const [captcha, setCaptcha] = useState(false);
  const [reqErr, setReqErr] = useState<{ email?: string; captcha?: boolean }>({});

  // reset
  const [code, setCode] = useState("");
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [resetErr, setResetErr] = useState<{ code?: string; pw?: string; confirm?: string }>({});

  // resend cooldown
  const [resendIn, setResendIn] = useState(0);
  useEffect(() => {
    if (resendIn <= 0) return;
    const id = setInterval(() => setResendIn((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(id);
  }, [resendIn]);

  function sendRequest(e: React.FormEvent) {
    e.preventDefault();
    const er: typeof reqErr = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) er.email = "Email không hợp lệ";
    if (!captcha) er.captcha = true;
    setReqErr(er);
    if (Object.keys(er).length === 0) {
      setStep("sent");
      setResendIn(30);
    }
  }

  function submitReset(e: React.FormEvent) {
    e.preventDefault();
    const er: typeof resetErr = {};
    if (code.length !== 6) er.code = "Mã gồm 6 chữ số";
    if (pw.length < 6) er.pw = "Mật khẩu tối thiểu 6 ký tự";
    if (confirm !== pw) er.confirm = "Mật khẩu nhập lại không khớp";
    setResetErr(er);
    if (Object.keys(er).length === 0) setStep("done");
  }

  const backToLogin = (
    <Link
      href="/dang-nhap"
      className="inline-flex items-center gap-1.5 text-[14px] font-medium text-ink-2 transition-colors hover:text-orange"
    >
      <ArrowLeft size={15} /> Quay lại đăng nhập
    </Link>
  );

  /* ---------------------------------------------------- request */
  if (step === "request") {
    return (
      <div>
        <AuthHeading
          title="Quên mật khẩu"
          subtitle="Nhập email của bạn, chúng tôi sẽ gửi mã đặt lại mật khẩu."
        />
        <form onSubmit={sendRequest} noValidate className="mt-7 space-y-4">
          <TextField
            label="Email"
            required
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="Nhập email đăng ký"
            error={reqErr.email}
            autoComplete="email"
          />
          <Captcha checked={captcha} onChange={setCaptcha} error={reqErr.captcha} />
          <SubmitButton>Gửi mã đặt lại</SubmitButton>
        </form>
        <div className="mt-6 border-t border-line pt-5 text-center">{backToLogin}</div>
      </div>
    );
  }

  /* ---------------------------------------------------- sent */
  if (step === "sent") {
    return (
      <div className="text-center">
        <div className="mx-auto mt-2 grid h-14 w-14 place-items-center rounded-full bg-blue-soft text-blue">
          <MailCheck size={26} />
        </div>
        <h1 className="mt-4 font-display text-[24px] font-semibold leading-tight text-ink">
          Kiểm tra email của bạn
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-[14.5px] leading-relaxed text-ink-2">
          Chúng tôi đã gửi mã đặt lại mật khẩu tới{" "}
          <span className="font-medium text-ink">{email}</span>. Mã có hiệu lực trong 15 phút.
        </p>

        <button
          onClick={() => setStep("reset")}
          className="mt-6 h-12 w-full rounded-[8px] bg-orange text-[15px] font-semibold text-white shadow-[0_1px_2px_rgba(7,141,248,0.32)] transition-colors hover:bg-orange-dark"
        >
          Tôi đã nhận được mã
        </button>

        <p className="mt-4 text-[13.5px] text-ink-2">
          Không thấy email?{" "}
          {resendIn > 0 ? (
            <span className="text-ink-3">Gửi lại sau {resendIn}s</span>
          ) : (
            <button
              onClick={() => setResendIn(30)}
              className="font-medium text-orange transition-colors hover:text-orange-dark"
            >
              Gửi lại mã
            </button>
          )}
        </p>

        <div className="mt-6 border-t border-line pt-5">{backToLogin}</div>
      </div>
    );
  }

  /* ---------------------------------------------------- reset */
  if (step === "reset") {
    return (
      <div>
        <AuthHeading
          title="Đặt lại mật khẩu"
          subtitle="Nhập mã 6 chữ số đã gửi tới email và mật khẩu mới của bạn."
        />
        <form onSubmit={submitReset} noValidate className="mt-7 space-y-4">
          <div>
            <label className="mb-1.5 flex items-center gap-1 text-[14px] font-semibold text-ink">
              Mã xác nhận <span className="text-danger">*</span>
            </label>
            <OtpInput value={code} onChange={setCode} invalid={!!resetErr.code} />
            {resetErr.code && <p className="mt-1.5 text-[12.5px] text-danger">{resetErr.code}</p>}
          </div>
          <PasswordField
            label="Mật khẩu mới"
            required
            value={pw}
            onChange={setPw}
            placeholder="Tối thiểu 6 ký tự"
            error={resetErr.pw}
            autoComplete="new-password"
          />
          <PasswordField
            label="Xác nhận mật khẩu"
            required
            value={confirm}
            onChange={setConfirm}
            placeholder="Nhập lại mật khẩu mới"
            error={resetErr.confirm}
            autoComplete="new-password"
          />
          <SubmitButton>Đặt lại mật khẩu</SubmitButton>
        </form>
        <div className="mt-6 border-t border-line pt-5 text-center">
          <button
            onClick={() => setStep("sent")}
            className="inline-flex items-center gap-1.5 text-[14px] font-medium text-ink-2 transition-colors hover:text-orange"
          >
            <ArrowLeft size={15} /> Quay lại
          </button>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------- done */
  return (
    <div className="text-center">
      <div className="mx-auto mt-2 grid h-14 w-14 place-items-center rounded-full bg-green-soft text-green">
        <CheckCircle2 size={28} />
      </div>
      <h1 className="mt-4 font-display text-[24px] font-semibold leading-tight text-ink">
        Đổi mật khẩu thành công
      </h1>
      <p className="mx-auto mt-2 max-w-sm text-[14.5px] leading-relaxed text-ink-2">
        Mật khẩu của bạn đã được cập nhật. Hãy đăng nhập bằng mật khẩu mới.
      </p>
      <button
        onClick={() => router.push("/dang-nhap")}
        className="mt-6 h-12 w-full rounded-[8px] bg-orange text-[15px] font-semibold text-white shadow-[0_1px_2px_rgba(7,141,248,0.32)] transition-colors hover:bg-orange-dark"
      >
        Đăng nhập ngay
      </button>
    </div>
  );
}

