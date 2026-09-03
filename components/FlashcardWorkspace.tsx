"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  Layers,
  Plus,
  RotateCw,
  Search,
  Trash2,
  XCircle,
} from "lucide-react";

type Flashcard = {
  front: string;
  back: string;
};

type FlashcardDeck = {
  id: string;
  code: string;
  title: string;
  description: string;
  cards: Flashcard[];
  source: "system" | "personal";
};

const SYSTEM_DECKS: FlashcardDeck[] = [
  {
    id: "system-csd201",
    code: "CSD201",
    title: "Cấu trúc dữ liệu cốt lõi",
    description: "Độ phức tạp, danh sách liên kết, ngăn xếp, hàng đợi và cây tìm kiếm.",
    source: "system",
    cards: [
      { front: "Trường hợp xấu nhất của QuickSort có độ phức tạp là bao nhiêu?", back: "O(n²), thường xảy ra khi phần tử chốt liên tục chia mảng thành hai phần rất lệch." },
      { front: "Nguyên lý FIFO tương ứng với cấu trúc dữ liệu nào?", back: "Queue — hàng đợi xử lý phần tử được thêm vào trước." },
      { front: "Duyệt cây BST theo thứ tự nào sẽ cho dãy khóa tăng dần?", back: "In-order: duyệt cây con trái, nút gốc rồi cây con phải." },
      { front: "Thao tác push và pop thuộc cấu trúc dữ liệu nào?", back: "Stack — ngăn xếp hoạt động theo nguyên lý vào sau, ra trước." },
    ],
  },
  {
    id: "system-dbi202",
    code: "DBI202",
    title: "Cơ sở dữ liệu quan hệ",
    description: "Khóa, quan hệ, chuẩn hóa dữ liệu và các câu lệnh SQL thường gặp.",
    source: "system",
    cards: [
      { front: "Khóa ngoại dùng để làm gì?", back: "Tạo liên kết giữa hai bảng và duy trì tính toàn vẹn tham chiếu." },
      { front: "Điều kiện của dạng chuẩn 2NF là gì?", back: "Bảng ở 1NF và mọi thuộc tính không khóa phụ thuộc đầy đủ vào toàn bộ khóa chính." },
      { front: "INNER JOIN trả về những bản ghi nào?", back: "Chỉ các bản ghi có giá trị khớp ở cả hai bảng tham gia phép nối." },
      { front: "Mệnh đề HAVING khác WHERE ở điểm nào?", back: "WHERE lọc trước khi nhóm; HAVING lọc kết quả sau khi GROUP BY." },
    ],
  },
  {
    id: "system-pro192",
    code: "PRO192",
    title: "Lập trình hướng đối tượng",
    description: "Đóng gói, kế thừa, đa hình và xử lý ngoại lệ trong Java.",
    source: "system",
    cards: [
      { front: "Tính đóng gói giải quyết vấn đề gì?", back: "Che giấu trạng thái bên trong đối tượng và kiểm soát cách dữ liệu được truy cập." },
      { front: "Từ khóa nào gọi constructor của lớp cha trong Java?", back: "super(). Lời gọi này phải đứng đầu constructor của lớp con." },
      { front: "Method overriding là gì?", back: "Lớp con cung cấp cách triển khai mới cho phương thức đã được khai báo ở lớp cha." },
      { front: "Checked exception cần được xử lý như thế nào?", back: "Phải được bắt bằng try-catch hoặc khai báo bằng throws trong chữ ký phương thức." },
    ],
  },
  {
    id: "system-mas291",
    code: "MAS291",
    title: "Xác suất và thống kê",
    description: "Biến cố, phân phối xác suất, kỳ vọng và kiểm định giả thuyết.",
    source: "system",
    cards: [
      { front: "Tổng xác suất của toàn bộ không gian mẫu bằng bao nhiêu?", back: "Bằng 1 vì không gian mẫu chứa tất cả kết quả có thể xảy ra." },
      { front: "Kỳ vọng của biến ngẫu nhiên rời rạc được tính thế nào?", back: "Lấy tổng của từng giá trị nhân với xác suất tương ứng của giá trị đó." },
      { front: "Độ lệch chuẩn đo lường điều gì?", back: "Mức độ phân tán của dữ liệu quanh giá trị trung bình." },
      { front: "Khi nào bác bỏ giả thuyết H0 theo p-value?", back: "Khi p-value nhỏ hơn mức ý nghĩa alpha đã chọn." },
    ],
  },
  {
    id: "system-wed201c",
    code: "WED201c",
    title: "Nền tảng phát triển web",
    description: "HTML ngữ nghĩa, CSS responsive và kiến thức HTTP cơ bản.",
    source: "system",
    cards: [
      { front: "HTTP status 404 biểu thị điều gì?", back: "Máy chủ không tìm thấy tài nguyên tương ứng với địa chỉ được yêu cầu." },
      { front: "Thẻ HTML nào phù hợp nhất cho vùng điều hướng chính?", back: "Thẻ nav, vì nó mô tả một vùng chứa các liên kết điều hướng." },
      { front: "Media query được dùng để làm gì?", back: "Áp dụng CSS theo đặc điểm thiết bị hoặc vùng hiển thị, thường dùng cho responsive." },
      { front: "Thuộc tính box-sizing: border-box thay đổi cách tính kích thước ra sao?", back: "Width và height sẽ bao gồm cả padding lẫn border của phần tử." },
    ],
  },
];

const INITIAL_PERSONAL_DECKS: FlashcardDeck[] = [
  {
    id: "personal-java-review",
    code: "PRO192",
    title: "Java — phần mình hay nhầm",
    description: "Bộ thẻ tự tổng hợp sau các lần luyện đề.",
    source: "personal",
    cards: [
      { front: "this() và super() có thể cùng xuất hiện trong một constructor không?", back: "Không. Cả hai đều phải nằm ở dòng đầu tiên nên chỉ có thể gọi một trong hai." },
      { front: "Biến được khai báo final có ý nghĩa gì?", back: "Giá trị hoặc tham chiếu của biến chỉ được gán một lần." },
      { front: "Interface có thể được khởi tạo trực tiếp không?", back: "Không. Cần một lớp triển khai hoặc một lớp ẩn danh." },
    ],
  },
  {
    id: "personal-sql-midterm",
    code: "DBI202",
    title: "SQL trước giữa kỳ",
    description: "Các cú pháp cần ôn lại trước bài kiểm tra.",
    source: "personal",
    cards: [
      { front: "COUNT(*) có đếm dòng chứa NULL không?", back: "Có. COUNT(*) đếm toàn bộ dòng; COUNT(column) bỏ qua các giá trị NULL của cột đó." },
      { front: "Cách sắp xếp kết quả theo thứ tự giảm dần?", back: "Dùng ORDER BY tên_cột DESC." },
    ],
  },
];

const EMPTY_DRAFT_CARD: Flashcard = { front: "", back: "" };

export function FlashcardWorkspace() {
  const [libraryView, setLibraryView] = useState<"system" | "personal">("system");
  const [query, setQuery] = useState("");
  const [personalDecks, setPersonalDecks] = useState<FlashcardDeck[]>(INITIAL_PERSONAL_DECKS);
  const [studyDeck, setStudyDeck] = useState<FlashcardDeck | null>(null);
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knowCount, setKnowCount] = useState(0);
  const [dontKnowCount, setDontKnowCount] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftCode, setDraftCode] = useState("");
  const [draftCards, setDraftCards] = useState<Flashcard[]>([{ ...EMPTY_DRAFT_CARD }]);

  const visibleDecks = useMemo(() => {
    const source = libraryView === "system" ? SYSTEM_DECKS : personalDecks;
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return source;
    return source.filter((deck) =>
      [deck.code, deck.title, deck.description].some((value) => value.toLowerCase().includes(normalizedQuery))
    );
  }, [libraryView, personalDecks, query]);

  const completedDraftCards = draftCards.filter((card) => card.front.trim() && card.back.trim());
  const canCreateDeck = draftTitle.trim().length > 0 && completedDraftCards.length > 0;

  const resetStudy = () => {
    setCardIndex(0);
    setIsFlipped(false);
    setKnowCount(0);
    setDontKnowCount(0);
  };

  const startStudy = (deck: FlashcardDeck) => {
    resetStudy();
    setStudyDeck(deck);
  };

  const closeCreateForm = () => {
    setIsCreating(false);
    setDraftTitle("");
    setDraftCode("");
    setDraftCards([{ ...EMPTY_DRAFT_CARD }]);
  };

  const createDeck = () => {
    if (!canCreateDeck) return;
    const newDeck: FlashcardDeck = {
      id: `personal-${Date.now()}`,
      code: draftCode.trim().toUpperCase() || "CÁ NHÂN",
      title: draftTitle.trim(),
      description: "Bộ thẻ do bạn tự tạo.",
      cards: completedDraftCards.map((card) => ({ front: card.front.trim(), back: card.back.trim() })),
      source: "personal",
    };
    setPersonalDecks((current) => [newDeck, ...current]);
    closeCreateForm();
  };

  if (studyDeck) {
    const currentCard = studyDeck.cards[cardIndex];
    return (
      <div className="space-y-5">
        <button
          type="button"
          onClick={() => setStudyDeck(null)}
          className="inline-flex h-9 items-center gap-2 rounded-[6px] border border-line bg-paper px-3 text-[13px] font-semibold text-ink-2 transition-colors hover:bg-paper-2 hover:text-ink"
        >
          <ArrowLeft size={15} aria-hidden="true" /> Quay lại kho thẻ
        </button>

        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4">
          <div>
            <span className="rounded border border-orange-border bg-orange-soft px-1.5 py-0.5 font-mono text-[10px] font-bold text-orange-dark">{studyDeck.code}</span>
            <h1 className="mt-2 font-display text-[26px] font-semibold text-ink">{studyDeck.title}</h1>
            <p className="mt-1 text-[14px] text-ink-2">{studyDeck.cards.length} thẻ · {studyDeck.source === "system" ? "Bộ thẻ hệ thống" : "Bộ thẻ của bạn"}</p>
          </div>
          <div className="flex gap-3 text-[12.5px]">
            <span className="font-medium text-green">Đã thuộc {knowCount}</span>
            <span className="font-medium text-orange">Cần học lại {dontKnowCount}</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between px-1 text-[13px] text-ink-3">
            <span>Thẻ <strong className="tnum font-semibold text-ink">{cardIndex + 1}/{studyDeck.cards.length}</strong></span>
            <span>{isFlipped ? "Đáp án" : "Câu hỏi"}</span>
          </div>

          <button
            type="button"
            onClick={() => setIsFlipped((current) => !current)}
            aria-pressed={isFlipped}
            aria-label={isFlipped ? "Đang hiện đáp án. Nhấn để xem lại câu hỏi" : "Đang hiện câu hỏi. Nhấn để xem đáp án"}
            className="relative flex min-h-[280px] w-full flex-col items-center justify-between rounded-[14px] border border-line bg-paper p-6 text-center shadow-[var(--shadow-1)] transition-[border-color,box-shadow] hover:border-orange-border hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2"
          >
            <span className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-ink-3">{isFlipped ? "Đáp án / Giải thích" : "Câu hỏi / Khái niệm"}</span>
            <p className="w-full select-none px-2 py-7 text-[17px] font-medium leading-relaxed text-ink sm:px-8 sm:text-[19px]">
              {isFlipped ? currentCard.back : currentCard.front}
            </p>
            <span className="flex items-center gap-1.5 text-[12px] font-semibold text-orange-dark">
              <RotateCw size={13} aria-hidden="true" /> {isFlipped ? "Nhấn để xem câu hỏi" : "Nhấn để xem đáp án"}
            </span>
          </button>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setDontKnowCount((current) => current + 1);
                setIsFlipped(false);
                setCardIndex((current) => (current + 1) % studyDeck.cards.length);
              }}
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-[8px] border border-line bg-paper px-3 text-[13px] font-semibold text-ink-2 transition-colors hover:bg-paper-2 hover:text-ink sm:text-[14px]"
            >
              <XCircle size={17} className="text-red" aria-hidden="true" /> Cần học lại
            </button>
            <button
              type="button"
              onClick={() => {
                setKnowCount((current) => current + 1);
                setIsFlipped(false);
                setCardIndex((current) => (current + 1) % studyDeck.cards.length);
              }}
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-[8px] bg-orange px-3 text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-orange-dark sm:text-[14px]"
            >
              <CheckCircle2 size={17} aria-hidden="true" /> Đã thuộc
            </button>
          </div>

          <div className="flex justify-center pt-1">
            <button type="button" onClick={resetStudy} className="text-[12.5px] font-medium text-ink-3 hover:text-orange-dark">
              Học lại từ đầu
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="dashboard-title font-display text-[26px] font-semibold text-ink">Thẻ ghi nhớ</h1>
        <p className="mt-1 text-[15px] text-ink-2">Chọn bộ thẻ có sẵn hoặc tự tạo nội dung theo cách bạn dễ nhớ nhất.</p>
      </div>

      <div className="rounded-[10px] border border-line bg-paper p-3 shadow-[var(--shadow-1)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="inline-flex rounded-[7px] bg-paper-2 p-1" role="tablist" aria-label="Nguồn thẻ ghi nhớ">
            <button
              type="button"
              role="tab"
              aria-selected={libraryView === "system"}
              onClick={() => {
                setLibraryView("system");
                setQuery("");
                setIsCreating(false);
              }}
              className={`rounded-[6px] px-3.5 py-2 text-[13px] font-semibold transition-colors ${libraryView === "system" ? "bg-paper text-orange-dark shadow-sm" : "text-ink-3 hover:text-ink"}`}
            >
              Kho thẻ hệ thống
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={libraryView === "personal"}
              onClick={() => {
                setLibraryView("personal");
                setQuery("");
              }}
              className={`rounded-[6px] px-3.5 py-2 text-[13px] font-semibold transition-colors ${libraryView === "personal" ? "bg-paper text-orange-dark shadow-sm" : "text-ink-3 hover:text-ink"}`}
            >
              Thẻ của tôi <span className="tnum ml-1 text-[11px]">{personalDecks.length}</span>
            </button>
          </div>

          <div className="relative min-w-0 flex-1">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={libraryView === "system" ? "Tìm theo mã hoặc tên môn..." : "Tìm trong thẻ của tôi..."}
              aria-label="Tìm bộ thẻ ghi nhớ"
              className="h-10 w-full rounded-[7px] border border-line bg-paper-2 pl-9 pr-3 text-[13.5px] outline-none placeholder:text-ink-3 focus:border-orange focus:bg-paper"
            />
          </div>

          {libraryView === "personal" && (
            <button
              type="button"
              onClick={() => setIsCreating((current) => !current)}
              className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-[7px] bg-orange px-4 text-[13px] font-semibold text-white transition-colors hover:bg-orange-dark"
            >
              <Plus size={15} aria-hidden="true" /> Tạo bộ thẻ
            </button>
          )}
        </div>
      </div>

      {libraryView === "personal" && isCreating && (
        <section aria-labelledby="create-flashcard-deck-title" className="rounded-[12px] border border-orange-border bg-orange-soft/35 p-4 shadow-[var(--shadow-1)] sm:p-5">
          <div className="flex items-start justify-between gap-4 border-b border-orange-border pb-4">
            <div>
              <h2 id="create-flashcard-deck-title" className="text-[17px] font-bold text-ink">Tạo bộ thẻ mới</h2>
              <p className="mt-0.5 text-[12.5px] text-ink-3">Nhập ít nhất một cặp câu hỏi và đáp án.</p>
            </div>
            <button type="button" onClick={closeCreateForm} className="text-[12.5px] font-semibold text-ink-3 hover:text-ink">Hủy</button>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_180px]">
            <label className="space-y-1.5 text-[12px] font-semibold text-ink-2">
              Tên bộ thẻ
              <input
                value={draftTitle}
                onChange={(event) => setDraftTitle(event.target.value)}
                placeholder="Ví dụ: Công thức cần nhớ trước cuối kỳ"
                className="h-10 w-full rounded-[7px] border border-line bg-paper px-3 text-[13.5px] font-normal text-ink outline-none placeholder:text-ink-3 focus:border-orange"
              />
            </label>
            <label className="space-y-1.5 text-[12px] font-semibold text-ink-2">
              Mã môn
              <input
                value={draftCode}
                onChange={(event) => setDraftCode(event.target.value)}
                placeholder="VD: CSD201"
                className="h-10 w-full rounded-[7px] border border-line bg-paper px-3 font-mono text-[13px] font-normal uppercase text-ink outline-none placeholder:font-sans placeholder:text-ink-3 focus:border-orange"
              />
            </label>
          </div>

          <div className="mt-5 space-y-3">
            {draftCards.map((card, index) => (
              <div key={index} className="rounded-[9px] border border-line bg-paper p-3.5">
                <div className="mb-2.5 flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-ink-3">Thẻ {index + 1}</span>
                  {draftCards.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setDraftCards((current) => current.filter((_, cardIndex) => cardIndex !== index))}
                      aria-label={`Xóa thẻ ${index + 1}`}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-[5px] text-ink-3 hover:bg-red-soft hover:text-red"
                    >
                      <Trash2 size={14} aria-hidden="true" />
                    </button>
                  )}
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="space-y-1.5 text-[12px] font-semibold text-ink-2">
                    Mặt trước
                    <textarea
                      value={card.front}
                      onChange={(event) => setDraftCards((current) => current.map((item, cardIndex) => cardIndex === index ? { ...item, front: event.target.value } : item))}
                      placeholder="Câu hỏi hoặc thuật ngữ"
                      rows={3}
                      className="w-full resize-y rounded-[7px] border border-line bg-paper-2 px-3 py-2 text-[13px] font-normal text-ink outline-none placeholder:text-ink-3 focus:border-orange focus:bg-paper"
                    />
                  </label>
                  <label className="space-y-1.5 text-[12px] font-semibold text-ink-2">
                    Mặt sau
                    <textarea
                      value={card.back}
                      onChange={(event) => setDraftCards((current) => current.map((item, cardIndex) => cardIndex === index ? { ...item, back: event.target.value } : item))}
                      placeholder="Đáp án hoặc phần giải thích"
                      rows={3}
                      className="w-full resize-y rounded-[7px] border border-line bg-paper-2 px-3 py-2 text-[13px] font-normal text-ink outline-none placeholder:text-ink-3 focus:border-orange focus:bg-paper"
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setDraftCards((current) => [...current, { ...EMPTY_DRAFT_CARD }])}
              className="inline-flex h-9 items-center gap-1.5 rounded-[6px] border border-line bg-paper px-3 text-[12.5px] font-semibold text-ink-2 hover:border-orange-border hover:text-orange-dark"
            >
              <Plus size={14} aria-hidden="true" /> Thêm thẻ
            </button>
            <div className="flex items-center gap-3">
              <span className="text-[11.5px] text-ink-3">Dữ liệu được giữ trong phiên demo này.</span>
              <button
                type="button"
                disabled={!canCreateDeck}
                onClick={createDeck}
                className="inline-flex h-9 items-center rounded-[6px] bg-orange px-4 text-[12.5px] font-semibold text-white transition-colors hover:bg-orange-dark disabled:cursor-not-allowed disabled:opacity-45"
              >
                Lưu bộ thẻ
              </button>
            </div>
          </div>
        </section>
      )}

      <section aria-label={libraryView === "system" ? "Kho thẻ hệ thống" : "Bộ thẻ của tôi"}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-orange" aria-hidden="true" />
            <h2 className="text-[15px] font-bold text-ink">{libraryView === "system" ? "Bộ thẻ theo môn học" : "Bộ thẻ bạn đã tạo"}</h2>
          </div>
          <span className="tnum text-[12px] font-medium text-ink-3">{visibleDecks.length} bộ thẻ</span>
        </div>

        {visibleDecks.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {visibleDecks.map((deck) => (
              <button
                key={deck.id}
                type="button"
                onClick={() => startStudy(deck)}
                aria-label={`Học bộ thẻ ${deck.title}`}
                className="group flex min-h-[170px] flex-col justify-between rounded-[10px] border border-line bg-paper p-4 text-left shadow-[var(--shadow-1)] transition-[border-color,transform] hover:-translate-y-0.5 hover:border-orange-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2"
              >
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded border border-orange-border bg-orange-soft px-1.5 py-0.5 font-mono text-[10px] font-bold text-orange-dark">{deck.code}</span>
                    <span className="tnum text-[11.5px] font-medium text-ink-3">{deck.cards.length} thẻ</span>
                  </div>
                  <h3 className="mt-3 text-[15px] font-bold text-ink">{deck.title}</h3>
                  <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-relaxed text-ink-3">{deck.description}</p>
                </div>
                <span className="mt-4 flex items-center border-t border-line pt-3 text-[12px] font-semibold text-orange-dark">
                  Học bộ thẻ
                  <ArrowUpRight size={14} className="ml-auto transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-[10px] border border-dashed border-line-strong bg-paper px-5 py-10 text-center">
            <p className="text-[14px] font-semibold text-ink">Không tìm thấy bộ thẻ phù hợp</p>
            <p className="mt-1 text-[12.5px] text-ink-3">Thử tìm bằng mã môn hoặc một từ khóa ngắn hơn.</p>
          </div>
        )}
      </section>
    </div>
  );
}
