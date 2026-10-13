"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { BookOpen, ChevronDown, ClipboardList, FileChartColumn, Plus, type LucideIcon } from "lucide-react";
import { latestVersion, readyVersionsOf, subjectCode, type AdminMaterial, type AdminOverview, type ServiceStatus } from "@/lib/admin";
import { SubjectModal } from "../forms/SubjectModal";
import { Button, CardHeader, EmptyLine, Spinner, cx, nf } from "../ui";
import { Code, ViewGate } from "./common";

const SERVICE_LABELS: Array<[string, string]> = [
  ["database", "Cơ sở dữ liệu"],
  ["mongodb", "MongoDB vector"],
  ["storage", "Lưu trữ tệp S3"],
  ["openai", "OpenAI"],
  ["pptxTextExtraction", "Trích text PPTX"],
  ["converter", "Chuyển đổi tệp"],
];
const SERVICE_MISSING_NOTE: Record<string, string> = {
  converter: "Chỉ nhận tệp .pptx",
  openai: "Chưa tạo được đề bằng AI",
};

function ViewAll({ href }: { href: string }) {
  return (
    <Link href={href} className="my-1 inline-flex h-8 items-center text-sm font-medium text-ink/70 underline-offset-4 outline-hidden hover:text-ink hover:underline focus-visible:ring-2 focus-visible:ring-orange/30">
      Xem tất cả
    </Link>
  );
}

function StatCell({ href, label, value, sub, icon: Icon }: { href: string; label: string; value: number; sub: ReactNode; icon: LucideIcon }) {
  return (
    <Link href={href} className="flex min-w-0 items-start justify-between gap-3 bg-paper p-4 outline-hidden transition-colors hover:bg-paper-2 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange/30 sm:p-5">
      <span className="min-w-0">
        <span className="block text-xs font-medium text-ink-3">{label}</span>
        <span className="mt-1 block text-xl font-semibold tabular-nums text-ink sm:text-2xl">{nf.format(value)}</span>
        <span className="mt-1 block text-xs text-pretty text-ink-3">{sub}</span>
      </span>
      <span className="hidden size-8 shrink-0 items-center justify-center rounded-lg bg-orange-soft text-orange sm:inline-flex">
        <Icon aria-hidden="true" className="size-4" />
      </span>
    </Link>
  );
}

function Onboarding({ onAddSubject }: { onAddSubject: () => void }) {
  const steps: Array<{ title: string; why: string; action?: ReactNode }> = [
    {
      title: "Thêm môn học",
      why: "Môn học gom tài liệu và đề thi của một học phần.",
      action: <Button variant="primary" icon={Plus} onClick={onAddSubject}>Thêm môn học</Button>,
    },
    {
      title: "Tải PowerPoint lên (nên làm)",
      why: "Thêm môn học trước. Có tài liệu thì AI soạn câu hỏi bám đúng nội dung môn và ghi nguồn slide; không có thì AI tự soạn theo kiến thức chung.",
    },
    { title: "Tạo đề bằng AI", why: "Thêm môn học trước. AI soạn câu hỏi, đáp án và lời giải, rồi lưu đề ở trạng thái nháp." },
    { title: "Kiểm và xuất bản đề", why: "Đề chỉ đến tay sinh viên sau khi bạn kiểm từng câu và bấm xuất bản." },
  ];
  return (
    <section className="max-w-3xl overflow-hidden rounded-2xl border border-line bg-paper">
      <div className="px-4 pt-4 pb-4 sm:px-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-medium">Các bước bắt đầu</h2>
          <span className="text-sm tabular-nums text-ink-3">0 / {steps.length} bước</span>
        </div>
        <div className="mt-3 h-1.5 w-full rounded-full bg-ink/5" role="progressbar" aria-valuenow={0} aria-valuemin={0} aria-valuemax={steps.length} aria-label="Tiến độ các bước bắt đầu">
          <div className="h-1.5 w-0 rounded-full bg-orange" />
        </div>
      </div>
      <ul className="divide-y divide-line border-t border-line">
        {steps.map((step, i) => (
          <li key={step.title}>
            <details open={i === 0} className="group">
              <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 outline-hidden focus-visible:bg-paper-2 sm:px-5 [&::-webkit-details-marker]:hidden">
                <span className="size-5 shrink-0 rounded-full border-[1.5px] border-dashed border-ink/40" aria-hidden="true" />
                <span className="min-w-0 flex-1 text-sm font-medium">{step.title}</span>
                <ChevronDown aria-hidden="true" className="size-4 text-ink-3 transition-transform duration-200 group-open:rotate-180" />
              </summary>
              <div className="pr-4 pb-4 pl-12 sm:pr-5 sm:pl-13">
                <p className="text-sm text-pretty text-ink-3">{step.why}</p>
                {step.action && <div className="mt-4">{step.action}</div>}
              </div>
            </details>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Dashboard({ overview, services }: { overview: AdminOverview; services: ServiceStatus["services"] | null }) {
  const { subjects, materials, exams } = overview;
  const latest = materials.map((m) => ({ material: m, version: latestVersion(m) })).filter((x): x is { material: AdminMaterial; version: NonNullable<ReturnType<typeof latestVersion>> } => x.version !== null);
  const readyCount = latest.filter((x) => x.version.status === "ready").length;
  const failedCount = latest.filter((x) => x.version.status === "failed").length;
  const withoutMaterials = subjects.filter((s) => readyVersionsOf(materials, s.id).length === 0).length;
  const drafts = exams.filter((e) => e.status === "draft").slice().sort((a, b) => b.created_at.localeCompare(a.created_at));
  const published = exams.filter((e) => e.status === "published").length;
  const subjectById = new Map(subjects.map((s) => [s.id, s]));
  const attention = latest.filter((x) => x.version.status !== "ready");
  const readyServices = SERVICE_LABELS.filter(([key]) => services?.[key]).length;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-3">
        <StatCell href="/admin/mon-hoc" label="Môn học" value={subjects.length} icon={BookOpen} sub={withoutMaterials ? `${withoutMaterials} môn chưa có tài liệu, AI sẽ tự soạn` : "Môn nào cũng có tài liệu"} />
        <StatCell
          href="/admin/tai-lieu"
          label="Tài liệu"
          value={materials.length}
          icon={FileChartColumn}
          sub={
            <>
              {readyCount} sẵn sàng
              {failedCount > 0 && <> · <span className="font-medium text-red-700">{failedCount} lỗi</span></>}
            </>
          }
        />
        <StatCell
          href="/admin/de-thi"
          label="Đề thi"
          value={exams.length}
          icon={ClipboardList}
          sub={
            drafts.length ? (
              <>
                <span className="font-medium text-ink">{drafts.length} chờ duyệt</span> · {published} đã xuất bản
              </>
            ) : (
              `${published} đã xuất bản`
            )
          }
        />
      </div>
      <div className="grid grid-cols-1 items-start gap-3 xl:grid-cols-3">
        <section className="flex flex-col rounded-2xl border border-line bg-paper py-5 xl:col-span-2">
          <CardHeader title="Đề chờ duyệt" sub={drafts.length ? nf.format(drafts.length) : undefined} action={drafts.length ? <ViewAll href="/admin/de-thi" /> : undefined} />
          <div className="min-h-0 flex-1 px-2">
            {drafts.length ? (
              <ul className="flex flex-col gap-0.5">
                {drafts.slice(0, 6).map((e) => {
                  const subject = subjectById.get(e.subject_id);
                  return (
                    <li key={e.id}>
                      <Link href={`/admin/de-thi/${e.id}`} className="block rounded-xl px-3 py-2.5 outline-hidden transition-colors hover:bg-paper-3 focus-visible:ring-2 focus-visible:ring-orange/30">
                        <p className="truncate text-sm font-medium text-ink" title={e.title}>{e.title}</p>
                        <p className="mt-1 truncate text-xs text-ink-3">
                          {subject && <Code>{subjectCode(subject)}</Code>} · Đã kiểm {e.checked_count}/{e.question_count} câu ·{" "}
                          {e.source === "ai" ? <span className="font-medium text-amber-700">AI tự soạn</span> : "Từ tài liệu"}
                        </p>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyLine>Không có đề nào chờ duyệt. Đề AI vừa soạn sẽ hiện ở đây.</EmptyLine>
            )}
          </div>
        </section>
        <div className="flex flex-col gap-3">
          <section className="flex flex-col rounded-2xl border border-line bg-paper py-5">
            <CardHeader title="Tài liệu cần chú ý" action={attention.length ? <ViewAll href="/admin/tai-lieu" /> : undefined} />
            <div className="px-2">
              {attention.length ? (
                <ul className="flex flex-col gap-0.5">
                  {attention.map(({ material, version }) => {
                    const subject = subjectById.get(material.subject_id);
                    return (
                      <li key={material.id}>
                        <Link href="/admin/tai-lieu" className="flex gap-3 rounded-xl px-3 py-2.5 outline-hidden transition-colors hover:bg-paper-3 focus-visible:ring-2 focus-visible:ring-orange/30">
                          <FileChartColumn aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-ink-3" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium" title={material.title}>{material.title}</p>
                            {version.status === "failed" ? (
                              <p className="mt-1 text-xs text-pretty text-red-600">{version.error_message}</p>
                            ) : (
                              <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-3">
                                <Spinner className="size-3.5" />
                                Đang trích xuất slide · {subject && <Code>{subjectCode(subject)}</Code>}
                              </p>
                            )}
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <EmptyLine>Mọi tài liệu đã xử lý xong.</EmptyLine>
              )}
            </div>
          </section>
          <section className="rounded-2xl border border-line bg-paper py-5">
            <CardHeader title="Dịch vụ" sub={services ? `${readyServices}/${SERVICE_LABELS.length} sẵn sàng` : undefined} />
            {services ? (
              <ul className="mt-1.5 divide-y divide-line px-5">
                {SERVICE_LABELS.map(([key, label]) => {
                  const ok = Boolean(services[key]);
                  return (
                    <li key={key} className="py-2.5">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm">{label}</span>
                        <span className={cx("inline-flex items-center gap-1.5 text-xs font-medium", ok ? "text-emerald-700" : "text-amber-700")}>
                          <span className={cx("size-1.5 rounded-full", ok ? "bg-emerald-600" : "bg-amber-600")} aria-hidden="true" />
                          {ok ? "Sẵn sàng" : "Chưa cấu hình"}
                        </span>
                      </div>
                      {!ok && SERVICE_MISSING_NOTE[key] && <p className="mt-0.5 text-xs text-ink-3">{SERVICE_MISSING_NOTE[key]}</p>}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyLine>Không kiểm tra được trạng thái dịch vụ.</EmptyLine>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export function OverviewView() {
  const [modal, setModal] = useState(false);
  return (
    <>
      <ViewGate kind="overview">
        {(overview, services) =>
          overview.subjects.length ? <Dashboard overview={overview} services={services} /> : <Onboarding onAddSubject={() => setModal(true)} />
        }
      </ViewGate>
      <SubjectModal open={modal} onClose={() => setModal(false)} />
    </>
  );
}
