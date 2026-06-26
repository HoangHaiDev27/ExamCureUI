"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { SocialAuth } from "./SocialAuth";
import { Captcha } from "./Captcha";
import { TextField, PasswordField, SubmitButton } from "./Fields";
import { registerAPI } from "@/lib/auth";

export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [agree, setAgree] = useState(false);
  const [captcha, setCaptcha] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirm?: string;
    agree?: boolean;
    captcha?: boolean;
  }>({});

  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const er: typeof errors = {};
    if (name.trim().length < 2) er.name = "Vui lòng nhập họ tên";
    if (!/^\S+@\S+\.\S+$/.test(email)) er.email = "Email không hợp lệ";
    if (password.length < 6) er.password = "Mật khẩu tối thiểu 6 ký tự";
    if (confirm !== password) er.confirm = "Mật khẩu nhập lại không khớp";
    if (!agree) er.agree = true;
    if (!captcha) er.captcha = true;
    setErrors(er);
    if (Object.keys(er).length === 0) {
      setIsSubmitting(true);
      try {
        await registerAPI(name, email, password);
        router.push(`/xac-thuc-otp?email=${encodeURIComponent(email)}`);
      } catch (error: any) {
        setErrors({ ...er, email: error.message });
      } finally {
        setIsSubmitting(false);
      }
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      <SocialAuth verb="Đăng ký" />
      <div className="space-y-4">
        <TextField
          label="Họ và tên"
          required
          value={name}
          onChange={setName}
          placeholder="Nhập họ và tên"
          error={errors.name}
          autoComplete="name"
        />
        <TextField
          label="Email"
          required
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="Nhập email"
          error={errors.email}
          autoComplete="email"
        />
        <PasswordField
          label="Mật khẩu"
          required
          value={password}
          onChange={setPassword}
          placeholder="Tối thiểu 6 ký tự"
          error={errors.password}
          autoComplete="new-password"
        />
        <PasswordField
          label="Xác nhận mật khẩu"
          required
          value={confirm}
          onChange={setConfirm}
          placeholder="Nhập lại mật khẩu"
          error={errors.confirm}
          autoComplete="new-password"
        />

        {/* Đồng ý điều khoản */}
        <div>
          <button
            type="button"
            onClick={() => setAgree((a) => !a)}
            className="flex items-start gap-2.5 text-left"
          >
            <span
              className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-[4px] border-2 transition-colors ${
                agree ? "border-orange bg-orange text-white" : errors.agree ? "border-danger bg-paper" : "border-line-strong bg-paper"
              }`}
            >
              {agree && <Check size={13} strokeWidth={3} />}
            </span>
            <span className="text-[13.5px] leading-relaxed text-ink-2">
              Tôi đồng ý với{" "}
              <Link href="#" className="font-medium text-ink underline-offset-2 hover:text-orange hover:underline">Điều khoản sử dụng</Link>{" "}
              và{" "}
              <Link href="#" className="font-medium text-ink underline-offset-2 hover:text-orange hover:underline">Chính sách bảo mật</Link>
            </span>
          </button>
        </div>

        <Captcha checked={captcha} onChange={setCaptcha} error={errors.captcha} />
        <SubmitButton disabled={isSubmitting}>{isSubmitting ? "Đang tạo..." : "Tạo tài khoản"}</SubmitButton>
      </div>
    </form>
  );
}
