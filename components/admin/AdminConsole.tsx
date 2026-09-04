"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bot,
  Check,
  ChevronRight,
  Database,
  FileQuestion,
  FileUp,
  LoaderCircle,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { API_BASE_URL, useAuth } from "@/lib/auth";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type ServiceStatus = {
  supabase: boolean;
  mongodb: boolean;
  openai: boolean;
  converter: boolean;
  pptxTextExtraction: boolean;
};

type Subject = {
  id: string;
  school_code: string;
  code: string;
  name: string;
};

type MaterialVersion = {
  id: string;
  version_number: number;
  status: string;
  original_filename: string;
  slide_count: number;
  error_message: string | null;
  created_at: string;
};

type Material = {
  id: string;
  subject_id: string;
  title: string;
  created_at: string;
  material_versions: MaterialVersion[];
};

type Question = {
  id: string;
  subject_id: string;
  prompt: string;
  explanation: string;
  difficulty: string;
  status: "draft" | "approved" | "rejected" | "archived";
  question_options: Array<{
    id: string;
    position: number;
    content: string;
    is_correct: boolean;
  }>;
  question_sources: Array<{
    id: string;
    slide_number: number;
    chunk_id: string;
    excerpt: string;
  }>;
};

type Overview = {
  admin: { name: string; email: string | null; bootstrap: boolean };
  subjects: Subject[];
  materials: Material[];
  generationRuns: Array<{
    id: string;
    status: string;
    question_count: number;
    error_message: string | null;
  }>;
  questions: Question[];
  exams: Array<{
    id: string;
    title: string;
    status: string;
    exam_questions: Array<{ question_id: string }>;
  }>;
};

type Notice = { tone: "success" | "error"; message: string } | null;
const backendUrl = (path: string) => `${API_BASE_URL.replace(/\/$/, "")}${path}`;

export function AdminConsole() {
  const user = useAuth();
  const [bootstrapToken, setBootstrapToken] = useState("");
  const [services, setServices] = useState<ServiceStatus | null>(null);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [selectedVersionIds, setSelectedVersionIds] = useState<string[]>([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);

  const token = bootstrapToken.trim() || user?.token || "";

  useEffect(() => {
    const saved = sessionStorage.getItem("examcure:admin-bootstrap-token");
    if (saved) queueMicrotask(() => setBootstrapToken(saved));
    void fetch(backendUrl("/System/status"))
      .then((response) => response.json())
      .then((data) => setServices(data.services))
      .catch(() => setServices(null));
  }, []);

  const api = async <T,>(path: string, init?: RequestInit): Promise<T> => {
    const headers = new Headers(init?.headers);
    if (token) headers.set("Authorization", `Bearer ${token}`);
    if (init?.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    const response = await fetch(backendUrl(path), { ...init, headers });
    const data = (await response.json().catch(() => ({}))) as T & { error?: string; message?: string };
    if (!response.ok) throw new Error(data.message || data.error || `Yêu cầu thất bại (${response.status}).`);
    return data;
  };

  const refresh = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await api<Overview>("/Admin/overview");
      setOverview(data);
    } catch (error) {
      setOverview(null);
      setNotice({ tone: "error", message: error instanceof Error ? error.message : "Không thể tải dữ liệu." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const readyVersions = useMemo(
    () =>
      (overview?.materials || []).flatMap((material) =>
        material.material_versions
          .filter((version) => version.status === "ready")
          .map((version) => ({ ...version, material })),
      ),
    [overview],
  );

  const runAction = async (key: string, action: () => Promise<void>) => {
    setBusy(key);
    setNotice(null);
    try {
      await action();
      await refresh();
    } catch (error) {
      setNotice({ tone: "error", message: error instanceof Error ? error.message : "Đã có lỗi xảy ra." });
    } finally {
      setBusy(null);
    }
  };

  const createSubject = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    await runAction("subject", async () => {
      await api("/Admin/subjects", {
        method: "POST",
        body: JSON.stringify({
          schoolCode: form.get("schoolCode"),
          code: form.get("code"),
          name: form.get("name"),
        }),
      });
      formElement.reset();
      setNotice({ tone: "success", message: "Đã lưu môn học." });
    });
  };

  const uploadPowerPoint = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) {
      setNotice({ tone: "error", message: "Vui lòng chọn file PowerPoint." });
      return;
    }
    if (!file.name.toLowerCase().endsWith(".pptx")) {
      setNotice({ tone: "error", message: "Chế độ không dùng worker chỉ hỗ trợ file .pptx." });
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setNotice({ tone: "error", message: "File PowerPoint phải nhỏ hơn hoặc bằng 20 MB." });
      return;
    }

    await runAction("upload", async () => {
      const mimeType = file.type || "application/octet-stream";
      const signed = await api<{
        versionId: string;
        bucket: string;
        path: string;
        token: string;
      }>("/Admin/materials", {
        method: "POST",
        body: JSON.stringify({
          subjectId: form.get("subjectId"),
          title: form.get("title"),
          description: form.get("description"),
          fileName: file.name,
          mimeType,
          sizeBytes: file.size,
        }),
      });

      const { error } = await getSupabaseBrowserClient().storage
        .from(signed.bucket)
        .uploadToSignedUrl(signed.path, signed.token, file, {
          contentType: mimeType,
          upsert: false,
        });
      if (error) throw error;
      const indexed = await api<{ slideCount: number; chunkCount: number }>(`/Admin/materials/${signed.versionId}/complete-upload`, { method: "POST" });
      formElement.reset();
      setNotice({ tone: "success", message: `Đã trích xuất ${indexed.slideCount} slide và lập chỉ mục ${indexed.chunkCount} đoạn nội dung.` });
    });
  };

  const generateQuestions = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await runAction("generate", async () => {
      const result = await api<{ savedCount: number }>("/Admin/question-generation", {
        method: "POST",
        body: JSON.stringify({
          subjectId: form.get("subjectId"),
          materialVersionIds: selectedVersionIds,
          questionCount: Number(form.get("questionCount")),
          difficulty: form.get("difficulty"),
          extraInstructions: form.get("extraInstructions"),
        }),
      });
      setNotice({ tone: "success", message: `AI đã tạo ${result.savedCount} câu hỏi nháp để admin duyệt.` });
    });
  };

  const reviewQuestion = (questionId: string, status: "approved" | "rejected") =>
    runAction(`question-${questionId}`, async () => {
      await api(`/Admin/questions/${questionId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setNotice({ tone: "success", message: status === "approved" ? "Đã duyệt câu hỏi." : "Đã từ chối câu hỏi." });
    });

  const createExam = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await runAction("exam", async () => {
      await api("/Admin/exams", {
        method: "POST",
        body: JSON.stringify({
          subjectId: form.get("subjectId"),
          title: form.get("title"),
          durationMinutes: Number(form.get("durationMinutes")),
          questionIds: selectedQuestionIds,
          publish: form.get("publish") === "on",
        }),
      });
      setSelectedQuestionIds([]);
      setNotice({ tone: "success", message: "Đề thi đã được tạo bởi admin." });
    });
  };

  return (
    <main className="min-h-screen bg-paper-2">
      <header className="border-b border-line bg-paper">
        <div className="mx-auto flex min-h-16 max-w-[1320px] items-center justify-between gap-4 px-5 py-3 lg:px-8">
          <div className="flex items-center gap-4">
            <Logo size={96} />
            <span className="hidden h-7 w-px bg-line sm:block" />
            <div>
              <p className="flex items-center gap-1.5 text-[13px] font-bold text-ink"><ShieldCheck size={15} className="text-orange" /> Quản trị nội dung AI</p>
              <p className="text-[11px] text-ink-3">PowerPoint · Vector DB · Ngân hàng câu hỏi</p>
            </div>
          </div>
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-2 hover:text-orange">
            Dashboard <ChevronRight size={15} />
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-[1320px] space-y-6 px-5 py-6 lg:px-8 lg:py-8">
        <section className="rounded-[12px] border border-line bg-paper p-4 shadow-[var(--shadow-1)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-[20px] font-bold text-ink">Pipeline tài liệu và tạo đề</h1>
              <p className="mt-1 text-[13px] text-ink-2">Supabase là dữ liệu chính; MongoDB lưu vector dẫn xuất.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {services && Object.entries(services).map(([name, active]) => (
                <span key={name} className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${active ? "border-green/25 bg-green-soft text-green" : "border-line bg-paper-2 text-ink-3"}`}>
                  {name}: {active ? "ready" : "missing"}
                </span>
              ))}
            </div>
          </div>

          {user?.role !== "admin" && (
            <div className="mt-4 grid gap-2 border-t border-line pt-4 sm:grid-cols-[1fr_auto]">
              <input
                type="password"
                value={bootstrapToken}
                onChange={(event) => setBootstrapToken(event.target.value)}
                placeholder="ADMIN_BOOTSTRAP_TOKEN (chỉ dùng lúc khởi tạo)"
                className="h-10 rounded-[8px] border border-line bg-paper-2 px-3 text-[13px] outline-none focus:border-orange"
              />
              <button
                type="button"
                onClick={() => {
                  sessionStorage.setItem("examcure:admin-bootstrap-token", bootstrapToken.trim());
                  void refresh();
                }}
                className="h-10 rounded-[8px] bg-ink px-4 text-[13px] font-semibold text-white"
              >
                Kết nối quản trị
              </button>
            </div>
          )}
        </section>

        {notice && (
          <div className={`rounded-[9px] border px-4 py-3 text-[13px] ${notice.tone === "success" ? "border-green/25 bg-green-soft text-green" : "border-danger/25 bg-danger-soft text-danger"}`}>
            {notice.message}
          </div>
        )}

        {loading && !overview ? (
          <div className="grid min-h-48 place-items-center text-ink-3"><LoaderCircle className="animate-spin" /></div>
        ) : !overview ? (
          <div className="rounded-[12px] border border-dashed border-line-strong bg-paper p-10 text-center">
            <Database className="mx-auto text-ink-3" />
            <p className="mt-3 text-[14px] font-semibold text-ink">Chưa kết nối được backend quản trị</p>
            <p className="mt-1 text-[13px] text-ink-3">Đăng nhập bằng tài khoản Supabase có role admin hoặc dùng bootstrap token.</p>
          </div>
        ) : (
          <>
            <div className="grid gap-6 xl:grid-cols-2">
              <section className="rounded-[12px] border border-line bg-paper p-5 shadow-[var(--shadow-1)]">
                <SectionTitle icon={<Plus size={18} />} title="1. Khai báo môn học" subtitle="Tạo môn trong Supabase trước khi tải tài liệu." />
                <form onSubmit={createSubject} className="mt-5 grid gap-3 sm:grid-cols-3">
                  <Field name="schoolCode" label="Mã trường" placeholder="fptu" required />
                  <Field name="code" label="Mã môn" placeholder="CSD201" required />
                  <Field name="name" label="Tên môn" placeholder="Cấu trúc dữ liệu" required />
                  <button disabled={busy === "subject"} className="h-10 rounded-[8px] bg-ink px-4 text-[13px] font-semibold text-white disabled:opacity-50 sm:col-span-3">
                    {busy === "subject" ? "Đang lưu..." : "Lưu môn học"}
                  </button>
                </form>
              </section>

              <section className="rounded-[12px] border border-line bg-paper p-5 shadow-[var(--shadow-1)]">
                <SectionTitle icon={<FileUp size={18} />} title="2. Upload PowerPoint" subtitle="Chỉ .pptx tối đa 20 MB; API trích text/note rồi lập chỉ mục Vector DB ngay." />
                <form onSubmit={uploadPowerPoint} className="mt-5 grid gap-3 sm:grid-cols-2">
                  <Select name="subjectId" label="Môn học" required options={overview.subjects.map((subject) => ({ value: subject.id, label: `${subject.code} — ${subject.name}` }))} />
                  <Field name="title" label="Tên tài liệu" placeholder="Slide chương 1" required />
                  <Field name="description" label="Mô tả" placeholder="Tùy chọn" />
                  <label className="text-[12px] font-semibold text-ink-2">File PowerPoint (.pptx, tối đa 20 MB)
                    <input name="file" type="file" accept=".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation" required className="mt-1.5 block h-10 w-full rounded-[8px] border border-line bg-paper-2 px-2 py-1.5 text-[12px] file:mr-2 file:rounded file:border-0 file:bg-orange-soft file:px-2 file:py-1 file:text-orange-dark" />
                  </label>
                  <button disabled={busy === "upload" || overview.subjects.length === 0} className="h-10 rounded-[8px] bg-orange px-4 text-[13px] font-semibold text-white disabled:opacity-50 sm:col-span-2">
                    {busy === "upload" ? "Đang trích xuất và lập chỉ mục..." : "Upload và lập chỉ mục"}
                  </button>
                </form>
              </section>
            </div>

            <section className="rounded-[12px] border border-line bg-paper p-5 shadow-[var(--shadow-1)]">
              <div className="flex items-center justify-between gap-3">
                <SectionTitle icon={<Database size={18} />} title="Tài liệu đã tải" subtitle="Theo dõi trạng thái trích text, slide và vector indexing." />
                <button type="button" onClick={() => void refresh()} aria-label="Làm mới" className="grid h-9 w-9 place-items-center rounded-[7px] border border-line text-ink-3 hover:bg-paper-2"><RefreshCw size={15} /></button>
              </div>
              <div className="mt-4 divide-y divide-line">
                {overview.materials.length === 0 ? <Empty text="Chưa có tài liệu." /> : overview.materials.map((material) => (
                  <div key={material.id} className="py-3">
                    <p className="text-[13.5px] font-semibold text-ink">{material.title}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {material.material_versions.map((version) => (
                        <span key={version.id} className="rounded-[6px] border border-line bg-paper-2 px-2.5 py-1 text-[11px] text-ink-2">
                          v{version.version_number} · {version.status} · {version.slide_count} slide
                          {version.error_message ? ` · ${version.error_message}` : ""}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[12px] border border-line bg-paper p-5 shadow-[var(--shadow-1)]">
              <SectionTitle icon={<Sparkles size={18} />} title="3. AI tạo câu hỏi từ Vector DB" subtitle="Chọn đúng phiên bản tài liệu đã xử lý; kết quả luôn ở trạng thái nháp." />
              <form onSubmit={generateQuestions} className="mt-5 grid gap-4 lg:grid-cols-4">
                <Select name="subjectId" label="Môn học" required options={overview.subjects.map((subject) => ({ value: subject.id, label: `${subject.code} — ${subject.name}` }))} />
                <Select name="difficulty" label="Độ khó" required options={[{ value: "basic", label: "Cơ bản" }, { value: "medium", label: "Trung bình" }, { value: "advanced", label: "Nâng cao" }]} />
                <Field name="questionCount" label="Số câu" type="number" min="1" max="20" defaultValue="5" required />
                <Field name="extraInstructions" label="Yêu cầu thêm" placeholder="Tập trung chương 2" />
                <div className="lg:col-span-4">
                  <p className="mb-2 text-[12px] font-semibold text-ink-2">Nguồn tài liệu đã vector hóa</p>
                  <div className="flex flex-wrap gap-2">
                    {readyVersions.length === 0 ? <span className="text-[12px] text-ink-3">Chưa có phiên bản READY.</span> : readyVersions.map((version) => {
                      const selected = selectedVersionIds.includes(version.id);
                      return (
                        <button key={version.id} type="button" onClick={() => setSelectedVersionIds((current) => selected ? current.filter((id) => id !== version.id) : [...current, version.id])} className={`rounded-[7px] border px-3 py-2 text-[12px] font-semibold ${selected ? "border-orange bg-orange-soft text-orange-dark" : "border-line bg-paper-2 text-ink-2"}`}>
                          {selected && <Check size={12} className="mr-1 inline" />}{version.material.title} · v{version.version_number}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <button disabled={busy === "generate" || selectedVersionIds.length === 0} className="h-11 rounded-[8px] bg-orange px-5 text-[13px] font-semibold text-white disabled:opacity-50 lg:col-span-4">
                  {busy === "generate" ? "AI đang truy xuất nguồn và tạo câu hỏi..." : "Tạo câu hỏi nháp bằng AI"}
                </button>
              </form>
            </section>

            <section className="rounded-[12px] border border-line bg-paper p-5 shadow-[var(--shadow-1)]">
              <SectionTitle icon={<FileQuestion size={18} />} title="4. Admin duyệt ngân hàng câu hỏi" subtitle="Kiểm tra đáp án và nguồn slide trước khi đưa vào đề." />
              <div className="mt-5 space-y-4">
                {overview.questions.length === 0 ? <Empty text="Chưa có câu hỏi AI." /> : overview.questions.map((question, index) => (
                  <article key={question.id} className="rounded-[10px] border border-line bg-paper-2 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-bold uppercase tracking-wide text-orange">Câu {index + 1} · {question.difficulty} · {question.status}</p>
                        <h3 className="mt-1.5 text-[14px] font-semibold leading-relaxed text-ink">{question.prompt}</h3>
                      </div>
                      {question.status === "approved" && (
                        <label className="flex items-center gap-2 text-[12px] font-semibold text-ink-2">
                          <input type="checkbox" checked={selectedQuestionIds.includes(question.id)} onChange={(event) => setSelectedQuestionIds((current) => event.target.checked ? [...current, question.id] : current.filter((id) => id !== question.id))} /> Chọn vào đề
                        </label>
                      )}
                    </div>
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      {[...question.question_options].sort((a, b) => a.position - b.position).map((option) => (
                        <div key={option.id} className={`rounded-[7px] border px-3 py-2 text-[12.5px] ${option.is_correct ? "border-green/30 bg-green-soft text-green" : "border-line bg-paper text-ink-2"}`}>
                          {String.fromCharCode(65 + option.position)}. {option.content}
                        </div>
                      ))}
                    </div>
                    <p className="mt-3 text-[12.5px] leading-relaxed text-ink-2"><strong className="text-ink">Giải thích:</strong> {question.explanation}</p>
                    <p className="mt-2 text-[11px] text-ink-3">Nguồn: {question.question_sources.map((source) => `slide ${source.slide_number}`).join(", ") || "chưa có"}</p>
                    {question.status === "draft" && (
                      <div className="mt-3 flex gap-2 border-t border-line pt-3">
                        <button disabled={busy === `question-${question.id}`} onClick={() => void reviewQuestion(question.id, "approved")} className="inline-flex h-9 items-center gap-1.5 rounded-[7px] bg-green px-3 text-[12px] font-semibold text-white disabled:opacity-50"><Check size={14} /> Duyệt</button>
                        <button disabled={busy === `question-${question.id}`} onClick={() => void reviewQuestion(question.id, "rejected")} className="inline-flex h-9 items-center gap-1.5 rounded-[7px] border border-danger/25 bg-danger-soft px-3 text-[12px] font-semibold text-danger disabled:opacity-50"><X size={14} /> Từ chối</button>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-[12px] border border-line bg-paper p-5 shadow-[var(--shadow-1)]">
              <SectionTitle icon={<Bot size={18} />} title="5. Admin tạo và xuất bản đề" subtitle={`${selectedQuestionIds.length} câu đã duyệt đang được chọn.`} />
              <form onSubmit={createExam} className="mt-5 grid gap-3 lg:grid-cols-4">
                <Select name="subjectId" label="Môn học" required options={overview.subjects.map((subject) => ({ value: subject.id, label: `${subject.code} — ${subject.name}` }))} />
                <Field name="title" label="Tên đề" placeholder="Đề luyện chương 1" required />
                <Field name="durationMinutes" label="Thời gian (phút)" type="number" min="1" defaultValue="60" required />
                <label className="flex h-16 items-end gap-2 pb-2 text-[12px] font-semibold text-ink-2"><input name="publish" type="checkbox" /> Xuất bản ngay</label>
                <button disabled={busy === "exam" || selectedQuestionIds.length === 0} className="h-11 rounded-[8px] bg-ink px-5 text-[13px] font-semibold text-white disabled:opacity-50 lg:col-span-4">
                  {busy === "exam" ? "Đang tạo đề..." : "Tạo đề từ các câu đã chọn"}
                </button>
              </form>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function SectionTitle({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[8px] bg-orange-soft text-orange">{icon}</span>
      <div><h2 className="text-[15px] font-bold text-ink">{title}</h2><p className="mt-0.5 text-[12px] text-ink-3">{subtitle}</p></div>
    </div>
  );
}

function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const { label, className, ...inputProps } = props;
  return (
    <label className="text-[12px] font-semibold text-ink-2">{label}
      <input {...inputProps} className={`mt-1.5 h-10 w-full rounded-[8px] border border-line bg-paper-2 px-3 text-[13px] text-ink outline-none focus:border-orange ${className || ""}`} />
    </label>
  );
}

function Select({ label, options, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; options: Array<{ value: string; label: string }> }) {
  return (
    <label className="text-[12px] font-semibold text-ink-2">{label}
      <select {...props} className="mt-1.5 h-10 w-full rounded-[8px] border border-line bg-paper-2 px-3 text-[13px] text-ink outline-none focus:border-orange">
        <option value="">Chọn...</option>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="py-6 text-center text-[13px] text-ink-3">{text}</p>;
}
