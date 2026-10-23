"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Bot, RotateCcw, Send, Sparkles, X } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useAuthModal } from "@/components/auth/AuthModalProvider";
import { listSubjects, type CatalogSubject } from "@/lib/catalog";
import {
  askAssistant,
  errorText,
  getAssistantUsage,
  sourceHref,
  sourceLabel,
  subjectContextFromPathname,
  toRequestMessages,
  type AssistantSource,
  type AssistantSubjectRef,
} from "@/lib/assistant";

type ChatMessage = {
  id: number;
  role: "assistant" | "user";
  content: string;
  kind?: "greeting" | "normal" | "error";
  /** answer extras */
  sources?: AssistantSource[];
  subject?: AssistantSubjectRef | null;
  generalNote?: boolean;
};

const QUICK_PROMPTS = [
  "Tóm tắt nội dung chính của môn này",
  "Giải thích một khái niệm khó",
  "Gợi ý cách ôn thi môn này",
];

const GREETING: ChatMessage = {
  id: 1,
  role: "assistant",
  kind: "greeting",
  content:
    "Chào bạn, mình là ExamCure AI. Mình có thể giải thích kiến thức và gợi ý cách ôn tập. Chọn một môn để mình trả lời dựa trên giáo trình đã đăng; câu trả lời của AI có thể chưa chính xác.",
};

const BOT_ICON =
  "mb-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-[10px] border border-[#ffd5c7] bg-[#fff0e9] text-[#d9421d]";

/** Keyed by account so a different user never inherits the previous conversation or quota. */
export function AiChatbot() {
  const user = useAuth();
  return <AiChatbotPanel key={user?.id ?? user?.email ?? "anonymous"} />;
}

function AiChatbotPanel() {
  const pathname = usePathname();
  const user = useAuth();
  const { openAuth } = useAuthModal();
  const [isOpen, setIsOpen] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [usage, setUsage] = useState<{ available: boolean; remaining: number } | null>(null);
  const [subjects, setSubjects] = useState<CatalogSubject[]>([]);
  const [subjectId, setSubjectId] = useState("");
  const nextMessageId = useRef(2);
  const epoch = useRef(0);
  const controller = useRef<AbortController | null>(null);
  const pending = useRef<{ id: number; text: string } | null>(null);
  const loadedFor = useRef<string | null>(null);
  const contextFor = useRef<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const userKey = user?.id ?? user?.email ?? null;

  const cancelInflight = useCallback((restore: boolean) => {
    epoch.current++;
    controller.current?.abort();
    controller.current = null;
    const waiting = pending.current;
    pending.current = null;
    setIsThinking(false);
    if (restore && waiting) {
      setMessages((current) => current.filter((m) => m.id !== waiting.id));
      setDraft((current) => current || waiting.text);
    }
  }, []);

  useEffect(() => () => controller.current?.abort(), []);

  useEffect(() => {
    if (!isOpen) return;
    inputRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        cancelInflight(true);
        setIsOpen(false);
      }
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [isOpen, cancelInflight]);

  // Refresh the quota every time the panel opens (a closed in-flight question still counts).
  useEffect(() => {
    if (!isOpen || !userKey) return;
    const abort = new AbortController();
    getAssistantUsage(abort.signal)
      .then((u) => setUsage({ available: u.available, remaining: u.remainingToday }))
      .catch(() => undefined);
    return () => abort.abort();
  }, [isOpen, userKey]);

  // Lazily load the subject list the first time the panel opens for a user.
  useEffect(() => {
    if (!isOpen || !userKey || !user?.schoolId || loadedFor.current === userKey) return;
    const abort = new AbortController();
    listSubjects(user.schoolId, { signal: abort.signal })
      .then((list) => {
        loadedFor.current = userKey;
        setSubjects((current) => mergeSubjects(list, current));
      })
      .catch(() => undefined);
    return () => abort.abort();
  }, [isOpen, userKey, user?.schoolId]);

  // Preselect the subject of the page being viewed.
  useEffect(() => {
    if (!isOpen || !userKey) return;
    const context = subjectContextFromPathname(pathname);
    if (!context) return;
    const key = `${userKey}:${context.schoolCode}:${context.code}`;
    if (contextFor.current === key) return;
    const abort = new AbortController();
    listSubjects(context.schoolCode, { code: context.code, signal: abort.signal })
      .then(([found]) => {
        contextFor.current = key;
        if (!found) return;
        setSubjects((current) => mergeSubjects(current, [found]));
        setSubjectId(found.id);
      })
      .catch(() => undefined);
    return () => abort.abort();
  }, [isOpen, userKey, pathname]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  const selected = subjects.find((s) => s.id === subjectId) ?? null;
  const unavailable = usage?.available === false;
  const exhausted = usage != null && usage.remaining <= 0;
  const blocked = unavailable || exhausted;

  const sendMessage = (content: string) => {
    const value = content.trim();
    if (!value || isThinking || blocked || !user) return;
    const userMessage: ChatMessage = { id: nextMessageId.current++, role: "user", content: value, kind: "normal" };
    const history = toRequestMessages([...messages, userMessage]);
    const myEpoch = ++epoch.current;
    const abort = new AbortController();
    controller.current = abort;
    pending.current = { id: userMessage.id, text: value };
    setMessages((current) => [...current, userMessage]);
    setDraft("");
    setIsThinking(true);
    const asked = selected;
    askAssistant({ ...(asked ? { subjectId: asked.id } : {}), messages: history }, abort.signal)
      .then((reply) => {
        if (epoch.current !== myEpoch || abort.signal.aborted) return;
        if (!reply || typeof reply.answer !== "string") throw new Error("malformed assistant reply");
        pending.current = null;
        const sources = Array.isArray(reply.sources) ? reply.sources : [];
        const remaining = typeof reply.remainingToday === "number" ? reply.remainingToday : null;
        setMessages((current) => [
          ...current,
          {
            id: nextMessageId.current++,
            role: "assistant",
            kind: "normal",
            content: reply.answer,
            sources,
            subject: reply.subject ?? null,
            generalNote: Boolean(asked) && !reply.grounded,
          },
        ]);
        if (remaining !== null) setUsage((current) => ({ available: current?.available ?? true, remaining }));
        setIsThinking(false);
      })
      .catch((error: unknown) => {
        if (epoch.current !== myEpoch || abort.signal.aborted) return;
        pending.current = null;
        setMessages((current) => [
          ...current.filter((m) => m.id !== userMessage.id),
          { id: nextMessageId.current++, role: "assistant", kind: "error", content: errorText(error) },
        ]);
        setDraft((current) => current || value);
        if (error instanceof Error && (error as { code?: string }).code === "ASSISTANT_QUOTA_EXCEEDED")
          setUsage((current) => ({ available: current?.available ?? true, remaining: 0 }));
        setIsThinking(false);
      });
  };

  const clearConversation = () => {
    epoch.current++;
    cancelInflight(false);
    setMessages([GREETING]);
    setDraft("");
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    sendMessage(draft);
  };

  const closePanel = () => {
    cancelInflight(true);
    setIsOpen(false);
  };

  // Chatbot dành cho sinh viên; khu quản trị có bảng/thao tác ở góc phải.
  if (pathname.startsWith("/admin")) return null;
  // Phòng thi không được có trợ lý AI; trang kết quả (/result) vẫn giữ.
  if (/^\/exam\/[^/]+\/[^/]+\/?$/.test(pathname)) return null;

  const hasExchange = messages.some((m) => m.kind === "normal");

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
                {user && usage && !unavailable ? `Còn ${usage.remaining} câu hôm nay` : "Trợ lý học tập"}
              </p>
            </div>
            {user && (
              <button
                type="button"
                onClick={clearConversation}
                aria-label="Cuộc trò chuyện mới"
                title="Cuộc trò chuyện mới"
                className="relative grid h-8 w-8 place-items-center rounded-full text-white/85 transition-colors hover:bg-white/15 hover:text-white focus-visible:outline-white"
              >
                <RotateCcw size={15} aria-hidden="true" />
              </button>
            )}
            <button
              type="button"
              onClick={closePanel}
              aria-label="Đóng trợ lý AI"
              className="relative grid h-8 w-8 place-items-center rounded-full text-white/85 transition-colors hover:bg-white/15 hover:text-white focus-visible:outline-white"
            >
              <X size={17} aria-hidden="true" />
            </button>
          </header>

          {!user ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-[#fffaf7] px-6 text-center">
              <span className={BOT_ICON}>
                <Bot size={17} aria-hidden="true" />
              </span>
              <p className="text-[14px] font-semibold text-ink">Đăng nhập để dùng trợ lý AI</p>
              <p className="text-[12.5px] leading-relaxed text-ink-2">
                Hỏi bài, nhờ giải thích kiến thức và nhận câu trả lời bám theo giáo trình của môn học.
              </p>
              <button
                type="button"
                onClick={() => openAuth("login")}
                className="h-10 rounded-[10px] bg-[#ef4d23] px-5 text-[13px] font-semibold text-white hover:bg-[#d9421d] focus-visible:outline-[#ef4d23]"
              >
                Đăng nhập
              </button>
            </div>
          ) : (
            <>
              <div className="border-b border-[#f1e3dd] bg-white px-3 py-2">
                <label htmlFor={`${panelId}-subject`} className="sr-only">
                  Môn học
                </label>
                <select
                  id={`${panelId}-subject`}
                  value={subjectId}
                  onChange={(event) => setSubjectId(event.target.value)}
                  className="h-9 w-full rounded-[10px] border border-[#eadbd5] bg-[#fffaf7] px-2.5 text-[12.5px] text-ink focus:border-[#ef4d23] focus:outline-none"
                >
                  <option value="">Không chọn môn (hỏi chung)</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} · {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1 overflow-y-auto bg-[#fffaf7] px-4 py-4" aria-live="polite">
                <div className="space-y-3">
                  {messages.map((message) => (
                    <div key={message.id} className={`flex items-end gap-2 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                      {message.role === "assistant" && (
                        <span className={BOT_ICON}>
                          <Bot size={17} aria-hidden="true" />
                        </span>
                      )}
                      <div className="flex max-w-[82%] flex-col gap-1.5">
                        <p
                          className={`whitespace-pre-wrap break-words rounded-[14px] px-3.5 py-2.5 text-[13px] leading-relaxed shadow-sm ${
                            message.role === "user"
                              ? "rounded-br-[4px] bg-[#ef4d23] text-white"
                              : message.kind === "error"
                                ? "rounded-bl-[4px] border border-danger/30 bg-danger-soft text-danger"
                                : "rounded-bl-[4px] border border-[#f0ded7] bg-white text-ink-2"
                          }`}
                        >
                          {message.content}
                        </p>
                        {message.generalNote && (
                          <p className="px-1 text-[11px] text-ink-3">Không tìm thấy trong tài liệu môn, đây là kiến thức chung.</p>
                        )}
                        {message.sources && message.sources.length > 0 && message.subject && (
                          <ul className="space-y-1 px-1 text-[11.5px]">
                            {message.sources.map((source) => (
                              <li key={`${source.versionId}:${source.slideNumber}`}>
                                <Link
                                  href={sourceHref(message.subject!, source)}
                                  title={source.excerpt}
                                  className="font-medium text-[#c9421f] underline-offset-2 hover:underline"
                                >
                                  {sourceLabel(source)}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  ))}

                  {isThinking && (
                    <div className="flex items-end gap-2" aria-label="ExamCure AI đang trả lời">
                      <span className={BOT_ICON}>
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
                {unavailable && <p className="mb-2 text-center text-[12px] font-semibold text-ink-2">Trợ lý AI chưa sẵn sàng</p>}
                {exhausted && !unavailable && (
                  <p className="mb-2 text-center text-[12px] text-ink-2">Bạn đã dùng hết câu hỏi hôm nay. Hạn mức sẽ được làm mới lúc 0 giờ.</p>
                )}
                {!hasExchange && !blocked && (
                  <div className="no-scrollbar mb-2.5 flex gap-2 overflow-x-auto pb-0.5">
                    {QUICK_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => sendMessage(prompt)}
                        disabled={isThinking}
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
                    maxLength={2000}
                    disabled={blocked}
                    placeholder={selected ? `Hỏi về ${selected.code}...` : "Hỏi ExamCure AI..."}
                    autoComplete="off"
                    className="h-11 min-w-0 flex-1 rounded-[12px] border border-[#eadbd5] bg-[#fffaf7] px-3.5 text-[13px] text-ink placeholder:text-ink-3 focus:border-[#ef4d23] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ef4d23]/10 disabled:opacity-60"
                  />
                  <button
                    type="submit"
                    disabled={!draft.trim() || isThinking || blocked}
                    aria-label="Gửi câu hỏi"
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-[12px] bg-[#ef4d23] text-white shadow-sm transition-[background-color,transform] hover:-translate-y-0.5 hover:bg-[#d9421d] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0 focus-visible:outline-[#ef4d23]"
                  >
                    <Send size={17} aria-hidden="true" />
                  </button>
                </form>
                <p className="mt-2 text-center text-[10px] text-ink-3">AI có thể mắc lỗi. Hãy kiểm tra lại thông tin quan trọng.</p>
              </div>
            </>
          )}
        </section>
      )}

      <button
        type="button"
        onClick={() => (isOpen ? closePanel() : setIsOpen(true))}
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

function mergeSubjects(primary: CatalogSubject[], extra: CatalogSubject[]): CatalogSubject[] {
  const seen = new Set(primary.map((s) => s.id));
  return [...primary, ...extra.filter((s) => !seen.has(s.id))];
}
