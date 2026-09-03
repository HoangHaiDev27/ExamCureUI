import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { LandingDashboardPreview } from "./LandingDashboardPreview";

export function LandingHero() {
  return (
    <>
      <div className="flex flex-col items-center px-4 pb-8 pt-10 text-center sm:pb-12 sm:pt-16">
        <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-[13px] font-medium text-neutral-700 shadow-sm">
          <span className="h-2 w-2 rounded-full bg-[#ef4d23]" aria-hidden="true" />
          Mô phỏng phòng thi theo từng trường
        </span>

        <h1
          className="mt-5 max-w-4xl font-sans text-neutral-950 sm:mt-6"
          style={{
            fontSize: "clamp(36px, 8vw, 72px)",
            lineHeight: 1.05,
            fontWeight: 500,
            letterSpacing: "-0.02em",
          }}
        >
          Quen{" "}
          <span className="font-display font-medium italic">
            giao diện thi
          </span>
          <br />
          trước giờ thi thật
        </h1>

        <p
          className="mt-4 px-2 text-neutral-700 sm:mt-6"
          style={{ fontSize: "clamp(13px, 3.5vw, 16px)" }}
        >
          Chọn đúng trường, đúng học phần và luyện đề trong giao diện sát với hệ thống bạn sẽ dùng.
        </p>

        <Link
          href="/schools/fptu/subjects"
          className="mt-6 inline-flex items-center gap-3 rounded-full bg-[#0b0f1a] py-2 pl-6 pr-2 text-[14px] font-medium text-white sm:mt-8 sm:py-2.5 sm:pl-7"
        >
          Chọn môn để luyện
          <span className="grid h-6 w-6 place-items-center rounded-full bg-white/15 sm:h-7 sm:w-7">
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </span>
        </Link>
      </div>

      <div className="mt-auto px-3 sm:px-4">
        <LandingDashboardPreview />
      </div>
    </>
  );
}
