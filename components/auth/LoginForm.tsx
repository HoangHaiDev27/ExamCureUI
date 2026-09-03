"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SocialAuth } from "./SocialAuth";
import { Captcha } from "./Captcha";
import { TextField, PasswordField, SubmitButton } from "./Fields";
import { login, loginAPI } from "@/lib/auth";
import { STUDENT } from "@/lib/student";

export function LoginForm({
  redirectTo,
  onSuccess,
}: {
  redirectTo?: string;
  onSuccess?: () => void;
} = {}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captcha, setCaptcha] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    captcha?: boolean;
  }>({});

  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const er: typeof errors = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) er.email = "Email không hợp lệ";
    if (password.length < 1) er.password = "Vui lòng nhập mật khẩu";
    if (!captcha) er.captcha = true;
    setErrors(er);
    if (Object.keys(er).length === 0) {
      setIsSubmitting(true);
      try {
        const data = await loginAPI(email, password);
        login({
          name: data.fullName || data.email || STUDENT.name,
          email: data.email || email,
          token: data.token,
          refreshToken: data.refreshToken,
          role: data.role,
          schoolId: data.schoolId || "fptu",
        });
        onSuccess?.();
        router.push(redirectTo ?? "/");
      } catch (error) {
        const err = error as Error;
        setErrors({ ...er, password: err.message });
      } finally {
        setIsSubmitting(false);
      }
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      <SocialAuth
        verb="Đăng nhập"
        redirectTo={redirectTo}
        onSuccess={onSuccess}
      />
      <div className="space-y-4">
        <TextField
          label="Email"
          required
          type="email"
          value={email}
          onChange={(v) => setEmail(v)}
          placeholder="Nhập email"
          error={errors.email}
          autoComplete="email"
        />
        <PasswordField
          label="Mật khẩu"
          required
          value={password}
          onChange={(v) => setPassword(v)}
          placeholder="Nhập mật khẩu"
          error={errors.password}
          rightSlot={
            <Link
              href="/quen-mat-khau"
              className="text-[13px] font-medium text-ink-2 transition-colors hover:text-orange"
            >
              Quên mật khẩu?
            </Link>
          }
        />
        <Captcha
          checked={captcha}
          onChange={setCaptcha}
          error={errors.captcha}
        />
        <SubmitButton disabled={isSubmitting}>
          {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập bằng mật khẩu"}
        </SubmitButton>
      </div>
    </form>
  );
}
