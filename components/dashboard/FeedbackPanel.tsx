"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { ApiError } from "@/lib/api";
import { FEEDBACK_CATEGORY_LABEL, submitFeedback, type FeedbackCategory } from "@/lib/feedback";

const CATEGORIES = Object.keys(FEEDBACK_CATEGORY_LABEL) as FeedbackCategory[];
const MAX = 2000;

export function FeedbackPanel({ previousTab }: { previousTab: string }) {
  const [category, setCategory] = useState<FeedbackCategory>("suggestion");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    const text = message.trim();
    if (!text) {
      setError("Nhập nội dung phản hồi");
      setSent(false);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await submitFeedback({
        category,
        message: text,
        page: previousTab && previousTab !== "tong-quan" ? `/dashboard?tab=${previousTab}` : "/dashboard",
      });
      setSent(true);
      setMessage("");
      setCategory("suggestion");
    } catch (reason) {
      setSent(false);
      setError(
        reason instanceof ApiError && reason.status === 429
          ? "Bạn gửi hơi nhiều, thử lại sau ít phút."
          : reason instanceof Error
            ? reason.message
            : "Không gửi được phản hồi. Vui lòng thử lại.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="dashboard-view space-y-6">
      <div className="dashboard-title">
        <span className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-ink-3">Hỗ trợ</span>
        <h1 className="mt-1 font-display text-[26px] font-semibold text-ink">Góp ý &amp; báo lỗi</h1>
        <p className="mt-1 text-[15px] text-ink-2">Cho chúng tôi biết điều gì chưa ổn hoặc bạn muốn có thêm gì, đội ngũ sẽ đọc từng phản hồi.</p>
      </div>
      <section className="max-w-2xl rounded-[10px] border border-line bg-paper p-5 shadow-[var(--shadow-1)] sm:p-6">
        <form onSubmit={(event) => void submit(event)} noValidate className="space-y-5">
          <fieldset>
            <legend className="text-[13px] font-semibold text-ink">Loại</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {CATEGORIES.map((value) => (
                <label
                  key={value}
                  className="flex cursor-pointer items-center gap-2.5 rounded-[8px] border border-line px-3 py-2.5 text-[13.5px] text-ink transition-colors hover:bg-paper-2 has-checked:border-orange has-checked:bg-orange-soft"
                >
                  <input type="radio" name="feedback-category" value={value} checked={category === value} onChange={() => setCategory(value)} className="size-4 accent-orange" />
                  {FEEDBACK_CATEGORY_LABEL[value]}
                </label>
              ))}
            </div>
          </fieldset>
          <div>
            <label htmlFor="feedback-message" className="text-[13px] font-semibold text-ink">Nội dung</label>
            <textarea
              id="feedback-message"
              rows={6}
              maxLength={MAX}
              value={message}
              onChange={(event) => {
                setMessage(event.target.value);
                if (error) setError(null);
              }}
              aria-invalid={error === "Nhập nội dung phản hồi" ? true : undefined}
              aria-describedby="feedback-counter"
              placeholder="Mô tả vấn đề hoặc ý tưởng của bạn"
              className="mt-2 w-full rounded-[8px] border border-line bg-paper px-3 py-2.5 text-[14px] text-ink outline-none transition-colors placeholder:text-ink-3 focus:border-orange aria-[invalid=true]:border-danger"
            />
            <p id="feedback-counter" className="mt-1 text-right text-[12px] tabular-nums text-ink-3">{message.length}/{MAX}</p>
          </div>
          {error && <p role="alert" className="text-[13px] text-danger">{error}</p>}
          {sent && (
            <p role="status" className="flex items-center gap-2 text-[13.5px] font-medium text-green">
              <CheckCircle2 aria-hidden="true" className="size-4" />
              Đã nhận phản hồi, cảm ơn bạn.
            </p>
          )}
          <button
            type="submit"
            disabled={busy}
            aria-busy={busy || undefined}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-[8px] bg-orange px-5 text-[13.5px] font-semibold text-white transition-colors hover:bg-orange-dark disabled:cursor-progress disabled:opacity-60"
          >
            {busy && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
            Gửi phản hồi
          </button>
        </form>
      </section>
    </div>
  );
}
