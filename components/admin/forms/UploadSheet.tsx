"use client";

import { useMemo, useRef, useState, type DragEvent, type FormEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { FileChartColumn, FileText, Upload, X } from "lucide-react";
import { formatSizeMB, subjectCode, uploadMaterial } from "@/lib/admin";
import { materialUnit } from "@/lib/dashboard-helpers";
import { useAdminData, useToast } from "../AdminData";
import { Combobox, DialogFooter, Sheet } from "../overlays";
import { Button, Field, IconButton, INPUT, TEXTAREA, cx } from "../ui";

const MAX_BYTES = 20 * 1024 * 1024;

function fileProblem(file: File): string {
  const dot = file.name.lastIndexOf(".");
  const ext = dot >= 0 ? file.name.slice(dot).toLowerCase() : "";
  if (ext !== ".pptx" && ext !== ".docx") return ext ? `Không nhận tệp ${ext}, chỉ nhận .pptx hoặc .docx` : "Không nhận tệp này, chỉ nhận .pptx hoặc .docx";
  if (file.size > MAX_BYTES) return `Quá 20 MB (tệp nặng ${formatSizeMB(file.size)})`;
  return "";
}

function UploadForm({ onClose, busy, setBusy }: { onClose: () => void; busy: boolean; setBusy: (busy: boolean) => void }) {
  const { overview, reload } = useAdminData();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [errors, setErrors] = useState<{ subject?: string; title?: string; file?: string }>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  const subjectItems = useMemo(
    () => (overview?.subjects ?? []).map((s) => ({ value: s.id, label: `${subjectCode(s)} · ${s.name}` })),
    [overview],
  );
  const problem = file ? fileProblem(file) : "";

  const pick = (next: File | null) => {
    setFile(next);
    setErrors((e) => ({ ...e, file: "" }));
  };
  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragging(false);
    const dropped = event.dataTransfer.files[0];
    if (dropped) pick(dropped);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    const titleValue = title.trim();
    const fileMessage = !file ? "Chọn một tệp .pptx hoặc .docx" : problem ? "Bỏ tệp này và chọn tệp .pptx hoặc .docx dưới 20 MB" : "";
    setErrors({
      ...(subjectId ? {} : { subject: "Chọn môn của tài liệu" }),
      ...(titleValue ? {} : { title: "Nhập tên tài liệu" }),
      ...(fileMessage ? { file: fileMessage } : {}),
    });
    if (!subjectId || !titleValue || !file || fileMessage) {
      if (subjectId && !titleValue) titleRef.current?.focus();
      return;
    }
    setBusy(true);
    try {
      const result = await uploadMaterial({
        subjectId,
        title: titleValue,
        ...(description.trim() ? { description: description.trim() } : {}),
        file,
      });
      onClose();
      toast({
        tone: "success",
        title: "Đã tải tài liệu lên",
        detail:
          result.status === "ready" && result.slideCount != null
            ? `${result.slideCount} ${materialUnit(file.name)} sẵn sàng làm nguồn cho AI`
            : "Hệ thống đang trích xuất nội dung",
      });
      if (pathname !== "/admin/tai-lieu") router.push("/admin/tai-lieu");
      await reload();
    } catch (reason) {
      toast({ tone: "error", title: "Không tải được tài liệu", detail: reason instanceof Error ? reason.message : "Vui lòng thử lại." });
    } finally {
      setBusy(false);
    }
  };

  const name = file?.name ?? "";
  const long = name.length > 22;
  const head = long ? name.slice(0, -14) : name;
  const tail = long ? name.slice(-14) : "";

  return (
    <>
      <form id="upload-form" onSubmit={(event) => void submit(event)} noValidate className="flex flex-col gap-5">
        <Field label="Môn học" htmlFor="u-subject" error={errors.subject}>
          {(aria) => (
            <Combobox
              id="u-subject"
              value={subjectId}
              onChange={(value) => {
                setSubjectId(value);
                setErrors((e) => ({ ...e, subject: "" }));
              }}
              items={subjectItems}
              placeholder="Chọn môn học"
              searchPlaceholder="Tìm môn học"
              invalid={aria["aria-invalid"]}
              describedBy={aria["aria-describedby"]}
            />
          )}
        </Field>
        <Field label="Tên tài liệu" htmlFor="u-title" error={errors.title}>
          {(aria) => (
            <input
              {...aria}
              ref={titleRef}
              id="u-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className={INPUT}
              placeholder="Chương 3 — Cây và đồ thị"
              autoComplete="off"
            />
          )}
        </Field>
        <Field label="Mô tả" htmlFor="u-desc" optional>
          <textarea id="u-desc" rows={3} value={description} onChange={(event) => setDescription(event.target.value)} className={TEXTAREA} placeholder="Nội dung, phạm vi hoặc tuần học của tài liệu" />
        </Field>
        <div>
          <p className="text-sm font-medium" id="u-file-label">Tệp PowerPoint hoặc Word</p>
          <label
            onDragEnter={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              setDragging(false);
            }}
            onDrop={onDrop}
            className={cx(
              "mt-2 flex cursor-pointer flex-col items-center rounded-xl border border-dashed px-6 py-8 text-center transition-colors focus-within:ring-2 focus-within:ring-orange/30",
              dragging ? "border-ink/40 bg-paper-2" : "border-line-strong bg-paper-2/60 hover:bg-paper-2",
            )}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pptx,.docx,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="sr-only"
              aria-labelledby="u-file-label"
              onChange={(event) => pick(event.target.files?.[0] ?? null)}
            />
            <p className="text-sm font-medium text-ink [@media(hover:none)]:hidden">{dragging ? "Thả tệp để tải lên" : "Kéo thả tệp vào đây"}</p>
            <p className="mt-1 text-sm text-pretty text-ink-3">Nhận .pptx hoặc .docx, tối đa 20 MB</p>
            <span className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg border border-line-strong bg-paper px-3 text-sm font-medium">
              <Upload aria-hidden="true" className="size-4" />
              Chọn tệp
            </span>
          </label>
          {file && (
            <ul className="mt-2">
              <li className="flex items-center gap-3 py-3">
                {file.name.toLowerCase().endsWith(".docx") ? <FileText aria-hidden="true" className="size-5 shrink-0 text-ink-3" /> : <FileChartColumn aria-hidden="true" className="size-5 shrink-0 text-ink-3" />}
                <div className="min-w-0 flex-1">
                  <p className="flex min-w-0 text-sm font-medium" title={name.length > 40 ? name : undefined}>
                    <span className="truncate">{head}</span>
                    <span className="shrink-0">{tail}</span>
                  </p>
                  <p className={cx("mt-1 text-xs", problem ? "text-red-600" : "text-ink-3")}>{problem || `Sẵn sàng tải lên · ${formatSizeMB(file.size)}`}</p>
                </div>
                <div className="flex w-8 shrink-0 justify-end">
                  <IconButton
                    icon={X}
                    label={`Bỏ tệp ${name}`}
                    onClick={() => {
                      pick(null);
                      if (inputRef.current) inputRef.current.value = "";
                    }}
                  />
                </div>
              </li>
            </ul>
          )}
          {errors.file && <p className="mt-1.5 text-sm text-red-600">{errors.file}</p>}
        </div>
      </form>
    </>
  );
}

export function UploadSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Tải tài liệu lên"
      description="Hệ thống trích chữ trên từng slide hoặc từng phần của tài liệu Word, rồi lập chỉ mục để AI soạn đề bám đúng nội dung môn."
      footer={
        <DialogFooter sticky>
          <Button variant="secondary" onClick={onClose} className="min-h-11 md:min-h-10">Huỷ</Button>
          <Button variant="primary" type="submit" form="upload-form" busy={busy} className="min-h-11 md:min-h-10">Tải lên và lập chỉ mục</Button>
        </DialogFooter>
      }
    >
      <UploadForm onClose={onClose} busy={busy} setBusy={setBusy} />
    </Sheet>
  );
}
