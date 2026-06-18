"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { type ChatMessage, readUserChat, saveUserChat } from "@/lib/feed";
import { STUDENT } from "@/lib/student";
import { Avatar } from "./Avatar";

export function ChatChannel({ seed }: { seed: ChatMessage[] }) {
  const [messages, setMessages] = useState<ChatMessage[]>(seed);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Tin nhắn người dùng đã gửi trong phiên
  useEffect(() => {
    const mine = readUserChat();
    if (mine.length) {
      setTimeout(() => {
        setMessages([...seed, ...mine]);
      }, 0);
    }
  }, [seed]);

  // Cuộn xuống cuối khi có tin mới (chỉ trong khung chat)
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  function send() {
    const text = draft.trim();
    if (!text) return;
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, "0")}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
    const msg: ChatMessage = {
      id: `u-${now.getTime().toString(36)}`,
      author: STUDENT.name,
      time,
      text,
    };
    setMessages((prev) => [...prev, msg]);
    saveUserChat(msg);
    setDraft("");
  }

  return (
    <div className="flex h-[560px] flex-col overflow-hidden rounded-[12px] border border-line bg-paper shadow-[var(--shadow-1)]">
      {/* Header */}
      <div className="flex flex-none items-center gap-2.5 border-b border-line px-4 py-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-[14.5px] font-semibold text-ink">Trò chuyện chung</h3>
          <p className="flex items-center gap-1.5 text-[12px] text-ink-3">
            <span className="inline-block h-2 w-2 rounded-full bg-green" />
            32 thành viên đang online
          </p>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        role="log"
        aria-live="polite"
        aria-label="Tin nhắn trò chuyện chung"
        className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
      >
        {messages.map((m) => {
          const mine = m.author === STUDENT.name;
          return (
            <div key={m.id} className={`flex gap-2.5 ${mine ? "flex-row-reverse" : ""}`}>
              <Avatar name={m.author} size={30} />
              <div className={`min-w-0 max-w-[78%] ${mine ? "items-end text-right" : ""} flex flex-col`}>
                <span className="mb-0.5 flex items-center gap-1.5 text-[11.5px] text-ink-3">
                  <span className="font-medium text-ink-2">{mine ? "Bạn" : m.author}</span>
                  <span className="tnum">{m.time}</span>
                </span>
                <span
                  className={`inline-block rounded-[10px] px-3 py-2 text-[13.5px] leading-relaxed ${
                    mine
                      ? "rounded-tr-[3px] bg-orange-soft text-orange-dark"
                      : "rounded-tl-[3px] bg-paper-2 text-ink"
                  }`}
                >
                  {m.text}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <div className="flex flex-none items-center gap-2 border-t border-line px-3 py-2.5">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Nhập tin nhắn…"
          className="h-10 min-w-0 flex-1 rounded-[7px] border border-line bg-paper-2 px-3.5 text-[14px] outline-none transition-colors placeholder:text-ink-3 focus:border-orange focus:bg-paper"
        />
        <button
          onClick={send}
          disabled={!draft.trim()}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-[7px] bg-ink text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          aria-label="Gửi tin nhắn"
        >
          <Send size={17} />
        </button>
      </div>
    </div>
  );
}
