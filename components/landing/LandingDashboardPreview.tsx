import {
  Bookmark,
  CheckCircle2,
  ChevronRight,
  Clock3,
  RotateCcw,
} from "lucide-react";
import { LandingGauge } from "./LandingGauge";

export function LandingDashboardPreview() {
  return (
    <div
      className="mx-auto w-full max-w-[880px] rounded-3xl bg-[#f5f2ee] p-4 sm:p-6"
      aria-hidden="true"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        <article className="rounded-2xl bg-white p-5">
          <div className="flex items-center justify-between gap-3 text-[13px]">
            <span className="font-semibold text-[#ef4d23]">Kết quả gần nhất</span>
            <span className="font-mono text-[11px] text-neutral-500">CSD201</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <strong className="text-[28px] font-semibold leading-none text-neutral-950">8.4</strong>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
              +1.2 điểm
            </span>
          </div>
          <p className="mt-1 text-[11px] text-neutral-500">Hôm nay, 09:42</p>
          <p className="mt-4 text-center text-[12px] font-medium text-neutral-700">
            Mục tiêu 8.0 đã đạt
          </p>
          <LandingGauge value={84} color="#ef4d23" showLabels min="0 điểm" max="10 điểm" />
          <div className="mt-3 flex rounded-full bg-neutral-100 p-1 text-[11px] font-medium">
            <span className="flex-1 rounded-full bg-white px-2 py-1.5 text-center text-neutral-900 shadow-sm">
              Điểm số
            </span>
            <span className="flex-1 px-2 py-1.5 text-center text-neutral-500">
              Lịch sử thi
            </span>
          </div>
        </article>

        <article className="flex flex-col rounded-2xl bg-white p-5">
          <div className="flex items-center justify-between gap-3 text-[13px]">
            <span className="font-semibold text-[#ef4d23]">Bài đang làm</span>
            <span className="text-neutral-500">FPTU</span>
          </div>

          <div className="mt-4">
            <span className="rounded-md bg-[#fff0e9] px-2 py-1 font-mono text-[10.5px] font-semibold text-[#c9421f]">
              CSD201
            </span>
            <h2 className="mt-2 text-[16px] font-semibold leading-snug text-neutral-950">
              Cấu trúc dữ liệu &amp; giải thuật
            </h2>
            <p className="mt-1 text-[11px] text-neutral-500">Đề luyện số 04 · 40 câu</p>
          </div>

          <div className="mt-5 rounded-xl bg-neutral-50 p-3.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-neutral-600">Tiến độ bài làm</span>
              <strong className="text-neutral-900">12 / 40 câu</strong>
            </div>
            <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-neutral-200">
              <div className="h-full w-[30%] rounded-full bg-[#ef4d23]" />
            </div>
            <div className="mt-3 flex items-center gap-3 text-[10.5px] text-neutral-500">
              <span className="inline-flex items-center gap-1">
                <Clock3 className="h-3 w-3" /> 44:58 còn lại
              </span>
              <span className="inline-flex items-center gap-1">
                <Bookmark className="h-3 w-3" /> 3 câu đánh dấu
              </span>
            </div>
          </div>

          <div className="mt-auto flex items-center justify-between pt-4 text-[11.5px] font-semibold">
            <span className="text-neutral-500">Tiếp tục từ câu 13</span>
            <span className="inline-flex items-center gap-1 rounded-lg bg-[#ef4d23] px-3 py-2 text-white">
              Làm tiếp <ChevronRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </article>

        <article className="rounded-2xl bg-white p-5">
          <div className="flex items-center justify-between gap-3 text-[13px]">
            <span className="font-semibold text-[#ef4d23]">Thẻ ghi nhớ</span>
            <span className="font-mono text-[11px] text-neutral-500">PRO192</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <strong className="text-[28px] font-semibold leading-none text-neutral-950">18</strong>
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
              / 24 thẻ
            </span>
          </div>
          <p className="mt-1 text-[11px] text-neutral-500">Java — phần mình hay nhầm</p>
          <p className="mt-4 text-center text-[12px] font-medium text-neutral-700">
            Đã thuộc trong lượt này
          </p>
          <LandingGauge value={75} color="#9ca3af" />
          <div className="mt-3 flex rounded-full bg-neutral-100 p-1 text-[11px] font-medium">
            <span className="inline-flex flex-1 items-center justify-center gap-1 rounded-full bg-white px-2 py-1.5 text-neutral-900 shadow-sm">
              <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Đã thuộc
            </span>
            <span className="inline-flex flex-1 items-center justify-center gap-1 px-2 py-1.5 text-neutral-500">
              <RotateCcw className="h-3 w-3" /> Học lại
            </span>
          </div>
        </article>
      </div>
    </div>
  );
}
