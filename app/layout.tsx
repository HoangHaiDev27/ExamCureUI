import type { Metadata } from "next";
import {
  Be_Vietnam_Pro,
  Instrument_Serif,
  Inter,
  JetBrains_Mono,
  Lora,
} from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/auth/Providers";
import { AiChatbot } from "@/components/AiChatbot";

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
  style: ["normal", "italic"],
  display: "swap",
});

const landingSans = Inter({
  variable: "--font-landing-sans",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const landingSerif = Instrument_Serif({
  variable: "--font-landing-serif",
  subsets: ["latin", "latin-ext"],
  weight: "400",
  style: ["normal", "italic"],
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
      className={`${beVietnam.variable} ${lora.variable} ${landingSans.variable} ${landingSerif.variable} ${jetbrains.variable} h-full`}
    >
      <body className="min-h-full">
        <Providers>
          {children}
          <AiChatbot />
        </Providers>
      </body>
    </html>
  );
}
