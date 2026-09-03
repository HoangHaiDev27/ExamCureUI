"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import {
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
  ArrowLeft,
  ArrowUpRight,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Menu,
  Search,
  LogOut,
  UserRound,
  X,
} from "lucide-react";
import { getSchool } from "@/lib/schools";
import { getSubjects } from "@/lib/subjects";
import type { Subject } from "@/lib/types";
import { SchoolMark } from "@/components/SchoolMark";
import { Logo } from "@/components/Logo";
import { FlashcardWorkspace } from "@/components/FlashcardWorkspace";
import { STUDENT, mssvFor } from "@/lib/student";
import { classify, TONE_COLOR } from "@/lib/grade";
import { logout, useAuth, initials } from "@/lib/auth";

const NAV_GROUPS = [
  {
    title: "Tổng quan",
    items: [
      { id: "tong-quan", label: "Bảng điều khiển", icon: LayoutDashboard },
      { id: "mon-hoc", label: "Danh mục môn học", icon: BookOpen }
    ]
  },
  {
    title: "Ôn tập",
    items: [
      { id: "tai-lieu", label: "Đọc tài liệu", icon: FileText },
      { id: "flashcards", label: "Thẻ ghi nhớ", icon: Layers },
      { id: "trac-nghiem", label: "Luyện câu hỏi nhanh", icon: HelpCircle },
      { id: "so-tay-sai", label: "Sổ tay sửa sai", icon: BookOpen }
    ]
  },
  {
    title: "Thi thử",
    items: [
      { id: "de-thi", label: "Đề thi gợi ý", icon: FileCheck2 },
      { id: "lich-su", label: "Lịch sử thi", icon: History }
    ]
  }
];

const DASHBOARD_TAB_IDS = new Set(NAV_GROUPS.flatMap((group) => group.items.map((item) => item.id)));

const TREND = [6.2, 6.6, 6.4, 7.3, 7.0, 7.7, 8.1, 8.4];

const FPT_DASHBOARD_ACCENT = {
  "--color-orange": "#e9783a",
  "--color-orange-dark": "#b94d18",
  "--color-orange-soft": "#fff3eb",
  "--color-orange-border": "#f2c5aa",
  "--color-paper-2": "#f8f6f3",
  "--color-paper-3": "#f1ede8",
  "--color-line": "#e8e2dc",
  "--color-line-strong": "#d8d0c8",
  "--shadow-1": "0 1px 2px rgba(34, 28, 23, 0.05), 0 4px 14px rgba(34, 28, 23, 0.035)",
  "--shadow-2": "0 12px 32px rgba(34, 28, 23, 0.09), 0 2px 6px rgba(34, 28, 23, 0.05)",
} as CSSProperties;

const CHAPTERS_DATA: Record<string, { title: string; slides: string[] }[]> = {
  default: [
    {
      title: "Chương 1: Tổng quan & Giới thiệu chung",
      slides: [
        "Slide 1: Khái niệm cơ bản và vai trò của học phần trong chuyên ngành.",
        "Slide 2: Các nội dung cốt lõi và lộ trình ôn luyện thi thử hiệu quả.",
        "Slide 3: Các tài liệu tham khảo chính và cấu trúc đề thi cuối kỳ."
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [expandedTerms, setExpandedTerms] = useState<Set<number>>(() => new Set(Array.from({ length: 9 }, (_, index) => index + 1)));
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileMenuPanelRef = useRef<HTMLDivElement>(null);
  const user = useAuth();
  const schoolId = user?.schoolId || "fptu";
  const home = getSchool(schoolId)!;
  const subjects = getSubjects(schoolId);
  const mssv = user ? (user.email?.split("@")[0].toUpperCase() || mssvFor(schoolId)) : mssvFor(schoolId);
  const suggested = subjects.slice(0, 5);

  const studentName = user?.name || STUDENT.name;
  const avatarUrl = user?.avatarUrl;

  const signOut = () => {
    setIsProfileMenuOpen(false);
    setIsMobileMenuOpen(false);
    logout();
    window.location.assign("/");
  };

  const getMockSubject = (code: string, fallbackIndex: number) =>
    subjects.find((subject) => subject.code.toLowerCase() === code.toLowerCase()) || subjects[fallbackIndex];
  const historyMocks = [
    { code: "CSD201", score: 8.4, when: "Hôm nay, 09:42" },
    { code: "DBI202", score: 7.8, when: "Hôm qua, 20:15" },
    { code: "PRO192", score: 9.0, when: "3 ngày trước" },
    { code: "MAS291", score: 7.2, when: "5 ngày trước" },
    { code: "PRF192", score: 6.8, when: "12/08/2026" },
    { code: "MAE101", score: 8.7, when: "08/08/2026" },
    { code: "ECO111", score: 7.5, when: "02/08/2026" },
    { code: "WED201c", score: 9.2, when: "28/07/2026" },
  ];
  const history = historyMocks.map((item, index) => {
    const subject = getMockSubject(item.code, index);
    return {
      code: subject?.code || item.code,
      name: subject?.name || `Học phần ${item.code}`,
      score: item.score,
      when: item.when,
    };
  });

  // States cho Luyện câu hỏi nhanh (Quick Quiz)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizChecked, setQuizChecked] = useState(false);

  // States cho danh mục môn học
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFaculty, setSelectedFaculty] = useState<string | null>(null);
  const [selectedTerm, setSelectedTerm] = useState<number | null>(null);
  const [selectedSubjectForDocs, setSelectedSubjectForDocs] = useState<Subject | null>(null);
  const [previewingSlide, setPreviewingSlide] = useState<{ chapterTitle: string; slides: string[]; slideIndex: number } | null>(null);

  useEffect(() => {
    const syncTabFromUrl = () => {
      const tab = new URLSearchParams(window.location.search).get("tab");
      if (tab && DASHBOARD_TAB_IDS.has(tab)) setActiveTab(tab);
    };

    syncTabFromUrl();
    window.addEventListener("popstate", syncTabFromUrl);
    return () => window.removeEventListener("popstate", syncTabFromUrl);
  }, []);

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    mobileMenuPanelRef.current?.focus();

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
        mobileMenuButtonRef.current?.focus();
      }
    };

    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (!previewingSlide) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPreviewingSlide(null);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [previewingSlide]);

  const navigateToTab = (tabId: string) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
    const url = new URL(window.location.href);
    if (tabId === "tong-quan") url.searchParams.delete("tab");
    else url.searchParams.set("tab", tabId);
    window.history.pushState({}, "", `${url.pathname}${url.search}${url.hash}`);
  };

  const activeTabLabel = NAV_GROUPS.flatMap((group) => group.items).find((item) => item.id === activeTab)?.label || "Bảng điều khiển";

  const faculties = Array.from(new Set(subjects.map((s) => s.faculty)));
  const filteredSubjects = subjects.filter((s) => {
    if (selectedFaculty && s.faculty !== selectedFaculty) return false;
    if (schoolId === "fptu" && selectedTerm && s.semester !== `Kỳ ${selectedTerm}`) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      return s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q);
    }
    return true;
  });
  const fptTermGroups = schoolId === "fptu"
    ? Array.from({ length: 9 }, (_, index) => {
        const term = index + 1;
        return {
          term,
          subjects: filteredSubjects.filter((subject) => subject.semester === `Kỳ ${term}`),
        };
      }).filter((group) => group.subjects.length > 0)
    : [];

  const renderSubjectCard = (subject: Subject) => (
    <button
      key={subject.id}
      type="button"
      onClick={() => setSelectedSubjectForDocs(subject)}
      aria-label={`Xem giáo trình và slide môn ${subject.code} - ${subject.name}`}
      className="group flex min-h-[132px] flex-col justify-between rounded-[10px] border border-line bg-paper p-4 text-left shadow-[var(--shadow-1)] transition-[border-color,background-color,transform] hover:-translate-y-0.5 hover:border-orange hover:bg-orange-soft/30"
    >
      <div>
        <div className="flex items-center justify-between gap-3">
          <span className="rounded border border-line bg-paper-2 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-ink-2">{subject.code}</span>
          <span className="truncate text-[11px] font-medium text-ink-3">{subject.faculty}</span>
        </div>
        <h3 className="mt-2 line-clamp-1 text-[14.5px] font-bold text-ink">{subject.name}</h3>
        <p className="mt-1 text-[12px] text-ink-3">Độ khó: {subject.difficulty}</p>
      </div>

      <span className="mt-4 flex items-center gap-1.5 border-t border-line pt-3 text-[12px] font-semibold text-ink-3 transition-colors group-hover:text-orange-dark">
        <FileText size={13} aria-hidden="true" /> Giáo trình &amp; Slide
        <ArrowUpRight size={14} className="ml-auto transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
      </span>
    </button>
  );

  // Mock tài liệu học tập đủ dài để kiểm tra grid và responsive
  const documentMocks = [
    { code: "CSD201", title: "Giáo trình cấu trúc dữ liệu và giải thuật", type: "PDF", size: "4.8 MB", reads: "1.2k lượt đọc" },
    { code: "DBI202", title: "Slide chương 3 · Chuẩn hóa cơ sở dữ liệu", type: "PPTX", size: "2.1 MB", reads: "850 lượt đọc" },
    { code: "PRO192", title: "Tóm tắt lập trình hướng đối tượng bằng Java", type: "PDF", size: "1.5 MB", reads: "2.3k lượt đọc" },
    { code: "MAS291", title: "Bảng công thức xác suất và thống kê", type: "PDF", size: "980 KB", reads: "1.8k lượt đọc" },
    { code: "PRF192", title: "Bài tập con trỏ, mảng và chuỗi có lời giải", type: "DOCX", size: "3.4 MB", reads: "764 lượt đọc" },
    { code: "MAE101", title: "Bộ bài tập đạo hàm và tích phân ôn cuối kỳ", type: "PDF", size: "6.2 MB", reads: "1.1k lượt đọc" },
    { code: "ECO111", title: "Sơ đồ tổng hợp cung, cầu và cân bằng thị trường", type: "PDF", size: "1.7 MB", reads: "592 lượt đọc" },
    { code: "WED201c", title: "Slide xây dựng giao diện web responsive", type: "PPTX", size: "8.9 MB", reads: "1.5k lượt đọc" },
  ];
  const docsList = documentMocks.map((item, index) => {
    const subject = getMockSubject(item.code, index);
    return { ...item, code: subject?.code || item.code };
  });

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
      code: getMockSubject("CSD201", 0)?.code || "CSD201",
      subject: getMockSubject("CSD201", 0)?.name || "Cấu trúc dữ liệu & Giải thuật",
      q: "Độ phức tạp thời gian của thuật toán tìm kiếm nhị phân trên mảng đã sắp xếp kích thước n là:",
      yourAnswer: "O(n)",
      correctAnswer: "O(log n)",
      reason: "Bạn đã nhầm lẫn với tìm kiếm tuyến tính. Tìm kiếm nhị phân chia đôi không gian tìm kiếm sau mỗi bước nên độ phức tạp là O(log n)."
    },
    {
      code: getMockSubject("DBI202", 1)?.code || "DBI202",
      subject: getMockSubject("DBI202", 1)?.name || "Cơ sở dữ liệu",
      q: "Phát biểu nào sau đây đúng về khóa chính (Primary Key) trong một bảng dữ liệu quan hệ?",
      yourAnswer: "Cho phép chứa giá trị NULL nhưng không được trùng lặp.",
      correctAnswer: "Bắt buộc không được chứa giá trị NULL và không được trùng lặp (Unique).",
      reason: "Khóa chính dùng để định danh duy nhất cho một dòng trong bảng, do đó nó không bao giờ được phép chứa giá trị NULL."
    },
    {
      code: getMockSubject("PRO192", 2)?.code || "PRO192",
      subject: getMockSubject("PRO192", 2)?.name || "Lập trình hướng đối tượng",
      q: "Trong Java, từ khóa nào được dùng để gọi constructor của lớp cha?",
      yourAnswer: "this",
      correctAnswer: "super",
      reason: "super() gọi constructor của lớp cha, còn this() gọi một constructor khác trong cùng lớp. Hai lời gọi này phải nằm ở dòng đầu tiên của constructor."
    },
    {
      code: getMockSubject("MAS291", 3)?.code || "MAS291",
      subject: getMockSubject("MAS291", 3)?.name || "Xác suất thống kê",
      q: "Một biến cố chắc chắn có xác suất bằng bao nhiêu?",
      yourAnswer: "0.5",
      correctAnswer: "1",
      reason: "Biến cố chắc chắn luôn xảy ra trong không gian mẫu nên xác suất của nó bằng 1. Xác suất bằng 0 dành cho biến cố không thể xảy ra."
    },
    {
      code: getMockSubject("PRF192", 4)?.code || "PRF192",
      subject: getMockSubject("PRF192", 4)?.name || "Kỹ thuật lập trình C",
      q: "Chỉ số hợp lệ cuối cùng của mảng có n phần tử trong C là bao nhiêu?",
      yourAnswer: "n",
      correctAnswer: "n - 1",
      reason: "Mảng trong C được đánh chỉ số từ 0. Vì vậy mảng có n phần tử sử dụng các chỉ số từ 0 đến n - 1; truy cập vị trí n sẽ vượt giới hạn."
    }
  ];

  return (
    <div
      className="dashboard-shell flex min-h-screen w-full bg-paper-2"
      style={schoolId === "fptu" ? FPT_DASHBOARD_ACCENT : undefined}
    >
      {/* Sidebar */}
      <aside className="dashboard-sidebar sticky top-0 hidden h-[100dvh] w-[268px] self-start flex-none overflow-y-auto overscroll-contain border-r border-line bg-paper lg:block">
        <div className="flex min-h-full flex-col justify-between p-6">
          <div>
            {/* Logo and site title */}
            <div className="border-b border-line px-3 pb-5">
              <Logo size={28} />
              <p className="mt-2 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-3">Không gian ôn tập · {home.abbr}</p>
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
                          type="button"
                          onClick={() => navigateToTab(item.id)}
                          aria-current={isActive ? "page" : undefined}
                          className={`relative flex w-full items-center gap-3 rounded-[7px] px-3 py-2.5 text-left text-[13px] font-medium transition-all duration-200 ${
                            isActive
                              ? "translate-x-1 bg-orange-soft font-semibold text-orange-dark"
                              : "text-ink-2 hover:translate-x-0.5 hover:bg-paper-2 hover:text-ink"
                          }`}
                        >
                          {isActive && <span className="absolute -left-1 h-5 w-0.5 rounded-full bg-orange" aria-hidden="true" />}
                          <item.icon size={15} className={isActive ? "text-orange" : "text-ink-3"} />
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            {/* Quick access */}
            <div className="mt-5 border-t border-line pt-4 space-y-1">
              <h3 className="px-3 text-[10.5px] font-bold text-ink-3 uppercase tracking-wider">
                Truy cập nhanh
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
          <div className="border-t border-line pt-4">
            <DashboardAccountControl
              name={studentName}
              mssv={mssv}
              avatarUrl={avatarUrl}
              menuOpen={isProfileMenuOpen}
              onToggle={() => setIsProfileMenuOpen((open) => !open)}
              onAccount={() => { setIsProfileMenuOpen(false); setIsAccountModalOpen(true); }}
              onSignOut={signOut}
            />
          </div>
        </div>
      </aside>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Đóng menu điều hướng"
            onClick={() => setIsMobileMenuOpen(false)}
            className="absolute inset-0 bg-ink/35 backdrop-blur-[2px]"
          />
          <div
            ref={mobileMenuPanelRef}
            id="dashboard-mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dashboard-mobile-menu-title"
            tabIndex={-1}
            className="dashboard-mobile-drawer absolute inset-y-0 left-0 flex w-[min(86vw,340px)] flex-col overflow-y-auto border-r border-line bg-paper p-5 shadow-2xl outline-none"
          >
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div>
                <Logo size={25} />
                <h2 id="dashboard-mobile-menu-title" className="sr-only">Điều hướng dashboard</h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  mobileMenuButtonRef.current?.focus();
                }}
                aria-label="Đóng menu"
                className="inline-flex h-9 w-9 items-center justify-center rounded-[7px] text-ink-3 transition-colors hover:bg-paper-2 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <nav className="mt-5 space-y-5" aria-label="Điều hướng dashboard">
              {NAV_GROUPS.map((group) => (
                <div key={group.title} className="space-y-1">
                  <h3 className="px-3 text-[10.5px] font-bold uppercase tracking-wider text-ink-3">{group.title}</h3>
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => navigateToTab(item.id)}
                          aria-current={isActive ? "page" : undefined}
                          className={`flex w-full items-center gap-3 rounded-[7px] px-3 py-2.5 text-left text-[13.5px] font-medium transition-colors ${
                            isActive
                              ? "bg-orange-soft font-semibold text-orange-dark"
                              : "text-ink-2 hover:bg-paper-2 hover:text-ink"
                          }`}
                        >
                          <item.icon size={16} className={isActive ? "text-orange" : "text-ink-3"} aria-hidden="true" />
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            <div className="mt-auto border-t border-line pt-4">
              <DashboardAccountControl
                name={studentName}
                mssv={`${mssv} · ${home.abbr}`}
                avatarUrl={avatarUrl}
                menuOpen={isProfileMenuOpen}
                onToggle={() => setIsProfileMenuOpen((open) => !open)}
                onAccount={() => { setIsProfileMenuOpen(false); setIsMobileMenuOpen(false); setIsAccountModalOpen(true); }}
                onSignOut={signOut}
                trailing={<SchoolMark theme={home.theme} abbr={home.abbr} size={22} />}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main */}
      <main className="min-w-0 flex-1 px-5 py-5 lg:px-10 lg:py-8 xl:px-12">
        {/* Mobile header */}
        <div className="sticky top-0 z-30 -mx-5 -mt-5 mb-6 flex items-center justify-between border-b border-line bg-paper-2/95 px-5 py-3.5 backdrop-blur-md lg:hidden">
          <div className="min-w-0">
            <Logo size={24} />
            <p className="mt-1 truncate text-[12px] font-medium text-ink-3">{activeTabLabel}</p>
          </div>
          <button
            ref={mobileMenuButtonRef}
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={isMobileMenuOpen}
            aria-controls="dashboard-mobile-menu"
            aria-label="Mở menu điều hướng"
            className="inline-flex h-10 w-10 items-center justify-center rounded-[8px] border border-line bg-paper text-ink-2 shadow-[var(--shadow-1)] transition-colors hover:border-orange-border hover:bg-orange-soft hover:text-orange-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange"
          >
            <Menu size={19} aria-hidden="true" />
          </button>
        </div>

        {/* Overview Tab Content */}
        {activeTab === "tong-quan" && (
          <div className="dashboard-view space-y-6">
            {/* Stat strip */}
            <div id="tong-quan" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              <Stat icon={<FileCheck2 size={18} />} value="48" label="Đề đã làm" sub="+6 tuần này" tone="ink" />
              <Stat icon={<Target size={18} />} value="7.8" label="Điểm trung bình" sub="thang 10" tone="green" />
              <Stat icon={<BookOpen size={18} />} value="6" label="Môn đang luyện" tone="blue" />
              <Stat icon={<Trophy size={18} />} value="Top 12%" label="Xếp hạng" sub="cùng khóa" tone="orange" />
            </div>

            {/* Chart + History grid */}
            <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]" id="thong-ke">
              <section className="dashboard-panel rounded-[14px] border border-line bg-paper p-5 shadow-[var(--shadow-1)]">
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
              <section className="dashboard-panel rounded-[14px] border border-line bg-paper p-5 shadow-[var(--shadow-1)]" id="lich-su">
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
            <section className="dashboard-panel overflow-hidden rounded-[14px] border border-line bg-paper shadow-[var(--shadow-1)]" id="mon">
              <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
                <div>
                  <h2 className="text-[15px] font-semibold text-ink">Tiếp tục ôn tập</h2>
                  <p className="text-[12.5px] text-ink-3">Các học phần truy cập nhanh của {home.abbr}</p>
                </div>
                <button onClick={() => navigateToTab("de-thi")} className="text-[13px] font-medium text-orange hover:text-orange-dark">
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

        {/* Danh mục môn học */}
        {activeTab === "mon-hoc" && (
          <div className="dashboard-view space-y-6">
            {selectedSubjectForDocs ? (
              <div className="space-y-6">
                {/* Back button and subject info */}
                <div className="flex flex-wrap items-start gap-4 justify-between border-b border-line pb-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedSubjectForDocs(null)}
                      className="inline-flex h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-[6px] border border-line bg-paper px-3 text-[13px] font-semibold text-ink-2 transition-colors hover:bg-paper-2 hover:text-ink"
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
                            <p className="mt-1 text-[12.5px] text-ink-3">
                              <span className="block">Slide bài giảng {selectedSubjectForDocs.code} · Chương {idx + 1}</span>
                              <span className="mt-0.5 block font-semibold text-orange">PPTX (PowerPoint)</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center sm:self-start md:self-auto">
                          <button
                            onClick={() => setPreviewingSlide({ chapterTitle: ch.title, slides: ch.slides, slideIndex: 0 })}
                            className="inline-flex h-9 items-center gap-1.5 rounded-[6px] bg-orange px-4 text-[13px] font-semibold text-white hover:bg-orange-dark transition-colors"
                          >
                            <Eye size={14} /> Xem trực tiếp
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
                    <h1 className="dashboard-title font-display text-[26px] font-semibold text-ink">Danh mục môn học</h1>
                    <p className="mt-1 text-[15px] text-ink-2">Tra cứu học phần và tài liệu ôn tập theo chương trình của {home.name}.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="rounded-[8px] border border-line bg-paper px-4 py-2 text-[13px] shadow-[var(--shadow-1)]">
                      <span className="tnum font-semibold text-ink">{subjects.length}</span> môn học
                    </div>
                    {schoolId === "fptu" && (
                      <button
                        type="button"
                        onClick={() => setExpandedTerms(expandedTerms.size > 0 ? new Set() : new Set(Array.from({ length: 9 }, (_, index) => index + 1)))}
                        className="inline-flex h-9 items-center rounded-[8px] border border-line bg-paper px-3 text-[12.5px] font-semibold text-ink-2 transition-colors hover:border-orange-border hover:bg-orange-soft hover:text-orange-dark"
                      >
                        {expandedTerms.size > 0 ? "Thu gọn các kỳ" : "Mở tất cả kỳ"}
                      </button>
                    )}
                  </div>
                </div>

                {/* Filter controls */}
                <div className="rounded-[9px] border border-line bg-paper p-3 shadow-[var(--shadow-1)]">
                  <div className="flex flex-col gap-2.5 md:flex-row md:items-center">
                    <div className="relative min-w-0 flex-1">
                      <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" aria-hidden="true" />
                      <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Tìm theo tên hoặc mã môn..."
                        aria-label="Tìm môn học theo tên hoặc mã"
                        className="h-10 w-full rounded-[7px] border border-line bg-paper-2 pl-9 pr-3 text-[13.5px] outline-none placeholder:text-ink-3 focus:border-orange focus:bg-paper"
                      />
                    </div>

                    {schoolId === "fptu" && (
                      <select
                        value={selectedTerm ?? ""}
                        onChange={(e) => {
                          const term = e.target.value ? Number(e.target.value) : null;
                          setSelectedTerm(term);
                          if (term) setExpandedTerms((current) => new Set(current).add(term));
                        }}
                        aria-label="Lọc theo kỳ học"
                        className="h-10 rounded-[7px] border border-line bg-paper px-3 text-[13px] font-medium text-ink-2 outline-none focus:border-orange md:w-[145px]"
                      >
                        <option value="">Tất cả kỳ học</option>
                        {Array.from({ length: 9 }, (_, index) => index + 1).map((term) => (
                          <option key={term} value={term}>Kỳ {term}</option>
                        ))}
                      </select>
                    )}

                    <select
                      value={selectedFaculty ?? ""}
                      onChange={(e) => setSelectedFaculty(e.target.value || null)}
                      aria-label="Lọc theo nhóm môn"
                      className="h-10 rounded-[7px] border border-line bg-paper px-3 text-[13px] font-medium text-ink-2 outline-none focus:border-orange md:w-[210px]"
                    >
                      <option value="">Tất cả nhóm môn</option>
                      {faculties.map((faculty) => (
                        <option key={faculty} value={faculty}>{faculty}</option>
                      ))}
                    </select>

                    {(searchQuery || selectedTerm || selectedFaculty) && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery("");
                          setSelectedTerm(null);
                          setSelectedFaculty(null);
                        }}
                        className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-[7px] border border-line bg-paper px-3 text-[12.5px] font-semibold text-ink-2 transition-colors hover:border-orange-border hover:bg-orange-soft hover:text-orange-dark"
                      >
                        <X size={14} aria-hidden="true" /> Xóa lọc
                      </button>
                    )}
                  </div>
                </div>

                {/* Subjects List */}
                {filteredSubjects.length === 0 ? (
                  <div className="rounded-[10px] border border-line bg-paper p-10 text-center shadow-[var(--shadow-1)]">
                    <p className="text-[14.5px] font-medium text-ink">Không tìm thấy môn học nào phù hợp</p>
                    <p className="mt-1 text-[13px] text-ink-3">Thử thay đổi từ khóa tìm kiếm hoặc chọn chuyên ngành khác.</p>
                  </div>
                ) : (
                  schoolId === "fptu" ? (
                    <div className="space-y-8">
                      {fptTermGroups.map((group) => (
                        <section key={group.term} aria-labelledby={`dashboard-term-${group.term}`}>
                          <button
                            type="button"
                            onClick={() => setExpandedTerms((current) => {
                              const next = new Set(current);
                              if (next.has(group.term)) next.delete(group.term);
                              else next.add(group.term);
                              return next;
                            })}
                            aria-expanded={expandedTerms.has(group.term)}
                            aria-controls={`dashboard-term-subjects-${group.term}`}
                            className="mb-3 flex w-full items-center gap-3 border-b-2 border-orange pb-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2"
                          >
                            <span className="tnum inline-flex h-10 w-10 items-center justify-center rounded-[8px] bg-orange text-[18px] font-bold text-white shadow-sm">
                              {group.term}
                            </span>
                            <span>
                              <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-orange-dark">Học kỳ</span>
                              <span id={`dashboard-term-${group.term}`} className="block font-display text-[22px] font-semibold leading-tight text-ink">
                                Kỳ {group.term}
                              </span>
                            </span>
                            <span className="tnum ml-auto rounded-full border border-line bg-paper px-3 py-1 text-[12px] font-semibold text-ink-2">
                              {group.subjects.length} môn học
                            </span>
                            <ChevronDown
                              size={18}
                              aria-hidden="true"
                              className={`text-ink-3 transition-transform ${expandedTerms.has(group.term) ? "rotate-180" : ""}`}
                            />
                          </button>
                          {expandedTerms.has(group.term) && (
                            <div id={`dashboard-term-subjects-${group.term}`} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                              {group.subjects.map(renderSubjectCard)}
                            </div>
                          )}
                        </section>
                      ))}
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {filteredSubjects.map(renderSubjectCard)}
                    </div>
                  )
                )}
              </>
            )}
          </div>
        )}

        {/* Đọc tài liệu Tab Content */}
        {activeTab === "tai-lieu" && (
          <div className="dashboard-view space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h1 className="dashboard-title font-display text-[26px] font-semibold text-ink">Tài liệu ôn tập</h1>
                <p className="mt-1 text-[15px] text-ink-2">Giáo trình và slide đang có trong ExamCure, sắp theo từng học phần.</p>
              </div>
              <span className="tnum rounded-full border border-line bg-paper px-3 py-1 text-[12px] font-semibold text-ink-2">
                {docsList.length} tài liệu
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {docsList.map((doc, i) => (
                <div key={i} className="flex items-start gap-4 rounded-[10px] border border-line bg-paper p-4 shadow-[var(--shadow-1)] hover:border-orange transition-colors">
                  <div className="rounded-[6px] bg-orange-soft p-3 text-orange">
                    <FileText size={24} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="rounded bg-paper-2 border border-line px-1.5 py-0.5 font-mono text-[10px] font-medium text-ink-3">{doc.code}</span>
                    <h3 className="mt-1.5 truncate text-[14.5px] font-semibold text-ink" title={doc.title}>{doc.title}</h3>
                    <p className="mt-1 text-[12px] text-ink-3">{doc.type} · {doc.size} · {doc.reads}</p>
                    <button
                      type="button"
                      onClick={() => {
                        const subject = subjects.find((item) => item.code === doc.code);
                        if (subject) {
                          setSelectedSubjectForDocs(subject);
                          navigateToTab("mon-hoc");
                        }
                      }}
                      className="mt-3.5 inline-flex h-8 items-center gap-1.5 rounded-[5px] border border-orange-border bg-orange-soft px-3 text-[12px] font-semibold text-orange-dark transition-colors hover:bg-orange hover:text-white"
                    >
                      <Eye size={13} aria-hidden="true" /> Mở tài liệu
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "flashcards" && <div className="dashboard-view"><FlashcardWorkspace /></div>}

        {/* Luyện câu hỏi nhanh Tab Content */}
        {activeTab === "trac-nghiem" && (
          <div className="dashboard-view space-y-6">
            <div>
              <h1 className="dashboard-title font-display text-[26px] font-semibold text-ink">Luyện câu hỏi trắc nghiệm nhanh</h1>
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
          <div className="dashboard-view space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h1 className="dashboard-title font-display text-[26px] font-semibold text-ink">Sổ tay câu sai</h1>
                <p className="mt-1 text-[15px] text-ink-2">Xem lại những câu đã làm sai và lý do để tránh lặp lại lỗi cũ.</p>
              </div>
              <span className="tnum rounded-full border border-line bg-paper px-3 py-1 text-[12px] font-semibold text-ink-2">
                {incorrectQuestions.length} câu cần xem lại
              </span>
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
                    <strong className="text-ink font-semibold block mb-0.5">Vì sao đáp án này đúng:</strong>
                    {q.reason}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Đề thi gợi ý Tab Content */}
        {activeTab === "de-thi" && (
          <div className="dashboard-view space-y-6">
            <div>
              <h1 className="dashboard-title font-display text-[26px] font-semibold text-ink">Đề luyện tập</h1>
              <p className="mt-1 text-[15px] text-ink-2">Chọn một học phần để bắt đầu bài luyện theo thời gian.</p>
            </div>

            <section className="rounded-[10px] border border-line bg-paper shadow-[var(--shadow-1)]">
              <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
                <div>
                  <h2 className="text-[15px] font-semibold text-ink">Học phần truy cập nhanh</h2>
                  <p className="text-[12.5px] text-ink-3">Danh sách bài luyện của {home.abbr}</p>
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
          <div className="dashboard-view space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h1 className="dashboard-title font-display text-[26px] font-semibold text-ink">Lịch sử thi gần đây</h1>
                <p className="mt-1 text-[15px] text-ink-2">Kết quả thi thử và lưu trữ bài làm của bạn tại {home.name}.</p>
              </div>
              <span className="tnum rounded-full border border-line bg-paper px-3 py-1 text-[12px] font-semibold text-ink-2">
                {history.length} lượt thi
              </span>
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

      </main>

      {/* Slide Preview Modal */}
      {previewingSlide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="slide-preview-title"
            aria-describedby="slide-preview-description"
            className="relative flex min-h-[480px] w-full max-w-4xl flex-col overflow-hidden rounded-[16px] border border-line bg-paper shadow-2xl"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-line px-6 py-4 bg-paper-2">
              <div>
                <h3 id="slide-preview-title" className="text-[16.5px] font-bold text-ink">{previewingSlide.chapterTitle}</h3>
                <p id="slide-preview-description" className="text-[12px] text-ink-3">Bản xem trước nội dung slide</p>
              </div>
              <button
                type="button"
                autoFocus
                onClick={() => setPreviewingSlide(null)}
                aria-label="Đóng bản xem trước"
                className="rounded-full p-1.5 hover:bg-line text-ink-3 hover:text-ink transition-colors"
              >
                <X size={18} aria-hidden="true" />
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
            <div className="flex items-center justify-end border-t border-line bg-paper-2 px-6 py-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={previewingSlide.slideIndex === 0}
                  onClick={() => setPreviewingSlide({ ...previewingSlide, slideIndex: previewingSlide.slideIndex - 1 })}
                  aria-label="Xem slide trước"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-[6px] border border-line bg-paper text-ink-2 hover:bg-paper-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={16} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  disabled={previewingSlide.slideIndex === previewingSlide.slides.length - 1}
                  onClick={() => setPreviewingSlide({ ...previewingSlide, slideIndex: previewingSlide.slideIndex + 1 })}
                  aria-label="Xem slide tiếp theo"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-[6px] border border-line bg-paper text-ink-2 hover:bg-paper-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={16} aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isAccountModalOpen && (
        <div className="fixed inset-0 z-[70] grid place-items-center p-4" role="presentation">
          <button type="button" aria-label="Đóng thông tin tài khoản" onClick={() => setIsAccountModalOpen(false)} className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]" />
          <section role="dialog" aria-modal="true" aria-labelledby="account-modal-title" className="relative w-full max-w-md rounded-[14px] border border-line bg-paper p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-[12px] font-semibold uppercase tracking-wide text-orange">Hồ sơ</p><h2 id="account-modal-title" className="mt-1 text-[21px] font-bold text-ink">Thông tin tài khoản</h2></div>
              <button type="button" onClick={() => setIsAccountModalOpen(false)} aria-label="Đóng" className="grid h-9 w-9 place-items-center rounded-[7px] text-ink-3 hover:bg-paper-2 hover:text-ink"><X size={18} /></button>
            </div>
            <div className="mt-6 flex items-center gap-4 rounded-[10px] border border-line bg-paper-2 p-4">
              <Avatar size={56} name={studentName} avatarUrl={avatarUrl} />
              <div className="min-w-0"><p className="truncate text-[16px] font-semibold text-ink">{studentName}</p><p className="truncate text-[13px] text-ink-3">{user?.email || "Chưa có email"}</p></div>
            </div>
            <dl className="mt-5 divide-y divide-line rounded-[10px] border border-line px-4">
              <div className="flex items-center justify-between gap-4 py-3"><dt className="text-[13px] text-ink-3">Mã sinh viên</dt><dd className="text-right text-[13px] font-semibold text-ink">{mssv}</dd></div>
              <div className="flex items-center justify-between gap-4 py-3"><dt className="text-[13px] text-ink-3">Trường</dt><dd className="text-right text-[13px] font-semibold text-ink">{home.name}</dd></div>
              <div className="flex items-center justify-between gap-4 py-3"><dt className="text-[13px] text-ink-3">Vai trò</dt><dd className="text-right text-[13px] font-semibold capitalize text-ink">{user?.role || "student"}</dd></div>
            </dl>
          </section>
        </div>
      )}
    </div>
  );
}

function DashboardAccountControl({
  name,
  mssv,
  avatarUrl,
  menuOpen,
  onToggle,
  onAccount,
  onSignOut,
  trailing,
}: {
  name: string;
  mssv: string;
  avatarUrl?: string;
  menuOpen: boolean;
  onToggle: () => void;
  onAccount: () => void;
  onSignOut: () => void;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="relative">
      <button type="button" onClick={onToggle} aria-expanded={menuOpen} aria-haspopup="menu" className="flex w-full items-center gap-3 rounded-[8px] border border-line bg-paper-2 p-3 text-left transition-colors hover:border-line-strong hover:bg-paper-3">
        <Avatar size={38} name={name} avatarUrl={avatarUrl} />
        <div className="min-w-0 flex-1"><p className="truncate text-[13.5px] font-semibold leading-tight text-ink">{name}</p><p className="mt-0.5 truncate text-[11px] text-ink-3">{mssv}</p></div>
        {trailing || <ChevronDown size={16} className={`shrink-0 text-ink-3 transition-transform ${menuOpen ? "rotate-180" : ""}`} />}
      </button>
      {menuOpen && (
        <div role="menu" className="absolute bottom-[calc(100%+8px)] left-0 z-20 w-full overflow-hidden rounded-[9px] border border-line bg-paper p-1 shadow-[var(--shadow-pop)]">
          <button type="button" role="menuitem" onClick={onAccount} className="flex w-full items-center gap-2 rounded-[6px] px-3 py-2.5 text-left text-[13px] font-medium text-ink-2 hover:bg-paper-2 hover:text-ink"><UserRound size={15} /> Thông tin tài khoản</button>
          <button type="button" role="menuitem" onClick={onSignOut} className="flex w-full items-center gap-2 rounded-[6px] px-3 py-2.5 text-left text-[13px] font-medium text-danger hover:bg-danger-soft"><LogOut size={15} /> Đăng xuất</button>
        </div>
      )}
    </div>
  );
}

function Avatar({ size = 36, name = "Student", avatarUrl }: { size?: number; name?: string; avatarUrl?: string }) {
  if (avatarUrl) {
    return <img src={avatarUrl} alt="" width={size} height={size} className="shrink-0 rounded-full object-cover" referrerPolicy="no-referrer" />;
  }
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
    <div className="dashboard-metric group rounded-[12px] border border-line bg-paper p-4 shadow-[var(--shadow-1)] transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-1 hover:border-orange-border hover:shadow-[var(--shadow-2)]">
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-[7px] bg-paper-2 transition-colors group-hover:bg-orange-soft" style={{ color }}>{icon}</span>
        {sub && <span className="text-right text-[10.5px] font-medium text-ink-3">{sub}</span>}
      </div>
      <p className="tnum mt-3 text-[25px] font-semibold leading-none" style={{ color }}>
        {value}
      </p>
      <p className="mt-1 text-[13px] font-medium text-ink-2">{label}</p>
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
