import type { Metadata } from "next";
import { LandingPricingPlans } from "@/components/landing/LandingPricingPlans";

export const metadata: Metadata = {
  title: "Pricing — ExamCure",
  description:
    "Các gói luyện thi ExamCure dành cho sinh viên Đại học FPT.",
};

export default function PricingPage() {
  return (
    <div className="mx-auto w-full max-w-[1080px] px-4 pb-10 pt-9 sm:pb-12 sm:pt-11">
      <div className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-[13px] font-medium text-neutral-700 shadow-sm">
          <span
            className="h-2 w-2 rounded-full bg-[#ef4d23]"
            aria-hidden="true"
          />
          Gói học tập ExamCure
        </span>

        <h1
          className="mx-auto mt-5 max-w-3xl font-sans text-neutral-950"
          style={{
            fontSize: "clamp(34px, 6vw, 56px)",
            lineHeight: 1.04,
            fontWeight: 500,
            letterSpacing: "-0.025em",
          }}
        >
          Chọn{" "}
          <span className="font-display font-medium italic">nhịp học</span>{" "}
          vừa đủ
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-[13.5px] leading-relaxed text-neutral-700 sm:text-[15px]">
          Bắt đầu miễn phí, sau đó mở đúng phạm vi môn học bạn cần.
          Có thể đổi gói vào học kỳ tiếp theo.
        </p>
      </div>

      <LandingPricingPlans />

      <p className="mt-5 text-center text-[11px] text-neutral-600">
        Mức giá đang dùng cho giao diện thử nghiệm và chưa phát sinh thanh toán.
      </p>
    </div>
  );
}
