"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Download, FileText, Presentation } from "lucide-react";
import { API_BASE_URL, useAuth } from "@/lib/auth";
import type { School, Subject } from "@/lib/types";

type Slide = { slide_number: number; text_content: string; notes: string | null };
type MaterialPayload = {
  material: { title: string; schoolCode?: string; subjectCode?: string };
  version: { originalFilename: string; slideCount: number };
  slides: Slide[];
};

export function UploadedMaterialViewer({ school, subject, versionId }: { school: School; subject: Subject; versionId: string }) {
  const user = useAuth();
  const [payload, setPayload] = useState<MaterialPayload | null>(null);
  const [index, setIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const subjectHref = `/schools/${school.id}/subjects/${subject.id}`;

  useEffect(() => {
    if (!user?.token) return;
    const controller = new AbortController();
    void fetch(`${API_BASE_URL}/Materials/${versionId}/slides`, {
      headers: { Authorization: `Bearer ${user.token}` },
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message || "Không thể tải nội dung slide.");
        return data as MaterialPayload;
      })
      .then((data) => { setPayload(data); setError(null); setIndex(0); })
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        setError(reason instanceof Error ? reason.message : "Không thể tải nội dung slide.");
      });
    return () => controller.abort();
  }, [user?.token, versionId]);

  const download = async () => {
    if (!user?.token) { setError("Bạn cần đăng nhập để tải tài liệu."); return; }
    setDownloading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/Materials/${versionId}/download`, { headers: { Authorization: `Bearer ${user.token}` } });
      const data = await response.json().catch(() => ({})) as { url?: string; message?: string };
      if (!response.ok || !data.url) throw new Error(data.message || "Không thể tạo link tải tài liệu.");
      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể tải tài liệu.");
    } finally {
      setDownloading(false);
    }
  };

  const slide = payload?.slides[index];
  const displayError = user?.token ? error : "Bạn cần đăng nhập để xem giáo trình này.";
  return (
    <main className="mx-auto max-w-[900px] px-5 pb-20 lg:px-8">
      <nav className="flex flex-wrap items-center gap-1.5 py-5 text-[13px] text-ink-3">
        <Link href={subjectHref} className="hover:text-ink">{subject.code}</Link><ChevronRight size={14} /><span className="font-medium text-ink-2">Giáo trình</span>
      </nav>
      <Link href={subjectHref} className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-ink-2 hover:text-ink"><ArrowLeft size={15} /> Quay lại {subject.name}</Link>

      {displayError && <p className="mt-4 rounded-[8px] border border-danger/25 bg-danger-soft px-4 py-3 text-[13px] text-danger">{displayError}</p>}
      {!payload && !displayError && <p className="mt-8 text-[13px] text-ink-3">Đang tải giáo trình...</p>}
      {payload && (
        <>
          <header className="mt-3 flex flex-wrap items-start justify-between gap-4 rounded-[12px] border border-line bg-paper p-5 shadow-[var(--shadow-1)]">
            <div className="flex min-w-0 gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-[10px] bg-orange-soft text-orange"><Presentation size={24} /></span><div><p className="text-[12px] font-semibold uppercase tracking-wide text-ink-3">Giáo trình PowerPoint</p><h1 className="mt-0.5 font-display text-[24px] font-semibold leading-tight text-ink">{payload.material.title}</h1><p className="mt-2 text-[12.5px] text-ink-3">{payload.version.originalFilename} · {payload.version.slideCount} slide</p></div></div>
            <button type="button" disabled={downloading} onClick={() => void download()} className="inline-flex h-10 items-center gap-2 rounded-[8px] bg-orange px-4 text-[13px] font-semibold text-white disabled:opacity-50"><Download size={15} />{downloading ? "Đang tạo link..." : "Tải .pptx"}</button>
          </header>

          {slide ? <section className="mt-7 overflow-hidden rounded-[12px] border border-line bg-paper shadow-[var(--shadow-1)]"><div className="flex items-center justify-between border-b border-line bg-paper-2 px-5 py-3 text-[12px] text-ink-3"><span className="inline-flex items-center gap-1.5"><FileText size={14} /> Nội dung được trích từ PowerPoint</span><span>Slide {index + 1} / {payload.slides.length}</span></div><article className="min-h-72 whitespace-pre-wrap p-6 text-[16px] leading-8 text-ink">{slide.text_content || "Slide này không có text để hiển thị."}{slide.notes && <div className="mt-7 border-t border-line pt-4 text-[13px] leading-6 text-ink-2"><strong className="text-ink">Ghi chú:</strong> {slide.notes}</div>}</article><div className="flex items-center justify-between border-t border-line p-4"><button type="button" disabled={index === 0} onClick={() => setIndex((current) => current - 1)} className="inline-flex h-9 items-center gap-1 rounded-[7px] border border-line px-3 text-[13px] font-medium text-ink disabled:opacity-40"><ChevronLeft size={15} /> Trước</button><button type="button" disabled={index === payload.slides.length - 1} onClick={() => setIndex((current) => current + 1)} className="inline-flex h-9 items-center gap-1 rounded-[7px] bg-ink px-3 text-[13px] font-medium text-white disabled:opacity-40">Sau <ChevronRight size={15} /></button></div></section> : <p className="mt-7 rounded-[8px] border border-line bg-paper p-5 text-[13px] text-ink-3">Giáo trình này chưa có nội dung text để hiển thị.</p>}
        </>
      )}
    </main>
  );
}
