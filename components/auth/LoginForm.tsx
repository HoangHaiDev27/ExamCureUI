"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SocialAuth } from "./SocialAuth";
import { Captcha } from "./Captcha";
import { TextField, PasswordField, SubmitButton } from "./Fields";
import { login } from "@/lib/auth";
import { STUDENT } from "@/lib/student";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captcha, setCaptcha] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; captcha?: boolean }>({});

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const er: typeof errors = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) er.email = "Email không hợp lệ";
    if (password.length < 1) er.password = "Vui lòng nhập mật khẩu";
    if (!captcha) er.captcha = true;
    setErrors(er);
    if (Object.keys(er).length === 0) {
      login({ name: STUDENT.name, email });
      router.push("/dashboard");
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      <SocialAuth verb="Đăng nhập" />
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
            <Link href="/quen-mat-khau" className="text-[13px] font-medium text-ink-2 transition-colors hover:text-orange">
              Quên mật khẩu?
            </Link>
          }
        />
        <Captcha checked={captcha} onChange={setCaptcha} error={errors.captcha} />
        <SubmitButton>Đăng nhập bằng mật khẩu</SubmitButton>
      </div>
    </form>
  );
}
