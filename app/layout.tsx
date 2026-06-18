import type { Metadata } from "next";
import { Be_Vietnam_Pro, Lora, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const beVietnam = Be_Vietnam_Pro({
  variable: "--font-bvp",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin", "vietnamese"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-mono-code",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ExamCure — Mô phỏng đúng phần mềm thi của trường bạn",
  description:
    "Nền tảng thi thử online cho sinh viên đại học, mô phỏng chính xác phần mềm thi trên máy (CBT) của từng trường theo từng học phần.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="vi"
      className={`${beVietnam.variable} ${lora.variable} ${jetbrains.variable} h-full`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
