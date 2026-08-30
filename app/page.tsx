import {
  ArrowRight,
  Check,
  ChevronDown,
  Clock3,
  GraduationCap,
  MonitorCheck,
  PlayCircle,
  ShieldCheck,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { HeroExamPreview } from "@/components/HeroExamPreview";
import { RecommendedExams } from "@/components/RecommendedExams";
import { CommunityPreview } from "@/components/forum/CommunityPreview";
import { ButtonLink } from "@/components/Button";
import { LogoMarquee } from "@/components/LogoMarquee";
import { SCHOOLS } from "@/lib/schools";

const STEPS = [
  {
    n: "01",
    icon: GraduationCap,
    title: "Chọn trường của bạn",
    desc: "Tìm trường bạn đang học. Mỗi trường có một giao diện phòng thi mô phỏng đúng phần mềm trường đang dùng.",
  },
  {
    n: "02",
    icon: MonitorCheck,
    title: "Chọn học phần & đề",
    desc: "Lọc theo khoa, kỳ, độ khó. Mỗi học phần có nhiều đề với thời lượng và số câu sát đề thi thật.",
  },
  {
    n: "03",
    icon: PlayCircle,
    title: "Vào phòng thi mô phỏng",
    desc: "Đồng hồ đếm ngược, bảng câu hỏi, đánh dấu xem lại — quen tay trước khi bước vào phòng thi thật.",
  },
];

const REASONS = [
  "Đồng hồ đếm ngược và cảnh báo khi sắp hết giờ, đúng như phần mềm thi thật.",
  "Bảng câu hỏi mã màu: đã làm, đánh dấu xem lại, câu hiện tại.",
  "Hỗ trợ công thức toán và đoạn code cho các môn kỹ thuật.",
  "Chấm điểm tức thì kèm lời giải và phổ điểm so với thí sinh khác.",
];

const FAQ = [
  {
    q: "Giao diện phòng thi có giống phần mềm thi thật của trường không?",
    a: "Có. Mỗi trường được dựng một theme phòng thi riêng — màu thanh tiêu đề, bố cục và cách hiển thị câu hỏi mô phỏng theo phần mềm thi mà trường đang sử dụng, giúp bạn không bỡ ngỡ khi vào thi thật.",
  },
  {
    q: "Nền tảng này dành cho kỳ thi nào?",
    a: "Dành cho sinh viên đại học luyện thi giữa kỳ và cuối kỳ theo từng học phần. Không liên quan đến thi THPT hay đánh giá năng lực.",
  },
  {
    q: "Tôi có cần đăng ký tài khoản để thi thử không?",
    a: "Bạn có thể vào thi thử ngay. Đăng nhập giúp lưu lịch sử, theo dõi tiến bộ điểm số và nhận đề gợi ý phù hợp với trường của bạn.",
  },
  {
    q: "Trường tôi chưa có trên hệ thống thì sao?",
    a: "Danh sách trường liên tục được bổ sung. Bạn có thể chọn một trường có phần mềm thi tương tự để luyện tập trong khi chờ trường của bạn được thêm vào.",
  },
];

export default function LandingPage() {
  return (
    <>
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-line bg-paper">
        <div className="bg-dotgrid pointer-events-none absolute inset-0 opacity-50" />
        <div className="relative mx-auto grid max-w-[1240px] items-center gap-12 px-5 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:px-8 lg:py-20">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-paper-2 px-3.5 py-1.5 text-[13px] font-medium text-ink-2">
              <span className="inline-block h-2 w-2 rounded-full bg-orange" />
              Luyện thi trên máy · Mô phỏng
            </span>

            <h1 className="mt-5 font-display text-[40px] font-semibold leading-[1.1] tracking-tight text-ink sm:text-[52px]">
              Thi thử đúng như{" "}
              <span className="relative whitespace-nowrap text-orange">
                phần mềm thi
                <svg className="absolute -bottom-1 left-0 w-full" height="9" viewBox="0 0 200 9" preserveAspectRatio="none" fill="none">
                  <path d="M2 6.5C40 2.5 160 2 198 5.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </span>{" "}
              của trường bạn
            </h1>

            <p className="mt-5 max-w-lg text-[17px] leading-relaxed text-ink-2">
              Chọn trường → chọn học phần → vào phòng thi mô phỏng chính xác giao
              diện thi giữa kỳ, cuối kỳ. Làm quen từng chi tiết trước ngày thi thật.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <ButtonLink href="/schools/fptu/subjects" size="lg">
                Thi thử ngay <ArrowRight size={18} />
              </ButtonLink>
              <ButtonLink href="#huong-dan" variant="outline" size="lg">
                Xem cách hoạt động
              </ButtonLink>
            </div>

            <dl className="mt-9 flex flex-wrap gap-x-9 gap-y-3 border-t border-line pt-6">
              <Trust value="12+" label="trường đại học" />
              <Trust value="400+" label="học phần & đề" />
              <Trust value="38K" label="sinh viên luyện thi" />
            </dl>
          </div>

          <div className="lg:pl-4">
            <HeroExamPreview />
          </div>
        </div>
      </section>

      {/* LOGO STRIP — dải ngang, trượt liên tục, logo màu đầy đủ */}
      <section className="overflow-hidden border-b border-line bg-paper-2 py-9">
        <p className="mx-auto max-w-[1240px] px-5 text-center text-[13px] font-medium uppercase tracking-wide text-ink-3 lg:px-8">
          Đang mô phỏng phần mềm thi của
        </p>
        <div className="mt-6">
          <LogoMarquee />
        </div>
      </section>

      {/* RECOMMENDED EXAMS */}
      <RecommendedExams />

      {/* WHY IT FEELS REAL */}
      <section className="border-y border-line bg-paper-2">
        <div className="mx-auto grid max-w-[1240px] items-center gap-12 px-5 py-16 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-20">
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-wide text-orange">Vì sao giống thật</p>
            <h2 className="mt-2 font-display text-[30px] font-semibold leading-tight text-ink sm:text-[38px]">
              Mỗi trường, một giao diện thi riêng
            </h2>
            <p className="mt-3 text-[16px] leading-relaxed text-ink-2">
              Chúng tôi không dùng một mẫu chung. Thanh tiêu đề, bố cục câu hỏi và
              bảng điều hướng được dựng theo nhận diện phần mềm thi của từng trường.
            </p>
            <ul className="mt-6 space-y-3.5">
              {REASONS.map((r) => (
                <li key={r} className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-green-soft">
                    <Check size={13} className="text-green" strokeWidth={3} />
                  </span>
                  <span className="text-[15px] leading-relaxed text-ink">{r}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Per-school header demo */}
          <div className="rounded-[12px] border border-line bg-paper p-5 shadow-[var(--shadow-1)]">
            <p className="mb-4 flex items-center gap-2 text-[13px] font-medium text-ink-2">
              <ShieldCheck size={16} className="text-blue" />
              Thanh tiêu đề phòng thi theo từng trường
            </p>
            <div className="space-y-3">
              {SCHOOLS.slice(0, 4).map((s, i) => (
                <div
                  key={s.id}
                  className="flex items-center gap-2.5 overflow-hidden rounded-[8px] px-3 py-2.5 shadow-[var(--shadow-1)]"
                  style={{ background: s.theme.brand, color: s.theme.onBrand }}
                >
                  <span className="grid h-7 w-7 place-items-center rounded-[6px] bg-white/15 text-[10px] font-semibold">
                    {s.abbr.slice(0, 3)}
                  </span>
                  <div className="min-w-0 leading-tight">
                    <p className="truncate text-[12.5px] font-semibold">{s.theme.systemName}</p>
                    <p className="truncate text-[10.5px] opacity-80">{s.abbr}</p>
                  </div>
                  <div className="ml-auto flex items-center gap-1.5 rounded-[5px] bg-black/20 px-2 py-1">
                    <Clock3 size={12} />
                    <span className="tnum text-[12px] font-semibold">59:0{i}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="huong-dan" className="scroll-mt-20 bg-paper">
        <div className="mx-auto max-w-[1240px] px-5 py-16 lg:px-8 lg:py-20">
        <div className="max-w-2xl">
          <p className="text-[13px] font-semibold uppercase tracking-wide text-orange">Cách hoạt động</p>
          <h2 className="mt-2 font-display text-[30px] font-semibold leading-tight text-ink sm:text-[38px]">
            Ba bước để bước vào phòng thi
          </h2>
        </div>

        <div className="relative mt-12 grid gap-10 md:grid-cols-3 md:gap-6">
          {/* connecting line */}
          <div className="pointer-events-none absolute left-0 right-0 top-7 hidden h-px bg-line md:block" />
          {STEPS.map((s) => (
            <div key={s.n} className="relative">
              <div className="flex items-center gap-4">
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-[10px] border border-line bg-paper shadow-[var(--shadow-1)]">
                  <s.icon size={24} className="text-orange" />
                </span>
                <span className="font-display text-[40px] font-semibold leading-none text-paper-3">
                  {s.n}
                </span>
              </div>
              <h3 className="mt-5 text-[18px] font-semibold text-ink">{s.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{s.desc}</p>
            </div>
          ))}
        </div>
        </div>
      </section>

      {/* COMMUNITY — FEED + CHAT PREVIEW */}
      <section id="cong-dong" className="scroll-mt-20 bg-paper-2">
        <div className="mx-auto max-w-[1240px] px-5 py-16 lg:px-8 lg:py-20">
          <div className="max-w-2xl">
            <p className="text-[13px] font-semibold uppercase tracking-wide text-orange">
              Cộng đồng
            </p>
            <h2 className="mt-2 font-display text-[30px] font-semibold leading-tight text-ink sm:text-[38px]">
              Chia sẻ kiến thức
            </h2>
            <p className="mt-3 text-[16px] leading-relaxed text-ink-2">
              Đăng bài kèm hashtag, thảo luận và trò chuyện trực tiếp với cộng đồng
              sinh viên trên cùng một nơi.
            </p>
          </div>

          <div className="mt-7">
            <CommunityPreview />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-20 bg-paper">
        <div className="mx-auto max-w-[820px] px-5 py-16 lg:py-20">
        <div className="max-w-2xl">
          <p className="text-[13px] font-semibold uppercase tracking-wide text-orange">Câu hỏi thường gặp</p>
          <h2 className="mt-2 font-display text-[30px] font-semibold leading-tight text-ink sm:text-[36px]">
            Những điều bạn có thể thắc mắc
          </h2>
        </div>
        <div className="mt-8 divide-y divide-line overflow-hidden rounded-[10px] border border-line bg-paper">
          {FAQ.map((f) => (
            <details key={f.q} className="group">
              <summary className="flex cursor-pointer list-none items-center gap-4 px-5 py-4 text-[15.5px] font-medium text-ink transition-colors hover:bg-paper-2">
                {f.q}
                <ChevronDown size={18} className="ml-auto shrink-0 text-ink-3 transition-transform group-open:rotate-180" />
              </summary>
              <p className="px-5 pb-5 text-[14.5px] leading-relaxed text-ink-2">{f.a}</p>
            </details>
          ))}
        </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}

function Trust({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <dt className="tnum font-display text-[26px] font-semibold leading-none text-ink">{value}</dt>
      <dd className="mt-1 text-[13px] text-ink-2">{label}</dd>
    </div>
  );
}
