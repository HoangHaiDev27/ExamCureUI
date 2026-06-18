import Link from "next/link";
import { Logo } from "./Logo";

const COLS = [
  {
    title: "Nền tảng",
    links: [
      { label: "Chọn trường", href: "/schools" },
      { label: "Theo môn học", href: "/schools" },
      { label: "Diễn đàn", href: "/dien-dan" },
      { label: "Hướng dẫn", href: "/#huong-dan" },
    ],
  },
  {
    title: "Trường nổi bật",
    links: [
      { label: "Đại học FPT", href: "/schools/fptu/subjects" },
      { label: "Bách khoa Hà Nội", href: "/schools/hust/subjects" },
      { label: "Kinh tế Quốc dân", href: "/schools/neu/subjects" },
      { label: "Ngoại thương", href: "/schools/ftu/subjects" },
    ],
  },
  {
    title: "Hỗ trợ",
    links: [
      { label: "Câu hỏi thường gặp", href: "/#faq" },
      { label: "Điều khoản sử dụng", href: "#" },
      { label: "Chính sách bảo mật", href: "#" },
      { label: "Liên hệ", href: "#" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-[#0a4f93] text-white">
      <div className="mx-auto max-w-[1240px] px-5 py-12 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="max-w-xs">
            <Logo size={100} href={null} mono />
            <p className="mt-4 text-[14px] leading-relaxed text-white/85">
              Luyện thi giữa kỳ &amp; cuối kỳ trên giao diện mô phỏng đúng phần
              mềm thi của trường bạn — quen tay trước khi vào phòng thi thật.
            </p>
          </div>
          {COLS.map((col) => (
            <div key={col.title}>
              <h4 className="text-[13px] font-semibold uppercase tracking-wide text-white/70">
                {col.title}
              </h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-[14px] text-white/85 transition-colors hover:text-white"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/20 pt-6 text-[13px] text-white/80 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 ExamCure. Sản phẩm mô phỏng phục vụ mục đích luyện tập.</p>
          <p>
            Không liên kết chính thức với các trường — tên &amp; nhận diện chỉ
            dùng để mô phỏng giao diện thi.
          </p>
        </div>
      </div>
    </footer>
  );
}
