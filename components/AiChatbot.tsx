"use client";

import { FormEvent, useEffect, useId, useRef, useState } from "react";
import { Bot, Send, Sparkles, X } from "lucide-react";

type ChatMessage = {
  id: number;
  role: "assistant" | "user";
  content: string;
};

const QUICK_PROMPTS = [
  "Gợi ý cách ôn thi",
  "Tìm đề thi phù hợp",
  "Giải thích câu hỏi khó",
];

const INITIAL_MESSAGE: ChatMessage = {
  id: 1,
  role: "assistant",
  content:
    "Chào bạn, mình là ExamCure AI. Mình có thể giúp bạn lập kế hoạch ôn tập, tìm đề thi và giải thích kiến thức.",
};

function createReply(message: string) {
  const normalized = message.toLocaleLowerCase("vi");

  if (normalized.includes("đề thi") || normalized.includes("luyện đề")) {
    return "Bạn hãy mở mục Đề thi gợi ý, chọn học phần đang ôn và bắt đầu với một đề có độ khó vừa. Sau khi nộp bài, mình sẽ giúp bạn phân tích các câu sai.";
  }

  if (normalized.includes("kế hoạch") || normalized.includes("ôn thi")) {
    return "Bạn có thể chia buổi học thành 3 phần: 20 phút ôn lý thuyết, 30 phút luyện câu hỏi và 10 phút ghi lại lỗi sai. Hãy ưu tiên học phần có điểm gần nhất thấp nhất trước.";
  }

  if (normalized.includes("giải thích") || normalized.includes("câu hỏi")) {
    return "Bạn gửi nội dung câu hỏi cùng các đáp án nhé. Mình sẽ phân tích từng lựa chọn và giải thích vì sao đáp án đúng phù hợp nhất.";
  }

  return "Mình đã ghi nhận câu hỏi. Bạn có thể cho mình biết thêm tên học phần hoặc nội dung đang vướng để mình hỗ trợ cụ thể hơn nhé.";
}

export function AiChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const nextMessageId = useRef(2);
  const replyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!isOpen) return;

    inputRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  useEffect(
    () => () => {
      if (replyTimer.current) clearTimeout(replyTimer.current);
    },
    [],
  );

  const sendMessage = (content: string) => {
    const value = content.trim();
    if (!value || isThinking) return;

    setMessages((current) => [
      ...current,
      { id: nextMessageId.current++, role: "user", content: value },
    ]);
    setDraft("");
    setIsThinking(true);

    replyTimer.current = setTimeout(() => {
      setMessages((current) => [
        ...current,
        {
          id: nextMessageId.current++,
          role: "assistant",
          content: createReply(value),
        },
      ]);
      setIsThinking(false);
      replyTimer.current = null;
    }, 650);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    sendMessage(draft);
  };

  return (
    <div className="fixed bottom-4 right-4 z-[45] flex flex-col items-end sm:bottom-6 sm:right-6">
      {isOpen && (
        <section
          id={panelId}
          role="dialog"
          aria-label="Trợ lý ExamCure AI"
          className="mb-3 flex h-[min(580px,calc(100vh-104px))] w-[calc(100vw-32px)] max-w-[390px] flex-col overflow-hidden rounded-[20px] border border-[#f4a78e] bg-white shadow-[0_20px_55px_rgba(88,39,20,0.22)] animate-rise"
        >
          <header className="relative flex items-center gap-3 overflow-hidden bg-[#ef4d23] px-4 py-4 text-white">
            <span className="pointer-events-none absolute -right-7 -top-10 h-28 w-28 rounded-full border-[18px] border-white/10" />
            <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-[13px] border border-white/25 bg-white/15 shadow-sm">
              <Bot size={24} strokeWidth={2.2} aria-hidden="true" />
              <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-white text-[#ef4d23] shadow-sm">
                <Sparkles size={9} fill="currentColor" aria-hidden="true" />
              </span>
            </span>
            <div className="relative min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h2 className="truncate text-[15px] font-bold text-white">ExamCure AI</h2>
                <span className="rounded-full bg-white/18 px-1.5 py-0.5 text-[8px] font-bold tracking-[0.12em] text-white">BETA</span>
              </div>
              <p className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-white/85">
                <span className="h-1.5 w-1.5 rounded-full bg-[#79e39f]" />
                Trợ lý học tập thông minh
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Đóng trợ lý AI"
              className="relative grid h-8 w-8 place-items-center rounded-full text-white/85 transition-colors hover:bg-white/15 hover:text-white focus-visible:outline-white"
            >
              <X size={17} aria-hidden="true" />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto bg-[#fffaf7] px-4 py-4" aria-live="polite">
            <div className="space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-end gap-2 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {message.role === "assistant" && (
                    <span className="mb-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-[10px] border border-[#ffd5c7] bg-[#fff0e9] text-[#d9421d]">
                      <Bot size={17} aria-hidden="true" />
                    </span>
                  )}
                  <p
                    className={`max-w-[82%] rounded-[14px] px-3.5 py-2.5 text-[13px] leading-relaxed shadow-sm ${
                      message.role === "user"
                        ? "rounded-br-[4px] bg-[#ef4d23] text-white"
                        : "rounded-bl-[4px] border border-[#f0ded7] bg-white text-ink-2"
                    }`}
                  >
                    {message.content}
                  </p>
                </div>
              ))}

              {isThinking && (
                <div className="flex items-end gap-2" aria-label="ExamCure AI đang trả lời">
                  <span className="mb-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-[10px] border border-[#ffd5c7] bg-[#fff0e9] text-[#d9421d]">
                    <Bot size={17} aria-hidden="true" />
                  </span>
                  <span className="flex items-center gap-1 rounded-[14px] rounded-bl-[4px] border border-[#f0ded7] bg-white px-3.5 py-3 shadow-sm">
                    {[0, 1, 2].map((dot) => (
                      <span
                        key={dot}
                        className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#ef4d23]"
                        style={{ animationDelay: `${dot * 140}ms` }}
                      />
                    ))}
                  </span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="border-t border-[#f1e3dd] bg-white p-3">
            {messages.length === 1 && (
              <div className="no-scrollbar mb-2.5 flex gap-2 overflow-x-auto pb-0.5">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => sendMessage(prompt)}
                    className="shrink-0 rounded-full border border-[#ffd0c1] bg-[#fff0e9] px-3 py-1.5 text-[11.5px] font-semibold text-[#c9421f] transition-colors hover:border-[#ef4d23] hover:bg-white focus-visible:outline-[#ef4d23]"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <label htmlFor={`${panelId}-input`} className="sr-only">
                Nhập câu hỏi cho ExamCure AI
              </label>
              <input
                ref={inputRef}
                id={`${panelId}-input`}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Hỏi ExamCure AI..."
                autoComplete="off"
                className="h-11 min-w-0 flex-1 rounded-[12px] border border-[#eadbd5] bg-[#fffaf7] px-3.5 text-[13px] text-ink placeholder:text-ink-3 focus:border-[#ef4d23] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ef4d23]/10"
              />
              <button
                type="submit"
                disabled={!draft.trim() || isThinking}
                aria-label="Gửi câu hỏi"
                className="grid h-11 w-11 shrink-0 place-items-center rounded-[12px] bg-[#ef4d23] text-white shadow-sm transition-[background-color,transform] hover:-translate-y-0.5 hover:bg-[#d9421d] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0 focus-visible:outline-[#ef4d23]"
              >
                <Send size={17} aria-hidden="true" />
              </button>
            </form>
            <p className="mt-2 text-center text-[10px] text-ink-3">
              AI có thể mắc lỗi. Hãy kiểm tra lại thông tin quan trọng.
            </p>
          </div>
        </section>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-label={isOpen ? "Đóng trợ lý ExamCure AI" : "Mở trợ lý ExamCure AI"}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className="group relative grid h-16 w-16 place-items-center rounded-[20px] border-[3px] border-white bg-[#ef4d23] text-white shadow-[0_10px_28px_rgba(190,57,25,0.34)] transition-[transform,background-color,box-shadow] hover:-translate-y-1 hover:bg-[#d9421d] hover:shadow-[0_14px_34px_rgba(190,57,25,0.4)] focus-visible:outline-[#ef4d23]"
      >
        {isOpen ? (
          <X size={24} aria-hidden="true" />
        ) : (
          <span className="relative grid h-11 w-11 place-items-center rounded-[14px] border border-white/25 bg-white/12">
            <Bot size={27} strokeWidth={2.1} aria-hidden="true" />
            <Sparkles size={12} fill="currentColor" className="absolute -right-1 -top-1" aria-hidden="true" />
          </span>
        )}
        {!isOpen && (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full border-2 border-white bg-[#20242b] px-1 text-[9px] font-bold text-white">
            AI
          </span>
        )}
        {!isOpen && (
          <span className="pointer-events-none absolute right-[calc(100%+10px)] hidden whitespace-nowrap rounded-[7px] bg-ink px-2.5 py-1.5 text-[11px] font-semibold text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100 sm:block">
            Hỏi ExamCure AI
          </span>
        )}
      </button>
    </div>
  );
}
