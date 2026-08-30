"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  BookOpen,
  FileCheck2,
  History,
  LayoutDashboard,
  Play,
  Target,
  TrendingUp,
  Trophy,
  FileText,
  Layers,
  HelpCircle,
  CheckCircle2,
  XCircle,
  RotateCw,
  ArrowLeft,
  Download,
  Eye,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { getSchool } from "@/lib/schools";
import { getSubjects } from "@/lib/subjects";
import type { Subject } from "@/lib/types";
import { SchoolMark } from "@/components/SchoolMark";
import { Logo } from "@/components/Logo";
import { STUDENT, mssvFor } from "@/lib/student";
import { classify, TONE_COLOR } from "@/lib/grade";
import { useAuth, initials } from "@/lib/auth";

const NAV_GROUPS = [
  {
    title: "Tổng quan",
    items: [
      { id: "tong-quan", label: "Bảng điều khiển", icon: LayoutDashboard },
      { id: "mon-hoc", label: "Môn học của tôi", icon: BookOpen }
    ]
  },
  {
    title: "Ôn tập",
    items: [
      { id: "tai-lieu", label: "Đọc tài liệu", icon: FileText },
      { id: "flashcards", label: "Thẻ ghi nhớ (Quizlet)", icon: Layers },
      { id: "trac-nghiem", label: "Luyện câu hỏi nhanh", icon: HelpCircle },
      { id: "so-tay-sai", label: "Sổ tay sửa sai", icon: BookOpen }
    ]
  },
  {
    title: "Thi thử",
    items: [
      { id: "de-thi", label: "Đề thi gợi ý", icon: FileCheck2 },
      { id: "lich-su", label: "Lịch sử thi", icon: History },
      { id: "thong-ke", label: "Thống kê & Tiến độ", icon: BarChart3 }
    ]
  }
];

const TREND = [6.2, 6.6, 6.4, 7.3, 7.0, 7.7, 8.1, 8.4];

const CHAPTERS_DATA: Record<string, { title: string; slides: string[] }[]> = {
  default: [
    {
      title: "Chương 1: Tổng quan & Giới thiệu chung",
      slides: [
        "Slide 1: Khái niệm cơ bản và vai trò của học phần trong chuyên ngành.",
        "Slide 2: Các nội dung cốt lõi và lộ trình ôn luyện thi thử hiệu quả.",
        "Slide 3: Các tài liệu tham khảo chính thức và cấu trúc đề thi cuối kỳ."
      ]
    },
    {
      title: "Chương 2: Các nguyên lý nền tảng cốt lõi",
      slides: [
        "Slide 1: Định nghĩa chi tiết các thành phần chính và sơ đồ hệ thống.",
        "Slide 2: Ví dụ thực tế minh họa phương pháp triển khai và phân tích.",
        "Slide 3: Bài tập tự luyện nhanh và câu hỏi thảo luận ôn thi."
      ]
    },
    {
      title: "Chương 3: Quy trình nâng cao và thực tiễn",
      slides: [
        "Slide 1: Phân tích các trường hợp đặc biệt và tối ưu hóa hiệu suất.",
        "Slide 2: Phương pháp phát hiện lỗi sai thường gặp khi làm bài thi.",
        "Slide 3: Tổng kết chương và các mẹo ghi nhớ nhanh."
      ]
    }
  ],
  "csd201": [
    {
      title: "Chương 1: Độ phức tạp thuật toán (Big-O)",
      slides: [
        "Slide 1: Khái niệm độ phức tạp thời gian T(n) và độ phức tạp không gian S(n). Định nghĩa Big-O, Big-Omega, Big-Theta.",
        "Slide 2: Quy tắc cộng, quy tắc nhân khi phân tích thuật toán. Phân tích vòng lặp đơn, vòng lặp lồng nhau.",
        "Slide 3: Ví dụ thực tế: Thuật toán tìm kiếm nhị phân có độ phức tạp O(log n), Bubble Sort có O(n^2)."
      ]
    },
    {
      title: "Chương 2: Danh sách liên kết (Linked List)",
      slides: [
        "Slide 1: Cấu trúc của một Node (Data & Pointer). Sự khác nhau giữa mảng tĩnh và danh sách liên kết.",
        "Slide 2: Danh sách liên kết đơn (Singly Linked List), danh sách liên kết đôi (Doubly Linked List). Thao tác thêm/xóa ở đầu, cuối và vị trí bất kỳ.",
        "Slide 3: Thuật toán đảo ngược danh sách liên kết đơn và tìm điểm giữa (thuật toán rùa và thỏ)."
      ]
    },
    {
      title: "Chương 3: Ngăn xếp (Stack) & Hàng đợi (Queue)",
      slides: [
        "Slide 1: Khái niệm Stack (LIFO - Last In First Out). Các hàm cơ bản: push(), pop(), peek(), isEmpty().",
        "Slide 2: Khái niệm Queue (FIFO - First In First Out). Các hàm cơ bản: enqueue(), dequeue(). Khái niệm hàng đợi vòng (Circular Queue).",
        "Slide 3: Ứng dụng thực tế: Tính toán biểu thức Ba Lan (Postfix), thuật toán DFS (sử dụng Stack) và BFS (sử dụng Queue)."
      ]
    },
    {
      title: "Chương 4: Cây nhị phân tìm kiếm (BST)",
      slides: [
        "Slide 1: Định nghĩa Cây nhị phân và Cây nhị phân tìm kiếm (BST). Tính chất: con trái nhỏ hơn cha, con phải lớn hơn cha.",
        "Slide 2: Các phương pháp duyệt cây: Tiền thứ tự (Pre-order), Trung thứ tự (In-order -> cho dãy tăng), Hậu thứ tự (Post-order).",
        "Slide 3: Thao tác tìm kiếm, thêm mới và xóa nút trên BST (xử lý 3 trường hợp xóa nút: nút lá, nút có 1 con, nút có 2 con)."
      ]
    }
  ],
  "dbi202": [
    {
      title: "Chương 1: Mô hình cơ sở dữ liệu quan hệ (Relational Model)",
      slides: [
        "Slide 1: Khái niệm thực thể (Entity), thuộc tính (Attribute), quan hệ (Relationship). Sơ đồ thực thể liên kết ERD.",
        "Slide 2: Khóa chính (Primary Key), khóa ngoại (Foreign Key). Các ràng buộc toàn vẹn dữ liệu.",
        "Slide 3: Chuyển đổi từ sơ đồ ERD sang lược đồ quan hệ các bảng."
      ]
    },
    {
      title: "Chương 2: Ngôn ngữ truy vấn SQL căn bản",
      slides: [
        "Slide 1: Cấu trúc câu lệnh SELECT, WHERE, ORDER BY. Các phép toán so sánh và logic.",
        "Slide 2: Phép toán kết bảng (JOIN): INNER JOIN, LEFT JOIN, RIGHT JOIN, FULL OUTER JOIN.",
        "Slide 3: Các hàm gộp nhóm dữ liệu: SUM, AVG, COUNT, MIN, MAX đi kèm câu lệnh GROUP BY và HAVING."
      ]
    },
    {
      title: "Chương 3: Truy vấn con (Subquery) & Gom nhóm",
      slides: [
        "Slide 1: Định nghĩa Subquery. Phân loại truy vấn con độc lập (Self-contained) và truy vấn con tương quan (Correlated).",
        "Slide 2: Sử dụng các toán tử EXISTS, IN, ANY, ALL kết hợp với truy vấn con.",
        "Slide 3: Các biểu thức bảng phổ biến (CTE - Common Table Expressions) dùng với lệnh WITH."
      ]
    }
  ],
  "pro192": [
    {
      title: "Chương 1: Các nguyên lý cơ bản của OOP",
      slides: [
        "Slide 1: Định nghĩa Lập trình hướng đối tượng (OOP). Bốn tính chất cốt lõi: Đóng gói (Encapsulation), Kế thừa (Inheritance), Đa hình (Polymorphism), Trừu tượng (Abstraction).",
        "Slide 2: Khái niệm Lớp (Class) và Đối tượng (Object). Cách khai báo thuộc tính và phương thức trong Java.",
        "Slide 3: Hàm khởi tạo (Constructor) - Default constructor và Parameterized constructor. Từ khóa 'this'."
      ]
    },
    {
      title: "Chương 2: Tính kế thừa (Inheritance) & Đa hình (Polymorphism)",
      slides: [
        "Slide 1: Từ khóa 'extends' trong Java. Kế thừa đơn và tại sao Java không hỗ trợ đa kế thừa trực tiếp.",
        "Slide 2: Cơ chế nạp chồng phương thức (Method Overloading) và ghi đè phương thức (Method Overriding). Từ khóa 'super'.",
        "Slide 3: Ép kiểu đối tượng (Upcasting & Downcasting). Liên kết động (Dynamic binding) khi chạy chương trình."
      ]
    }
  ]
};

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("tong-quan");
  const user = useAuth();
  const schoolId = user?.schoolId || "fptu";
  const home = getSchool(schoolId)!;
  const mssv = user ? (user.email?.split("@")[0].toUpperCase() || mssvFor(schoolId)) : mssvFor(schoolId);
  const suggested = getSubjects(schoolId).slice(0, 5);

  const studentName = user?.name || STUDENT.name;
  const studentShortName = user ? (user.name.trim().split(/\s+/).pop() || "Bạn") : STUDENT.shortName;

  const subjects = getSubjects(schoolId);
  const history = [
    { code: subjects[0]?.code || "CSD201", name: subjects[0]?.name || "Cấu trúc dữ liệu", score: 8.4, when: "Hôm nay, 09:42" },
    { code: subjects[1]?.code || "DBI202", name: subjects[1]?.name || "Cơ sở dữ liệu", score: 7.8, when: "Hôm qua, 20:15" },
    { code: subjects[2]?.code || "PRO192", name: subjects[2]?.name || "Lập trình hướng đối tượng", score: 9.0, when: "3 ngày trước" },
    { code: subjects[3]?.code || "MAS291", name: subjects[3]?.name || "Xác suất thống kê", score: 7.2, when: "5 ngày trước" },
  ];

  // States cho Flashcards
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knowCount, setKnowCount] = useState(0);
  const [dontKnowCount, setDontKnowCount] = useState(0);

  // States cho Luyện câu hỏi nhanh (Quick Quiz)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizChecked, setQuizChecked] = useState(false);

  // States cho Môn học của tôi tab
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFaculty, setSelectedFaculty] = useState<string | null>(null);
  const [selectedSubjectForDocs, setSelectedSubjectForDocs] = useState<Subject | null>(null);
  const [previewingSlide, setPreviewingSlide] = useState<{ chapterTitle: string; slides: string[]; slideIndex: number } | null>(null);

  const faculties = Array.from(new Set(subjects.map((s) => s.faculty)));
  const filteredSubjects = subjects.filter((s) => {
    if (selectedFaculty && s.faculty !== selectedFaculty) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      return s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q);
    }
    return true;
  });

  // Mock tài liệu học tập theo từng trường
  const docsList = [
    { name: `Giáo trình lý thuyết ${subjects[0]?.name || "Cấu trúc dữ liệu"}`, code: subjects[0]?.code || "CSD201", type: "PDF", size: "4.8 MB", reads: "1.2k lượt đọc" },
    { name: `Slide bài giảng Slide Chapter 3 - ${subjects[1]?.name || "Cơ sở dữ liệu"}`, code: subjects[1]?.code || "DBI202", type: "PPTX", size: "2.1 MB", reads: "850 lượt đọc" },
    { name: `Công thức & Tóm tắt kiến thức ${subjects[2]?.name || "Giải tích 1"}`, code: subjects[2]?.code || "MAE101", type: "PDF", size: "1.5 MB", reads: "2.3k lượt đọc" },
    { name: `Ngân hàng câu hỏi trắc nghiệm tự luyện ${subjects[3]?.name || "Kinh tế vi mô"}`, code: subjects[3]?.code || "ECO111", type: "DOCX", size: "1.1 MB", reads: "940 lượt đọc" },
  ];

  // Flashcards danh sách mẫu
  const sampleFlashcards = [
    { front: "Trường hợp xấu nhất của thuật toán sắp xếp nhanh (QuickSort) có độ phức tạp là bao nhiêu?", back: "O(n^2) - xảy ra khi phần tử chốt luôn là phần tử cực đại hoặc cực tiểu (mảng đã sắp xếp sẵn)." },
    { front: "Nguyên lý FIFO (First In First Out) tương ứng với cấu trúc dữ liệu nào?", back: "Queue (Hàng đợi) - phần tử vào trước sẽ được xử lý và lấy ra trước." },
    { front: "Độ phức tạp trung bình của thao tác tìm kiếm, chèn, xóa trên bảng băm (Hash Table) là gì?", back: "O(1) - thời gian hằng số nhờ hàm băm phân bổ đều các khóa." },
    { front: "Duyệt cây nhị phân tìm kiếm (BST) theo thứ tự nào sẽ cho dãy khóa có thứ tự tăng dần?", back: "In-order traversal (Duyệt trung thứ tự: Trái -> Gốc -> Phải)." },
    { front: "Độ phức tạp bộ nhớ (Space Complexity) của thuật toán sắp xếp trộn (MergeSort) là gì?", back: "O(n) - do cần mảng phụ có cùng kích thước để trộn các mảng con." }
  ];

  // Câu hỏi trắc nghiệm nhanh mẫu
  const quizQuestion = {
    q: "Cho cây nhị phân tìm kiếm (BST). Phát biểu nào sau đây là ĐÚNG nhất về tính chất của cây?",
    options: [
      "Phần tử có giá trị khóa nhỏ nhất luôn nằm ở nút gốc của cây.",
      "Mọi nút con bên trái luôn có giá trị khóa nhỏ hơn nút cha, và mọi nút con bên phải luôn có giá trị khóa lớn hơn nút cha.",
      "Duyệt cây theo thứ tự trước (Pre-order) luôn cho ra một dãy tăng dần.",
      "Độ phức tạp của việc tìm kiếm một khóa trên BST luôn là O(log n) bất kể cây lệch hay cân bằng."
    ],
    correct: 1,
    explanation: "Đúng theo định nghĩa cây nhị phân tìm kiếm: Với mỗi nút, các nút thuộc cây con bên trái đều có giá trị nhỏ hơn nút đó và các nút thuộc cây con bên phải đều có giá trị lớn hơn."
  };

  // Mock câu hỏi sai của user (Sổ tay sửa sai)
  const incorrectQuestions = [
    {
      code: subjects[0]?.code || "CSD201",
      subject: subjects[0]?.name || "Cấu trúc dữ liệu & Giải thuật",
      q: "Độ phức tạp thời gian của thuật toán tìm kiếm nhị phân trên mảng đã sắp xếp kích thước n là:",
      yourAnswer: "O(n)",
      correctAnswer: "O(log n)",
      reason: "Bạn đã nhầm lẫn với tìm kiếm tuyến tính. Tìm kiếm nhị phân chia đôi không gian tìm kiếm sau mỗi bước nên độ phức tạp là O(log n)."
    },
    {
      code: subjects[1]?.code || "DBI202",
      subject: subjects[1]?.name || "Cơ sở dữ liệu",
      q: "Phát biểu nào sau đây đúng về khóa chính (Primary Key) trong một bảng dữ liệu quan hệ?",
      yourAnswer: "Cho phép chứa giá trị NULL nhưng không được trùng lặp.",
      correctAnswer: "Bắt buộc không được chứa giá trị NULL và không được trùng lặp (Unique).",
      reason: "Khóa chính dùng để định danh duy nhất cho một dòng trong bảng, do đó nó không bao giờ được phép chứa giá trị NULL."
    }
  ];

  return (
    <div className="flex min-h-screen w-full bg-paper-2">
      {/* Sidebar */}
      <aside className="hidden w-[260px] flex-none border-r border-line bg-paper lg:block">
        <div className="sticky top-0 flex h-screen flex-col justify-between p-6">
          <div>
            {/* Logo and site title */}
            <div className="flex items-center gap-2.5 px-3 pb-5">
              <Logo size={28} />
            </div>

            {/* Navigation Groups */}
            <nav className="mt-5 space-y-4">
              {NAV_GROUPS.map((group) => (
                <div key={group.title} className="space-y-1">
                  <h3 className="px-3 text-[10.5px] font-bold text-ink-3 uppercase tracking-wider">
                    {group.title}
                  </h3>
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => setActiveTab(item.id)}
                          className={`flex items-center gap-3 rounded-[6px] px-3 py-2 text-[13px] font-medium w-full text-left transition-colors ${
                            isActive
                              ? "bg-orange-soft text-orange-dark font-semibold"
                              : "text-ink-2 hover:bg-paper-2 hover:text-ink"
                          }`}
                        >
                          <item.icon size={15} className={isActive ? "text-orange" : "text-ink-3"} />
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            {/* Môn của tôi */}
            <div className="mt-5 border-t border-line pt-4 space-y-1">
              <h3 className="px-3 text-[10.5px] font-bold text-ink-3 uppercase tracking-wider">
                Môn của tôi
              </h3>
              <div className="space-y-0.5 max-h-[180px] overflow-y-auto pr-1">
                {suggested.map((s) => (
                  <Link
                    key={s.id}
                    href={`/exam/${home.id}/${s.id}`}
                    className="flex items-center gap-2 rounded-[6px] px-3 py-1.5 text-[12.5px] font-medium text-ink-2 hover:bg-paper-2 hover:text-ink transition-colors w-full text-left"
                  >
                    <span className="shrink-0 rounded bg-paper-2 border border-line px-1.5 py-0.5 font-mono text-[9.5px] text-ink-3">{s.code}</span>
                    <span className="truncate text-ink-2">{s.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Profile Info ở cuối Sidebar */}
          <div className="pt-4 border-t border-line">
            <div className="flex items-center gap-3 rounded-[8px] border border-line bg-paper-2 p-3">
              <Avatar size={38} name={studentName} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] font-semibold text-ink leading-tight">{studentName}</p>
                <p className="tnum text-[11px] text-ink-3 mt-0.5">{mssv}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="min-w-0 flex-1 px-5 py-6 lg:px-10 lg:py-8">
        {/* Mobile Profile Card */}
        <div className="mb-6 flex items-center justify-between rounded-[10px] border border-line bg-paper p-4 shadow-[var(--shadow-1)] lg:hidden">
          <div className="flex items-center gap-3">
            <Avatar size={40} name={studentName} />
            <div className="min-w-0">
              <p className="truncate text-[14px] font-semibold text-ink">{studentName}</p>
              <p className="tnum text-[11.5px] text-ink-3">{mssv}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-[6px] bg-paper-2 px-2.5 py-1.5 text-[11.5px] font-medium text-ink-2">
            <SchoolMark theme={home.theme} abbr={home.abbr} size={20} />
            <span>{home.abbr}</span>
          </div>
        </div>

        {/* Overview Tab Content */}
        {activeTab === "tong-quan" && (
          <div className="space-y-6">
            <div id="tong-quan">
              <h1 className="font-display text-[26px] font-semibold text-ink sm:text-[30px]">
                Chào {studentShortName}, sẵn sàng luyện thi chưa?
              </h1>
              <p className="mt-1 text-[15px] text-ink-2">
                Bạn đang luyện theo môi trường thi của{" "}
                <span className="font-medium text-ink">{home.name}</span>.
              </p>
            </div>

            {/* Stat strip */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <Stat icon={<FileCheck2 size={18} />} value="48" label="Đề đã làm" sub="+6 tuần này" tone="ink" />
              <Stat icon={<Target size={18} />} value="7.8" label="Điểm trung bình" sub="thang 10" tone="green" />
              <Stat icon={<BookOpen size={18} />} value="6" label="Môn đang luyện" tone="blue" />
              <Stat icon={<Trophy size={18} />} value="Top 12%" label="Xếp hạng" sub="cùng khóa" tone="orange" />
            </div>

            {/* Chart + History grid */}
            <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]" id="thong-ke">
              <section className="rounded-[10px] border border-line bg-paper p-5 shadow-[var(--shadow-1)]">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-[15px] font-semibold text-ink">Tiến bộ điểm số</h2>
                    <p className="text-[12.5px] text-ink-3">8 lần thi thử gần nhất</p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-soft px-2.5 py-1 text-[12.5px] font-medium text-green">
                    <TrendingUp size={14} /> +2.2 điểm
                  </span>
                </div>
                <ProgressChart data={TREND} />
              </section>

              {/* Lịch sử thi (hợp với 1 trường) */}
              <section className="rounded-[10px] border border-line bg-paper p-5 shadow-[var(--shadow-1)]" id="lich-su">
                <div className="flex items-center justify-between border-b border-line pb-3">
                  <div>
                    <h2 className="text-[15px] font-semibold text-ink">Lịch sử thi gần đây</h2>
                    <p className="text-[12px] text-ink-3">Chỉ hiển thị dữ liệu của {home.abbr}</p>
                  </div>
                </div>
                <div className="mt-3 divide-y divide-line max-h-[220px] overflow-y-auto">
                  {history.map((h, i) => {
                    const grade = classify(h.score);
                    return (
                      <div key={i} className="flex items-center gap-3 py-2.5">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-semibold text-ink">
                            <span className="font-mono text-[11px] text-ink-3 bg-paper-2 border border-line rounded px-1 mr-1">{h.code}</span> {h.name}
                          </p>
                          <p className="text-[11px] text-ink-3 mt-0.5">{h.when}</p>
                        </div>
                        <span className="inline-flex items-center gap-1">
                          <span className="tnum text-[13.5px] font-semibold" style={{ color: TONE_COLOR[grade.tone] }}>{h.score.toFixed(1)}</span>
                          <span className="rounded-[4px] px-1 py-0.5 text-[9.5px] font-semibold text-white" style={{ background: TONE_COLOR[grade.tone] }}>{grade.letter}</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>

            {/* Suggested exams */}
            <section className="rounded-[10px] border border-line bg-paper shadow-[var(--shadow-1)]" id="mon">
              <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
                <div>
                  <h2 className="text-[15px] font-semibold text-ink">Đề gợi ý cho bạn</h2>
                  <p className="text-[12.5px] text-ink-3">Dựa trên {home.abbr} — học phần bạn đang luyện</p>
                </div>
                <button onClick={() => setActiveTab("de-thi")} className="text-[13px] font-medium text-orange hover:text-orange-dark">
                  Xem tất cả
                </button>
              </div>
              <div className="divide-y divide-line">
                {suggested.map((s) => {
                  const grade = s.lastScore != null ? classify(s.lastScore) : null;
                  return (
                    <div key={s.id} className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-paper-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="rounded-[5px] border border-line bg-paper-2 px-1.5 py-0.5 font-mono text-[11px] font-medium text-ink-2">{s.code}</span>
                          <h3 className="truncate text-[14.5px] font-semibold text-ink">{s.name}</h3>
                        </div>
                        <p className="mt-0.5 text-[12.5px] text-ink-3">{s.examCount} đề · {s.durationMin} phút · {s.difficulty}</p>
                      </div>
                      {grade && (
                        <span className="hidden items-center gap-1.5 sm:inline-flex">
                          <span className="text-[12px] text-ink-3">Gần nhất</span>
                          <span className="tnum text-[14px] font-semibold" style={{ color: TONE_COLOR[grade.tone] }}>{s.lastScore?.toFixed(1)}</span>
                        </span>
                      )}
                      <Link
                        href={`/exam/${home.id}/${s.id}`}
                        className="inline-flex h-9 items-center gap-1.5 rounded-[6px] bg-orange px-3.5 text-[13px] font-medium text-white shadow-sm hover:shadow transition-colors hover:bg-orange-dark"
                      >
                        <Play size={14} fill="currentColor" /> Vào thi
                      </Link>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {/* Môn học của tôi Tab Content */}
        {activeTab === "mon-hoc" && (
          <div className="space-y-6">
            {selectedSubjectForDocs ? (
              <div className="space-y-6">
                {/* Back button and subject info */}
                <div className="flex flex-wrap items-start gap-4 justify-between border-b border-line pb-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedSubjectForDocs(null)}
                      className="inline-flex h-9 items-center gap-2 rounded-[6px] border border-line bg-paper px-3 text-[13px] font-semibold text-ink-2 hover:bg-paper-2 hover:text-ink transition-colors"
                    >
                      <ArrowLeft size={15} /> Quay lại
                    </button>
                    <div>
                      <h2 className="text-[20px] font-bold text-ink flex flex-wrap items-center gap-2">
                        <span className="rounded bg-paper-2 border border-line px-1.5 py-0.5 font-mono text-[13px] font-bold text-ink-2">
                          {selectedSubjectForDocs.code}
                        </span>
                        {selectedSubjectForDocs.name}
                      </h2>
                      <p className="text-[12.5px] text-ink-3">Chuyên ngành: {selectedSubjectForDocs.faculty}</p>
                    </div>
                  </div>
                </div>

                {/* Chapter list */}
                <div className="space-y-4">
                  <h3 className="text-[16px] font-bold text-ink">Giáo trình & Slide bài giảng phân theo chương</h3>
                  
                  <div className="grid gap-4">
                    {(CHAPTERS_DATA[selectedSubjectForDocs.code.toLowerCase()] || CHAPTERS_DATA.default).map((ch, idx) => (
                      <div key={idx} className="rounded-[10px] border border-line bg-paper p-5 shadow-[var(--shadow-1)] hover:border-orange transition-colors flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-start gap-3.5">
                          <div className="rounded-[6px] bg-orange-soft p-3 text-orange shrink-0">
                            <Layers size={22} />
                          </div>
                          <div>
                            <h4 className="text-[15px] font-bold text-ink">{ch.title}</h4>
                            <p className="text-[12.5px] text-ink-3 mt-1 flex items-center gap-1.5">
                              <span>Slide bài giảng {selectedSubjectForDocs.code} · Chương {idx + 1}</span>
                              <span className="h-1 w-1 rounded-full bg-line-strong" />
                              <span className="font-semibold text-orange">PPTX (PowerPoint)</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 sm:self-start md:self-auto">
                          <button
                            onClick={() => setPreviewingSlide({ chapterTitle: ch.title, slides: ch.slides, slideIndex: 0 })}
                            className="inline-flex h-9 items-center gap-1.5 rounded-[6px] bg-orange px-4 text-[13px] font-semibold text-white hover:bg-orange-dark transition-colors"
                          >
                            <Eye size={14} /> Xem trực tiếp
                          </button>
                          <button
                            onClick={() => alert(`Đã bắt đầu tải file PowerPoint: Slide_${selectedSubjectForDocs.code}_Chương_${idx + 1}.pptx`)}
                            className="inline-flex h-9 items-center gap-1.5 rounded-[6px] border border-line bg-paper px-4 text-[13px] font-semibold text-ink-2 hover:bg-paper-2 transition-colors"
                          >
                            <Download size={14} /> Tải về
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              // Original list view
              <>
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <h1 className="font-display text-[26px] font-semibold text-ink">Môn học của tôi</h1>
                    <p className="mt-1 text-[15px] text-ink-2">Danh sách tất cả các học phần giảng dạy và giáo trình của trường {home.name}.</p>
                  </div>
                  <div className="flex gap-4 rounded-[8px] border border-line bg-paper px-4 py-2 text-[13px] shadow-[var(--shadow-1)]">
                    <div>
                      <span className="tnum font-semibold text-ink">{subjects.length}</span> môn học
                    </div>
                  </div>
                </div>

                {/* Filter controls */}
                <div className="flex flex-col gap-3">
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm môn học theo tên hoặc mã (vd: CSD201)..."
                    className="h-10 w-full max-w-md rounded-[7px] border border-line bg-paper px-3 text-[14px] outline-none focus:border-orange placeholder:text-ink-3"
                  />
                  <div className="flex flex-wrap gap-2 text-[12px]">
                    <button
                      onClick={() => { setSelectedFaculty(null); }}
                      className={`px-3 py-1.5 rounded-full border transition-all font-medium ${
                        !selectedFaculty ? "bg-orange border-orange text-white" : "border-line bg-paper text-ink-2 hover:bg-paper-2"
                      }`}
                    >
                      Tất cả chuyên ngành
                    </button>
                    {faculties.map((f) => (
                      <button
                        key={f}
                        onClick={() => setSelectedFaculty(selectedFaculty === f ? null : f)}
                        className={`px-3 py-1.5 rounded-full border transition-all font-medium ${
                          selectedFaculty === f ? "bg-orange border-orange text-white" : "border-line bg-paper text-ink-2 hover:bg-paper-2"
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subjects List */}
                {filteredSubjects.length === 0 ? (
                  <div className="rounded-[10px] border border-line bg-paper p-10 text-center shadow-[var(--shadow-1)]">
                    <p className="text-[14.5px] font-medium text-ink">Không tìm thấy môn học nào phù hợp</p>
                    <p className="mt-1 text-[13px] text-ink-3">Thử thay đổi từ khóa tìm kiếm hoặc chọn chuyên ngành khác.</p>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredSubjects.map((s) => {
                      return (
                        <div key={s.id} className="rounded-[10px] border border-line bg-paper p-4 shadow-[var(--shadow-1)] hover:border-orange transition-colors flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="rounded bg-paper-2 border border-line px-1.5 py-0.5 font-mono text-[10px] font-semibold text-ink-2">{s.code}</span>
                              <span className="text-[11px] text-ink-3 font-medium">{s.faculty}</span>
                            </div>
                            <h3 className="mt-2 text-[14.5px] font-bold text-ink line-clamp-1">{s.name}</h3>
                            <p className="mt-1 text-[12px] text-ink-3">Độ khó: {s.difficulty}</p>
                          </div>

                          <div className="mt-4 pt-3 border-t border-line">
                            <button
                              onClick={() => setSelectedSubjectForDocs(s)}
                              className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-[6px] bg-orange px-4 text-[13px] font-semibold text-white hover:bg-orange-dark transition-colors"
                            >
                              <FileText size={14} /> Xem giáo trình & Slide
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Đọc tài liệu Tab Content */}
        {activeTab === "tai-lieu" && (
          <div className="space-y-6">
            <div>
              <h1 className="font-display text-[26px] font-semibold text-ink">Đọc tài liệu & Slide bài giảng</h1>
              <p className="mt-1 text-[15px] text-ink-2">Thư viện slide, giáo trình PDF được đồng bộ hóa từ trường {home.name}.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {docsList.map((doc, i) => (
                <div key={i} className="flex items-start gap-4 rounded-[10px] border border-line bg-paper p-4 shadow-[var(--shadow-1)] hover:border-orange transition-colors">
                  <div className="rounded-[6px] bg-orange-soft p-3 text-orange">
                    <FileText size={24} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="rounded bg-paper-2 border border-line px-1.5 py-0.5 font-mono text-[10px] font-medium text-ink-3">{doc.code}</span>
                    <h3 className="mt-1.5 truncate text-[14.5px] font-semibold text-ink" title={doc.name}>{doc.name}</h3>
                    <p className="mt-1 text-[12px] text-ink-3">{doc.type} · {doc.size} · {doc.reads}</p>
                    <div className="mt-3.5 flex gap-2">
                      <button className="inline-flex h-8 items-center rounded-[5px] bg-orange px-3 text-[12px] font-semibold text-white hover:bg-orange-dark transition-colors">Đọc ngay</button>
                      <button className="inline-flex h-8 items-center rounded-[5px] border border-line px-3 text-[12px] font-semibold text-ink-2 hover:bg-paper-2 transition-colors">Tải về</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Thẻ ghi nhớ Flashcards Tab Content */}
        {activeTab === "flashcards" && (
          <div className="space-y-6">
            <div>
              <h1 className="font-display text-[26px] font-semibold text-ink">Ôn tập bằng Thẻ ghi nhớ (Quizlet)</h1>
              <p className="mt-1 text-[15px] text-ink-2">Sử dụng phương pháp gợi nhớ chủ động (Active Recall) để ôn tập định nghĩa nhanh.</p>
            </div>

            <div className="w-full space-y-4">
              {/* Stats strip */}
              <div className="flex justify-between text-[13px] text-ink-3 px-1">
                <span>Tiến độ: <strong className="text-ink font-semibold">{cardIndex + 1}/{sampleFlashcards.length}</strong> thẻ</span>
                <span className="flex gap-3">
                  <span className="text-green font-medium">Đã thuộc: {knowCount}</span>
                  <span className="text-orange font-medium">Chưa thuộc: {dontKnowCount}</span>
                </span>
              </div>

              {/* Card wrapper */}
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className="relative min-h-[260px] w-full cursor-pointer rounded-[14px] border border-line bg-paper p-6 shadow-[var(--shadow-1)] transition-all duration-300 hover:shadow-md flex flex-col justify-between items-center text-center"
              >
                <span className="text-[11px] font-bold text-ink-3 uppercase tracking-widest">{isFlipped ? "ĐÁP ÁN / GIẢI THÍCH" : "CÂU HỎI / KHÁI NIỆM"}</span>
                <p className="text-[17px] font-medium text-ink px-4 py-6 select-none w-full">
                  {isFlipped ? sampleFlashcards[cardIndex].back : sampleFlashcards[cardIndex].front}
                </p>
                <span className="flex items-center gap-1.5 text-[12px] text-orange font-semibold">
                  <RotateCw size={13} /> {isFlipped ? "Click để xem câu hỏi" : "Click để xem đáp án"}
                </span>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDontKnowCount(dontKnowCount + 1);
                    setIsFlipped(false);
                    setCardIndex((cardIndex + 1) % sampleFlashcards.length);
                  }}
                  className="flex-1 inline-flex h-11 items-center justify-center gap-2 rounded-[8px] border border-line bg-paper px-4 font-semibold text-ink-2 hover:bg-paper-2 hover:text-ink transition-colors text-[14px]"
                >
                  <XCircle size={17} className="text-red" /> Chưa thuộc
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setKnowCount(knowCount + 1);
                    setIsFlipped(false);
                    setCardIndex((cardIndex + 1) % sampleFlashcards.length);
                  }}
                  className="flex-1 inline-flex h-11 items-center justify-center gap-2 rounded-[8px] bg-orange px-4 font-semibold text-white hover:bg-orange-dark transition-colors text-[14px] shadow-sm"
                >
                  <CheckCircle2 size={17} /> Đã thuộc
                </button>
              </div>

              <div className="flex justify-center pt-2">
                <button
                  onClick={() => {
                    setCardIndex(0);
                    setIsFlipped(false);
                    setKnowCount(0);
                    setDontKnowCount(0);
                  }}
                  className="text-[12.5px] font-medium text-ink-3 hover:text-orange"
                >
                  Luyện lại từ đầu
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Luyện câu hỏi nhanh Tab Content */}
        {activeTab === "trac-nghiem" && (
          <div className="space-y-6">
            <div>
              <h1 className="font-display text-[26px] font-semibold text-ink">Luyện câu hỏi trắc nghiệm nhanh</h1>
              <p className="mt-1 text-[15px] text-ink-2">Trả lời các câu hỏi trắc nghiệm đơn lẻ có chấm điểm và giải thích tức thì.</p>
            </div>

            <div className="w-full rounded-[10px] border border-line bg-paper p-5 shadow-[var(--shadow-1)] space-y-4">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <span className="text-[11px] font-bold text-ink-3 bg-paper-2 border border-line px-2 py-0.5 rounded">CÂU HỎI THƯỜNG GẶP</span>
                <span className="text-[12.5px] text-green font-semibold">Chủ đề: Cấu trúc cây (BST)</span>
              </div>

              <p className="text-[15.5px] font-semibold text-ink leading-relaxed">
                {quizQuestion.q}
              </p>

              <div className="space-y-2.5 pt-2">
                {quizQuestion.options.map((opt, idx) => {
                  let optStyle = "border-line bg-paper text-ink hover:border-orange hover:bg-paper-2";
                  if (quizChecked) {
                    if (idx === quizQuestion.correct) {
                      optStyle = "border-green bg-green-soft text-green font-medium";
                    } else if (idx === selectedAnswer) {
                      optStyle = "border-red bg-red-soft text-red";
                    } else {
                      optStyle = "border-line bg-paper text-ink opacity-60";
                    }
                  } else if (selectedAnswer === idx) {
                    optStyle = "border-orange bg-orange-soft text-orange-dark font-medium";
                  }

                  return (
                    <button
                      key={idx}
                      disabled={quizChecked}
                      onClick={() => setSelectedAnswer(idx)}
                      className={`w-full flex items-start gap-3 rounded-[8px] border p-3.5 text-left text-[14px] transition-all ${optStyle}`}
                    >
                      <span className={`grid shrink-0 place-items-center w-5 h-5 rounded-full border text-[11px] font-semibold uppercase ${
                        selectedAnswer === idx ? "bg-orange border-orange text-white" : "border-line text-ink-3"
                      }`}>
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="leading-normal">{opt}</span>
                    </button>
                  );
                })}
              </div>

              {quizChecked && (
                <div className={`rounded-[8px] p-4 text-[13.5px] leading-relaxed ${
                  selectedAnswer === quizQuestion.correct ? "bg-green-soft text-green-dark" : "bg-orange-soft text-orange-dark"
                }`}>
                  <h4 className="font-bold flex items-center gap-1.5 text-[14px] mb-1">
                    {selectedAnswer === quizQuestion.correct ? (
                      <>✔ Trả lời chính xác!</>
                    ) : (
                      <>✖ Trả lời sai (Đáp án đúng là {String.fromCharCode(65 + quizQuestion.correct)})</>
                    )}
                  </h4>
                  <p>{quizQuestion.explanation}</p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-line">
                {!quizChecked ? (
                  <button
                    disabled={selectedAnswer === null}
                    onClick={() => setQuizChecked(true)}
                    className="inline-flex h-10 items-center justify-center rounded-[6px] bg-orange px-5 text-[13px] font-semibold text-white hover:bg-orange-dark transition-colors disabled:opacity-50"
                  >
                    Kiểm tra đáp án
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setSelectedAnswer(null);
                      setQuizChecked(false);
                    }}
                    className="inline-flex h-10 items-center justify-center rounded-[6px] border border-line bg-paper px-4 text-[13px] font-semibold text-ink-2 hover:bg-paper-2 transition-colors"
                  >
                    Luyện câu hỏi tiếp theo
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Sổ tay sửa sai Tab Content */}
        {activeTab === "so-tay-sai" && (
          <div className="space-y-6">
            <div>
              <h1 className="font-display text-[26px] font-semibold text-ink">Sổ tay sửa sai (AI Weakness Book)</h1>
              <p className="mt-1 text-[15px] text-ink-2">Lưu trữ các câu hỏi bạn từng làm sai trong các đề thi thử để tập trung khắc phục lỗ hổng kiến thức.</p>
            </div>

            <div className="space-y-4">
              {incorrectQuestions.map((q, idx) => (
                <div key={idx} className="rounded-[10px] border border-line bg-paper p-5 shadow-[var(--shadow-1)] space-y-3.5">
                  <div className="flex items-center justify-between border-b border-line pb-2.5">
                    <span className="font-mono text-[11px] font-bold text-orange bg-orange-soft border border-orange-border px-1.5 py-0.5 rounded">{q.code}</span>
                    <span className="text-[12px] text-ink-3">{q.subject}</span>
                  </div>

                  <p className="text-[15px] font-semibold text-ink leading-relaxed">
                    {q.q}
                  </p>

                  <div className="grid gap-2 text-[13px] md:grid-cols-2">
                    <div className="rounded-[6px] bg-red-soft p-3 text-red border border-red-soft">
                      <span className="block text-[10.5px] font-bold uppercase tracking-wider opacity-85">Câu bạn chọn:</span>
                      <p className="mt-0.5 font-medium">{q.yourAnswer}</p>
                    </div>
                    <div className="rounded-[6px] bg-green-soft p-3 text-green border border-green-soft">
                      <span className="block text-[10.5px] font-bold uppercase tracking-wider opacity-85">Đáp án đúng:</span>
                      <p className="mt-0.5 font-medium">{q.correctAnswer}</p>
                    </div>
                  </div>

                  <div className="rounded-[6px] bg-paper-2 p-3.5 border border-line text-[13px] text-ink-2 leading-relaxed">
                    <strong className="text-ink font-semibold block mb-0.5">Phân tích lỗi sai & Gợi ý:</strong>
                    {q.reason}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Đề thi gợi ý Tab Content */}
        {activeTab === "de-thi" && (
          <div className="space-y-6">
            <div>
              <h1 className="font-display text-[26px] font-semibold text-ink">Đề thi thử đề xuất</h1>
              <p className="mt-1 text-[15px] text-ink-2">Ngân hàng đề thi thử các học phần chính thức của {home.name}.</p>
            </div>

            <section className="rounded-[10px] border border-line bg-paper shadow-[var(--shadow-1)]">
              <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
                <div>
                  <h2 className="text-[15px] font-semibold text-ink">Đề ôn tập gợi ý cho bạn</h2>
                  <p className="text-[12.5px] text-ink-3">Dựa trên {home.abbr} — học phần bạn đang luyện</p>
                </div>
              </div>
              <div className="divide-y divide-line">
                {suggested.map((s) => {
                  const grade = s.lastScore != null ? classify(s.lastScore) : null;
                  return (
                    <div key={s.id} className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-paper-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="rounded-[5px] border border-line bg-paper-2 px-1.5 py-0.5 font-mono text-[11px] font-medium text-ink-2">{s.code}</span>
                          <h3 className="truncate text-[14.5px] font-semibold text-ink">{s.name}</h3>
                        </div>
                        <p className="mt-0.5 text-[12.5px] text-ink-3">{s.examCount} đề · {s.durationMin} phút · {s.difficulty}</p>
                      </div>
                      {grade && (
                        <span className="hidden items-center gap-1.5 sm:inline-flex">
                          <span className="text-[12px] text-ink-3">Gần nhất</span>
                          <span className="tnum text-[14px] font-semibold" style={{ color: TONE_COLOR[grade.tone] }}>{s.lastScore?.toFixed(1)}</span>
                        </span>
                      )}
                      <Link
                        href={`/exam/${home.id}/${s.id}`}
                        className="inline-flex h-9 items-center gap-1.5 rounded-[6px] bg-orange px-3.5 text-[13px] font-medium text-white shadow-sm hover:shadow transition-colors hover:bg-orange-dark"
                      >
                        <Play size={14} fill="currentColor" /> Vào thi
                      </Link>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {/* Lịch sử thi Tab Content */}
        {activeTab === "lich-su" && (
          <div className="space-y-6">
            <div>
              <h1 className="font-display text-[26px] font-semibold text-ink">Lịch sử thi gần đây</h1>
              <p className="mt-1 text-[15px] text-ink-2">Kết quả thi thử và lưu trữ bài làm của bạn tại {home.name}.</p>
            </div>

            <section className="rounded-[10px] border border-line bg-paper shadow-[var(--shadow-1)]">
              <div className="divide-y divide-line">
                {history.map((h, i) => {
                  const grade = classify(h.score);
                  return (
                    <div key={i} className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-paper-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="rounded-[5px] border border-line bg-paper-2 px-1.5 py-0.5 font-mono text-[11px] font-medium text-ink-2">{h.code}</span>
                          <h3 className="truncate text-[14.5px] font-semibold text-ink">{h.name}</h3>
                        </div>
                        <p className="mt-0.5 text-[12.5px] text-ink-3">{home.abbr} · {h.when}</p>
                      </div>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="tnum text-[15px] font-semibold" style={{ color: TONE_COLOR[grade.tone] }}>{h.score.toFixed(1)}</span>
                        <span className="rounded-[4px] px-1.5 py-0.5 text-[11px] font-semibold text-white" style={{ background: TONE_COLOR[grade.tone] }}>{grade.letter}</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {/* Thống kê Tab Content */}
        {activeTab === "thong-ke" && (
          <div className="space-y-6">
            <div>
              <h1 className="font-display text-[26px] font-semibold text-ink">Tiến độ & Thống kê học tập</h1>
              <p className="mt-1 text-[15px] text-ink-2">Phân tích xu hướng điểm số và theo dõi mục tiêu học phần ôn thi.</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.8fr_1fr]">
              <section className="rounded-[10px] border border-line bg-paper p-5 shadow-[var(--shadow-1)]">
                <h2 className="text-[15px] font-semibold text-ink mb-3">Tiến bộ điểm số (8 lần thi gần nhất)</h2>
                <ProgressChart data={TREND} />
              </section>

              <div className="space-y-4">
                <Stat icon={<FileCheck2 size={18} />} value="48" label="Đề thi đã làm" tone="ink" />
                <Stat icon={<Target size={18} />} value="7.8" label="Điểm trung bình" tone="green" />
                <Stat icon={<Trophy size={18} />} value="Top 12%" label="Xếp hạng học tập" sub="cùng khóa" tone="orange" />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Slide Preview Modal */}
      {previewingSlide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="relative w-full max-w-4xl rounded-[16px] border border-line bg-paper shadow-2xl overflow-hidden flex flex-col min-h-[480px]">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-line px-6 py-4 bg-paper-2">
              <div>
                <h3 className="text-[16.5px] font-bold text-ink">{previewingSlide.chapterTitle}</h3>
                <p className="text-[12px] text-ink-3">Đang xem chế độ trực tiếp Slide PowerPoint (.pptx)</p>
              </div>
              <button
                onClick={() => setPreviewingSlide(null)}
                className="rounded-full p-1.5 hover:bg-line text-ink-3 hover:text-ink transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Slide Content Box */}
            <div className="flex-1 bg-ink-2 p-8 md:p-12 flex items-center justify-center">
              <div className="w-full max-w-2xl aspect-[4/3] bg-paper border border-line rounded-lg shadow-lg p-8 md:p-10 flex flex-col justify-between select-none relative">
                {/* School watermark in preview */}
                <div className="absolute top-4 right-4 flex items-center gap-1.5 opacity-30">
                  <SchoolMark theme={home.theme} abbr={home.abbr} size={16} />
                  <span className="font-mono text-[9px] font-bold text-ink">{home.abbr}</span>
                </div>

                <div className="flex-1 flex flex-col justify-center">
                  <p className="text-[16px] md:text-[18px] font-semibold text-ink leading-relaxed">
                    {previewingSlide.slides[previewingSlide.slideIndex]}
                  </p>
                </div>

                {/* Slide Footer */}
                <div className="mt-8 border-t border-line pt-4 flex justify-between items-center text-[12px] text-ink-3">
                  <span>Học phần: <strong className="text-ink-2">{selectedSubjectForDocs?.code} - {selectedSubjectForDocs?.name}</strong></span>
                  <span className="tnum font-medium">Trang {previewingSlide.slideIndex + 1} / {previewingSlide.slides.length}</span>
                </div>
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div className="border-t border-line px-6 py-4 bg-paper-2 flex items-center justify-between">
              <button
                onClick={() => alert(`Đã bắt đầu tải file PowerPoint: Slide_${selectedSubjectForDocs?.code}_Chương.pptx`)}
                className="inline-flex h-9 items-center gap-1.5 rounded-[6px] border border-line bg-paper px-4 text-[13px] font-semibold text-ink-2 hover:bg-paper-2 transition-colors"
              >
                <Download size={14} /> Tải file PPTX về máy
              </button>

              <div className="flex gap-2">
                <button
                  disabled={previewingSlide.slideIndex === 0}
                  onClick={() => setPreviewingSlide({ ...previewingSlide, slideIndex: previewingSlide.slideIndex - 1 })}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-[6px] border border-line bg-paper text-ink-2 hover:bg-paper-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  disabled={previewingSlide.slideIndex === previewingSlide.slides.length - 1}
                  onClick={() => setPreviewingSlide({ ...previewingSlide, slideIndex: previewingSlide.slideIndex + 1 })}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-[6px] border border-line bg-paper text-ink-2 hover:bg-paper-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Avatar({ size = 36, name = "Student" }: { size?: number; name?: string }) {
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full bg-ink font-semibold text-white uppercase"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}

function Stat({
  icon,
  value,
  label,
  sub,
  tone,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  sub?: string;
  tone: "ink" | "green" | "blue" | "orange";
}) {
  const color =
    tone === "green"
      ? "var(--color-green)"
      : tone === "blue"
        ? "var(--color-blue)"
        : tone === "orange"
          ? "var(--color-orange)"
          : "var(--color-ink)";
  return (
    <div className="rounded-[10px] border border-line bg-paper p-4 shadow-[var(--shadow-1)]">
      <span style={{ color }}>{icon}</span>
      <p className="tnum mt-2 text-[26px] font-semibold leading-none" style={{ color }}>
        {value}
      </p>
      <p className="mt-1 text-[13px] font-medium text-ink-2">{label}</p>
      {sub && <p className="text-[12px] text-ink-3">{sub}</p>}
    </div>
  );
}

/** SVG line chart — uses active school theme colors (dynamic). */
function ProgressChart({ data }: { data: number[] }) {
  const W = 560;
  const H = 180;
  const pad = { l: 28, r: 12, t: 14, b: 24 };
  const min = 4;
  const max = 10;
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;

  const x = (i: number) => pad.l + (i / (data.length - 1)) * innerW;
  const y = (v: number) => pad.t + (1 - (v - min) / (max - min)) * innerH;

  const linePts = data.map((v, i) => `${x(i)},${y(v)}`).join(" ");
  const areaPts = `${pad.l},${pad.t + innerH} ${linePts} ${pad.l + innerW},${pad.t + innerH}`;
  const gridYs = [4, 6, 8, 10];

  return (
    <div className="mt-3 overflow-hidden">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" preserveAspectRatio="xMidYMid meet">
        {gridYs.map((g) => (
          <g key={g}>
            <line x1={pad.l} x2={W - pad.r} y1={y(g)} y2={y(g)} stroke="var(--color-line)" strokeWidth="1" />
            <text x={4} y={y(g) + 4} fontSize="11" fill="var(--color-ink-3)" className="tnum">{g}</text>
          </g>
        ))}
        <polygon points={areaPts} fill="var(--color-orange-soft)" opacity="0.6" />
        <polyline points={linePts} fill="none" stroke="var(--color-orange)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((v, i) => (
          <g key={i}>
            <circle cx={x(i)} cy={y(v)} r={i === data.length - 1 ? 5 : 3.5} fill="#fff" stroke="var(--color-orange)" strokeWidth="2.5" />
            <text x={x(i)} y={H - 8} fontSize="10.5" textAnchor="middle" fill="var(--color-ink-3)">
              {i + 1}
            </text>
          </g>
        ))}
        <text x={x(data.length - 1)} y={y(data[data.length - 1]) - 12} fontSize="12" fontWeight="600" textAnchor="middle" fill="var(--color-orange)" className="tnum">
          {data[data.length - 1].toFixed(1)}
        </text>
      </svg>
    </div>
  );
}
