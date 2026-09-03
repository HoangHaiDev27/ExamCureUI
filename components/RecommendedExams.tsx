"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getSchool } from "@/lib/schools";
import { getSubject } from "@/lib/subjects";
import { RecommendedCarousel, type RecItem } from "./RecommendedCarousel";
import { useAuth } from "@/lib/auth";

/** Đề thi gợi ý — curated, mỗi đề một lý do đề xuất. */
const RECOMMENDED = [
  { schoolId: "fptu", subjectId: "fptu-pro192", reason: "Được luyện nhiều nhất tuần này" },
  { schoolId: "hust", subjectId: "hust-mae101", reason: "Sát đề thi cuối kỳ học phần" },
  { schoolId: "neu", subjectId: "neu-eco111", reason: "Phù hợp khối ngành Kinh tế" },
  { schoolId: "fptu", subjectId: "fptu-csd201", reason: "Rèn tư duy thuật toán" },
  { schoolId: "ftu", subjectId: "ftu-eco112", reason: "Đề mới cập nhật tuần này" },
  { schoolId: "hcmut", subjectId: "hcmut-mas291", reason: "Ôn xác suất thống kê" },
  { schoolId: "neu", subjectId: "neu-acc101", reason: "Nền tảng kế toán cần nắm chắc" },
  { schoolId: "fptu", subjectId: "fptu-dbi202", reason: "Cơ sở dữ liệu cho kỳ tới" },
];

export function RecommendedExams() {
  const user = useAuth();
  const schoolId = user?.schoolId || "fptu";

  // Lọc chỉ hiển thị đề thi của trường người dùng đang chọn
  const filtered = RECOMMENDED.filter((r) => r.schoolId === schoolId);

  const items: RecItem[] = filtered.map((r) => ({
    reason: r.reason,
    school: getSchool(r.schoolId),
    subject: getSubject(r.schoolId, r.subjectId),
  }))
    .filter((x): x is RecItem => Boolean(x.school && x.subject));

  return (
    <section id="tinh-nang" className="scroll-mt-6 bg-paper">
      <div className="mx-auto max-w-[1240px] px-5 py-16 lg:px-8 lg:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-[13px] font-semibold uppercase tracking-wide text-orange">
              Đề xuất cho bạn
            </p>
            <h2 className="mt-2 font-display text-[30px] font-semibold leading-tight text-ink sm:text-[38px]">
              Đề thi nên luyện tuần này
            </h2>
            <p className="mt-2 text-[16px] leading-relaxed text-ink-2">
              Gợi ý dựa trên trường bạn quan tâm và các học phần đang được luyện
              nhiều — vào thi thử ngay trên giao diện mô phỏng của từng trường.
            </p>
          </div>
          <Link
            href={`/schools/${schoolId}/subjects`}
            className="inline-flex items-center gap-1.5 text-[14px] font-medium text-orange transition-colors hover:text-orange-dark"
          >
            Xem tất cả đề <ArrowRight size={16} />
          </Link>
        </div>

        {items.length > 0 ? (
          <RecommendedCarousel items={items} />
        ) : (
          <p className="mt-8 text-center text-ink-3">Chưa có đề xuất thi thử nào cho trường này.</p>
        )}
      </div>
    </section>
  );
}
