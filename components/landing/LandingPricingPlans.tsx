"use client";

import { Check, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useAuthModal, type AuthModalMode } from "@/components/auth/AuthModalProvider";

type BillingCycle = "monthly" | "semester";

type Plan = {
  name: string;
  description: string;
  monthlyPrice: string;
  semesterPrice: string;
  semesterNote: string;
  features: string[];
  cta: string;
  authMode: AuthModalMode;
  featured?: boolean;
};

const PLANS: Plan[] = [
  {
    name: "Học thử",
    description: "Làm quen cách thi trước khi chọn gói.",
    monthlyPrice: "0đ",
    semesterPrice: "0đ",
    semesterNote: "Dùng không giới hạn thời gian",
    features: [
      "3 đề thi mỗi tháng",
      "Tài liệu cơ bản theo môn",
      "1 bộ thẻ do bạn tự tạo",
      "Lưu lịch sử trong 7 ngày",
    ],
    cta: "Học thử miễn phí",
    authMode: "login",
  },
  {
    name: "Theo môn",
    description: "Tập trung ôn sâu một học phần.",
    monthlyPrice: "29.000đ",
    semesterPrice: "149.000đ",
    semesterNote: "Tương đương 24.800đ / tháng",
    features: [
      "Không giới hạn đề của 1 môn",
      "Lời giải chi tiết sau mỗi bài",
      "Toàn bộ tài liệu và thẻ của môn",
      "Lịch sử thi và sổ tay câu sai",
    ],
    cta: "Chọn một môn",
    authMode: "register",
    featured: true,
  },
  {
    name: "Toàn bộ FPTU",
    description: "Ôn nhiều môn trong cùng một học kỳ.",
    monthlyPrice: "59.000đ",
    semesterPrice: "299.000đ",
    semesterNote: "Tương đương 49.800đ / tháng",
    features: [
      "Không giới hạn đề của mọi môn FPTU",
      "Toàn bộ lời giải và tài liệu",
      "Kho thẻ hệ thống và thẻ cá nhân",
      "Theo dõi tiến độ trên toàn học kỳ",
    ],
    cta: "Mở toàn bộ môn",
    authMode: "register",
  },
];

export function LandingPricingPlans() {
  const [billing, setBilling] = useState<BillingCycle>("semester");
  const { openAuth } = useAuthModal();

  return (
    <>
      <div
        className="mx-auto mt-6 flex w-fit rounded-full border border-white/70 bg-white/85 p-1 shadow-sm"
        role="group"
        aria-label="Chu kỳ thanh toán"
      >
        <button
          type="button"
          onClick={() => setBilling("monthly")}
          aria-pressed={billing === "monthly"}
          className={`rounded-full px-4 py-2 text-[12.5px] font-semibold ${
            billing === "monthly"
              ? "bg-[#0b0f1a] text-white"
              : "text-neutral-600"
          }`}
        >
          Theo tháng
        </button>
        <button
          type="button"
          onClick={() => setBilling("semester")}
          aria-pressed={billing === "semester"}
          className={`rounded-full px-4 py-2 text-[12.5px] font-semibold ${
            billing === "semester"
              ? "bg-[#0b0f1a] text-white"
              : "text-neutral-600"
          }`}
        >
          Theo học kỳ
          <span className="ml-2 text-[10px] text-[#ef4d23]">Tiết kiệm 15%</span>
        </button>
      </div>

      <div className="mt-7 grid gap-4 md:grid-cols-3">
        {PLANS.map((plan) => {
          const price =
            billing === "monthly" ? plan.monthlyPrice : plan.semesterPrice;
          const period =
            plan.name === "Học thử"
              ? ""
              : billing === "monthly"
                ? "/ tháng"
                : "/ học kỳ";
          return (
            <article
              key={plan.name}
              className={`relative flex min-h-[410px] flex-col rounded-[22px] border bg-white p-5 shadow-[0_12px_35px_rgba(31,28,25,0.08)] sm:p-6 ${
                plan.featured
                  ? "border-[#ef4d23] ring-1 ring-[#ef4d23]"
                  : "border-white/80"
              }`}
            >
              {plan.featured && (
                <span className="absolute right-5 top-5 rounded-full bg-[#fff0e9] px-2.5 py-1 text-[10.5px] font-semibold text-[#c9421f]">
                  Phù hợp nhất
                </span>
              )}

              <p className="text-[15px] font-semibold text-neutral-950">
                {plan.name}
              </p>
              <p className="mt-2 min-h-10 text-[12.5px] leading-relaxed text-neutral-600">
                {plan.description}
              </p>

              <div className="mt-5 flex items-end gap-1.5">
                <strong className="text-[31px] font-semibold tracking-[-0.035em] text-neutral-950">
                  {price}
                </strong>
                {period && (
                  <span className="pb-1 text-[11.5px] text-neutral-500">
                    {period}
                  </span>
                )}
              </div>
              <p className="mt-1 min-h-5 text-[10.5px] text-neutral-500">
                {billing === "semester"
                  ? plan.semesterNote
                  : plan.name === "Học thử"
                    ? "Không cần thẻ thanh toán"
                    : "Thanh toán từng tháng"}
              </p>

              <div className="my-5 h-px bg-neutral-100" />

              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2.5 text-[12.5px] leading-relaxed text-neutral-700"
                  >
                    <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-[#fff0e9] text-[#d84f21]">
                      <Check className="h-2.5 w-2.5" strokeWidth={3} />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => openAuth(plan.authMode)}
                className={`mt-auto flex items-center justify-between rounded-full py-2 pl-4 pr-2 text-[12.5px] font-semibold ${
                  plan.featured
                    ? "bg-[#ef4d23] text-white"
                    : "bg-[#0b0f1a] text-white"
                }`}
              >
                {plan.cta}
                <span className="grid h-7 w-7 place-items-center rounded-full bg-white/15">
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </span>
              </button>
            </article>
          );
        })}
      </div>
    </>
  );
}
