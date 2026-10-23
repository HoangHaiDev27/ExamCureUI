"use client";

import Link from "next/link";
import { useCallback, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, ChevronRight, Clock, FileText, Presentation, Play } from "lucide-react";
import { useAuth, useAuthReady } from "@/lib/auth";
import { useAuthModal } from "@/components/auth/AuthModalProvider";
import {
  codeFromRouteId,
  difficultyLabel,
  listSubjectExams,
  listSubjectMaterials,
  listSubjects,
  subjectRouteId,
  type CatalogSubject,
  type DifficultyCode,
  type ExamSummary,
  type SubjectMaterial,
} from "@/lib/catalog";
import { classify, TONE_COLOR } from "@/lib/grade";
import { examHref, materialHref, materialUnit } from "@/lib/dashboard-helpers";
import { examRow, examStartHref, termsLabel, type ExamRowView } from "@/lib/subject-detail";
import { useResource } from "@/lib/useResource";
import type { School } from "@/lib/types";
import { primaryAction } from "./exam/status";

const DIFF_STYLE: Record<DifficultyCode, string> = {
  basic: "border-green text-green bg-green-soft",
  medium: "border-blue text-blue-dark bg-blue-soft",
  advanced: "border-orange-border text-orange-dark bg-orange-soft",
};

type Loaded = { subject: CatalogSubject; exams: ExamSummary[]; materials: SubjectMaterial[] } | null;

export function SubjectDetail({ school, routeId }: { school: School; routeId: string }) {
  const user = useAuth();
  const ready = useAuthReady();
  const { openAuth } = useAuthModal();
  const router = useRouter();
  const code = codeFromRouteId(school.id, routeId);

  // Redirect if logged-in user belongs to another school
  useEffect(() => {
    if (user && user.schoolId && user.schoolId !== school.id && code) {
      router.replace(`/schools/${user.schoolId}/subjects/${subjectRouteId(user.schoolId, code)}`);
    }
  }, [user, school.id, code, router]);

  const load = useCallback(
    async (signal: AbortSignal): Promise<Loaded> => {
      if (!code) return null;
      const subject = (await listSubjects(school.id, { code, signal }))[0];
      if (!subject) return null;
      const [exams, materials] = await Promise.all([
        listSubjectExams(subject.id, signal),
        listSubjectMaterials(school.id, subject.code, signal),
      ]);
      return { subject, exams, materials };
    },
    [school.id, code],
  );
  const res = useResource(load, Boolean(user));

  if (!user)
    return (
      <Shell school={school} label={code?.toUpperCase() ?? routeId}>
        <Notice
          title={ready ? "Đăng nhập để xem môn học" : "Đang tải…"}
          actions={
            ready && (
              <button type="button" onClick={() => openAuth("login", window.location.pathname)} className={primaryAction}>
                Đăng nhập
              </button>
            )
          }
        >
          {ready && "Bạn cần đăng nhập để xem đề thi, điểm của mình và giáo trình của môn học này."}
        </Notice>
      </Shell>
    );
  if (res.error && res.data === null)
    return (
      <Shell school={school} label={code?.toUpperCase() ?? routeId}>
        <Notice
          tone="danger"
          title="Có lỗi xảy ra"
          actions={<button type="button" onClick={res.reload} className={primaryAction}>Thử lại</button>}
        >
          {res.error}
        </Notice>
      </Shell>
    );
  if (res.loading || (res.data === null && !res.error && code))
    return (
      <Shell school={school} label={code?.toUpperCase() ?? routeId}>
        <Notice title="Đang tải môn học…" />
      </Shell>
    );
  if (!res.data)
    return (
      <Shell school={school} label={code?.toUpperCase() ?? routeId}>
        <Notice
          title="Không tìm thấy môn học"
          actions={<Link href="/dashboard?tab=mon-hoc" className={primaryAction}>Về danh mục môn học</Link>}
        />
      </Shell>
    );
  return <Content school={school} data={res.data} />;
}

function Shell({ school, label, children }: { school: School; label: string; children: ReactNode }) {
  return (
    <main className="mx-auto max-w-[1180px] px-5 pb-20 lg:px-8">
      <nav className="flex flex-wrap items-center gap-1.5 py-5 text-[13px] text-ink-3">
        <Link href="/" className="hover:text-ink">Trang chủ</Link>
        <ChevronRight size={14} />
        <Link href="/schools" className="hover:text-ink">Chọn trường</Link>
        <ChevronRight size={14} />
        <Link href="/schools" className="hover:text-ink">{school.abbr}</Link>
        <ChevronRight size={14} />
        <span className="font-medium text-ink-2">{label}</span>
      </nav>
      {children}
    </main>
  );
}

function Notice({
  title,
  children,
  actions,
  tone = "default",
}: {
  title: string;
  children?: ReactNode;
  actions?: ReactNode;
  tone?: "default" | "danger";
}) {
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className="mx-auto mt-6 w-full max-w-md rounded-[14px] border border-line bg-paper p-8 text-center shadow-[var(--shadow-1)]"
    >
      <h1 className={`font-display text-[20px] font-semibold ${tone === "danger" ? "text-danger" : "text-ink"}`}>{title}</h1>
      {children && <div className="mt-1.5 text-[14px] text-ink-2">{children}</div>}
      {actions && <div className="mt-5 flex flex-wrap items-center justify-center gap-2">{actions}</div>}
    </div>
  );
}

function Content({ school, data }: { school: School; data: NonNullable<Loaded> }) {
  const { subject, exams, materials } = data;
  const grade = subject.lastScore != null ? classify(subject.lastScore) : null;
  const diff = difficultyLabel(subject.difficulty);
  const terms = termsLabel(subject.terms);
  const rows = exams.map((e, i) => examRow(e, i));
  const meta = [
    subject.faculty,
    terms,
    subject.questionCount != null ? (
      <span key="q" className="inline-flex items-center gap-1.5"><FileText size={14} className="text-ink-3" /> {subject.questionCount} câu / đề</span>
    ) : null,
    subject.durationMin != null ? (
      <span key="d" className="inline-flex items-center gap-1.5"><Clock size={14} className="text-ink-3" /> {subject.durationMin} phút</span>
    ) : null,
  ].filter(Boolean);

  return (
    <Shell school={school} label={subject.code}>
      <header className="overflow-hidden rounded-[12px] border border-line bg-paper shadow-[var(--shadow-1)]">
        <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-center lg:gap-8 lg:p-6">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="rounded-[5px] border border-line bg-paper-2 px-2 py-0.5 font-mono text-[12px] font-semibold text-ink-2">
                {subject.code}
              </span>
              {diff && subject.difficulty && (
                <span className={`inline-flex rounded-[5px] border px-2 py-0.5 text-[12px] font-medium ${DIFF_STYLE[subject.difficulty]}`}>{diff}</span>
              )}
            </div>
            <h1 className="mt-2.5 font-display text-[28px] font-semibold leading-tight text-ink sm:text-[34px]">{subject.name}</h1>
            {meta.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13.5px] text-ink-2">
                {meta.map((m, i) => (
                  <span key={i} className="inline-flex items-center gap-4">
                    {i > 0 && <span className="hidden h-1 w-1 rounded-full bg-line-strong sm:block" aria-hidden />}
                    {m}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-5 border-t border-line pt-4 lg:flex-col lg:items-end lg:gap-3 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <div className="lg:text-right">
              <p className="text-[12px] text-ink-3">Điểm gần nhất</p>
              {grade ? (
                <span className="mt-0.5 inline-flex items-center gap-1.5">
                  <span className="tnum font-display text-[24px] font-semibold leading-none" style={{ color: TONE_COLOR[grade.tone] }}>
                    {subject.lastScore?.toFixed(1)}
                  </span>
                  <span className="rounded-[4px] px-1.5 py-0.5 text-[11px] font-semibold text-white" style={{ background: TONE_COLOR[grade.tone] }}>
                    {grade.letter}
                  </span>
                </span>
              ) : (
                <p className="mt-0.5 text-[15px] font-medium text-ink-3">Chưa thi</p>
              )}
            </div>
            {subject.publishedExamCount > 0 ? (
              <Link
                href={examHref(school.id, subject.code)}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] bg-orange px-5 text-[14.5px] font-medium text-white shadow-[0_1px_2px_rgba(7,141,248,0.32)] transition-colors hover:bg-orange-dark"
              >
                <Play size={16} fill="currentColor" /> Vào thi ngay
              </Link>
            ) : (
              <span className="inline-flex h-11 items-center justify-center rounded-[8px] border border-line bg-paper-2 px-5 text-[14px] font-medium text-ink-3" aria-disabled="true">
                Chưa có đề
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-1 border-t border-line bg-paper-2 px-3 py-2">
          <TabLink href="#tai-lieu" icon={BookOpen} label="Giáo trình" count={materials.length} />
          <TabLink href="#thi-thu" icon={FileText} label="Đề thi" count={rows.length} />
        </div>
      </header>

      <section id="tai-lieu" className="mt-10 scroll-mt-20">
        <SectionHead
          eyebrow="Ôn trước khi thi"
          title="Giáo trình"
          desc="Tài liệu do quản trị viên tải lên; hệ thống trích nội dung theo từng slide hoặc từng phần."
          count={`${materials.length} tài liệu`}
        />
        {materials.length === 0 ? (
          <p className="mt-5 rounded-[8px] border border-dashed border-line-strong bg-paper px-4 py-3 text-[13px] text-ink-3">
            Môn học này chưa có giáo trình được xuất bản.
          </p>
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {materials.map((m) => (
              <MaterialCard key={m.id} href={materialHref(school.id, subject.code, m.version.id)} material={m} />
            ))}
          </div>
        )}
      </section>

      <section id="thi-thu" className="mt-12 scroll-mt-20">
        <SectionHead
          eyebrow="Sẵn sàng vào phòng thi"
          title="Đề thi"
          desc={`Các đề mô phỏng giao diện ${school.theme.systemName}, có đồng hồ đếm ngược và chấm điểm tức thì.`}
          count={`${rows.length} đề`}
        />
        {rows.length === 0 ? (
          <p className="mt-5 rounded-[8px] border border-dashed border-line-strong bg-paper px-4 py-3 text-[13px] text-ink-3">
            Môn này chưa có đề thi
          </p>
        ) : (
          <div className="mt-5 overflow-hidden rounded-[10px] border border-line bg-paper shadow-[var(--shadow-1)]">
            <div className="hidden grid-cols-[1fr_96px_96px_120px_150px_150px] gap-4 border-b border-line bg-paper-2 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-wide text-ink-3 lg:grid">
              <span>Đề thi</span>
              <span className="text-center">Số câu</span>
              <span className="text-center">Thời lượng</span>
              <span className="text-center">Độ khó</span>
              <span className="text-center">Điểm cao nhất</span>
              <span />
            </div>
            {rows.map((r) => (
              <ExamRow key={r.id} row={r} href={examStartHref(school.id, subject.code, r.id)} />
            ))}
          </div>
        )}
      </section>
    </Shell>
  );
}

function TabLink({ href, icon: Icon, label, count }: { href: string; icon: typeof BookOpen; label: string; count: number }) {
  return (
    <a
      href={href}
      className="inline-flex items-center gap-2 rounded-[7px] px-3.5 py-2 text-[13.5px] font-medium text-ink-2 transition-colors hover:bg-paper hover:text-ink"
    >
      <Icon size={15} className="text-ink-3" />
      {label}
      <span className="tnum rounded-full bg-paper-3 px-1.5 py-0.5 text-[11px] font-semibold text-ink-3">{count}</span>
    </a>
  );
}

function SectionHead({ eyebrow, title, desc, count }: { eyebrow: string; title: string; desc: string; count: string }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="max-w-2xl">
        <p className="text-[12.5px] font-semibold uppercase tracking-wide text-orange">{eyebrow}</p>
        <h2 className="mt-1 font-display text-[24px] font-semibold leading-tight text-ink sm:text-[28px]">{title}</h2>
        <p className="mt-1.5 text-[14.5px] leading-relaxed text-ink-2">{desc}</p>
      </div>
      <span className="tnum shrink-0 text-[13px] text-ink-3">{count}</span>
    </div>
  );
}

function MaterialCard({ href, material: m }: { href: string; material: SubjectMaterial }) {
  const updated = new Date(m.version.processed_at || m.createdAt).toLocaleDateString("vi-VN");
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-[10px] border border-line bg-paper p-4 shadow-[var(--shadow-1)] transition-all hover:-translate-y-0.5 hover:border-line-strong hover:shadow-[var(--shadow-2)]"
    >
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[9px] bg-orange-soft text-orange-dark">
          {m.version.original_filename.toLowerCase().endsWith(".docx") ? <FileText size={20} strokeWidth={1.9} /> : <Presentation size={20} strokeWidth={1.9} />}
        </span>
        <p className="tnum text-[12.5px] text-ink-2">{m.version.slide_count} {materialUnit(m.version.original_filename)}</p>
      </div>
      <h3 className="mt-3 line-clamp-2 text-[15px] font-semibold leading-snug text-ink">{m.title}</h3>
      <p className="mt-auto min-w-0 truncate pt-3.5 text-[12px] text-ink-3">
        {m.version.original_filename} · cập nhật {updated}
      </p>
      <div className="mt-2.5 border-t border-line pt-2.5">
        <span className="inline-flex items-center gap-1 text-[13px] font-medium text-orange transition-colors group-hover:text-orange-dark">
          Mở giáo trình <ChevronRight size={14} className="transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}

function ExamRow({ row: e, href }: { row: ExamRowView; href: string }) {
  const grade = e.bestScore != null ? classify(e.bestScore) : null;
  return (
    <div className="grid grid-cols-1 items-center gap-3 border-b border-line px-5 py-4 transition-colors last:border-0 hover:bg-paper-2 lg:grid-cols-[1fr_96px_96px_120px_150px_150px] lg:gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2.5">
          <span className="tnum grid h-7 w-7 shrink-0 place-items-center rounded-[6px] bg-paper-3 text-[12.5px] font-semibold text-ink-2">{e.index}</span>
          <h3 className="truncate text-[15px] font-semibold text-ink">{e.title}</h3>
        </div>
        {e.attemptsLabel && <p className="mt-1 text-[12.5px] text-ink-3">{e.attemptsLabel}</p>}
      </div>
      <div className="flex items-center gap-1.5 text-[13px] text-ink-2 lg:justify-center">
        <FileText size={14} className="text-ink-3 lg:hidden" />
        <span className="tnum font-medium text-ink lg:text-[14px]">{e.questionCount}</span>
        <span className="lg:hidden">câu</span>
      </div>
      <div className="flex items-center gap-1.5 text-[13px] text-ink-2 lg:justify-center">
        <Clock size={14} className="text-ink-3" />
        <span className="tnum">{e.durationMinutes}′</span>
      </div>
      <div className="lg:flex lg:justify-center">
        {e.difficulty && (
          <span className="inline-flex rounded-[5px] border border-line bg-paper-2 px-2 py-0.5 text-[12px] font-medium text-ink-2">{e.difficulty}</span>
        )}
      </div>
      <div className="lg:flex lg:justify-center">
        {grade ? (
          <span className="inline-flex items-center gap-1.5">
            <span className="tnum text-[15px] font-semibold" style={{ color: TONE_COLOR[grade.tone] }}>{e.bestScore?.toFixed(1)}</span>
            <span className="rounded-[4px] px-1.5 py-0.5 text-[11px] font-semibold text-white" style={{ background: TONE_COLOR[grade.tone] }}>{grade.letter}</span>
          </span>
        ) : (
          <span className="text-[13px] text-ink-3">Chưa làm</span>
        )}
      </div>
      <div className="lg:flex lg:justify-end">
        <Link
          href={href}
          className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-[7px] bg-orange px-4 text-[14px] font-medium text-white shadow-[0_1px_2px_rgba(7,141,248,0.32)] transition-colors hover:bg-orange-dark lg:w-auto"
        >
          <Play size={15} fill="currentColor" /> Bắt đầu
        </Link>
      </div>
    </div>
  );
}
