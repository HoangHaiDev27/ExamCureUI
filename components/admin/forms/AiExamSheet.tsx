"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { DIFFICULTY_LABEL, generateExam, readyVersionsOf, subjectCode, type Difficulty } from "@/lib/admin";
import { materialUnit } from "@/lib/dashboard-helpers";
import { useAdminData, useToast } from "../AdminData";
import { Combobox, DialogFooter, Sheet } from "../overlays";
import { Button, Checkbox, Field, INPUT, Radio, TEXTAREA, cx } from "../ui";

const DIFFICULTIES = Object.keys(DIFFICULTY_LABEL) as Difficulty[];

function AiExamSheetInner({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated?: () => void }) {
  const { overview, reload, trackGenerating } = useAdminData();
  const { toast } = useToast();
  const router = useRouter();
  const subjects = useMemo(() => overview?.subjects ?? [], [overview]);
  const materials = useMemo(() => overview?.materials ?? [], [overview]);

  const [subjectId, setSubjectId] = useState<string | null>(() => {
    const withMaterials = subjects.find((s) => readyVersionsOf(materials, s.id).length > 0);
    return (withMaterials ?? subjects[0])?.id ?? null;
  });
  const [selected, setSelected] = useState<Set<string>>(() => {
    const id = subjects.find((s) => readyVersionsOf(materials, s.id).length > 0)?.id ?? subjects[0]?.id;
    return new Set(id ? readyVersionsOf(materials, id).map((r) => r.version.id) : []);
  });
  const [title, setTitle] = useState("");
  const [count, setCount] = useState("10");
  const [duration, setDuration] = useState("30");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [extra, setExtra] = useState("");
  const [errors, setErrors] = useState<{ subject?: string; sources?: string; title?: string; count?: string; duration?: string; extra?: string }>({});
  const [busy, setBusy] = useState(false);

  const subject = subjects.find((s) => s.id === subjectId);
  const ready = subjectId ? readyVersionsOf(materials, subjectId) : [];
  const hasMaterials = ready.length > 0;
  const pending = subjectId ? materials.filter((m) => m.subject_id === subjectId && !ready.some((r) => r.material.id === m.id)).length : 0;
  const items = subjects.map((s) => ({
    value: s.id,
    label: `${subjectCode(s)} · ${s.name}`,
    ...(readyVersionsOf(materials, s.id).length ? {} : { sub: "Chưa có tài liệu, AI tự soạn" }),
  }));
  const countNumber = Number(count);
  const countValid = count.trim() !== "" && Number.isInteger(countNumber) && countNumber >= 1 && countNumber <= 50;

  const changeSubject = (id: string) => {
    setSubjectId(id);
    setSelected(new Set(readyVersionsOf(materials, id).map((r) => r.version.id)));
    setErrors((e) => ({ ...e, subject: "", sources: "" }));
  };
  const toggle = (id: string, on: boolean) => {
    setSelected((current) => {
      const next = new Set(current);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
    setErrors((e) => ({ ...e, sources: "" }));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    const titleValue = title.trim();
    const durationNumber = Number(duration);
    const durationOk = duration.trim() !== "" && Number.isInteger(durationNumber) && durationNumber >= 1 && durationNumber <= 300;
    const extraValue = extra.trim();
    const next = {
      ...(subjectId ? {} : { subject: "Chọn môn học" }),
      ...(hasMaterials && selected.size === 0 ? { sources: "Chọn ít nhất một tài liệu làm nguồn" } : {}),
      ...(titleValue ? {} : { title: "Nhập tên đề" }),
      ...(countValid ? {} : { count: "Nhập số từ 1 đến 50" }),
      ...(durationOk ? {} : { duration: "Nhập số phút từ 1 đến 300" }),
      ...(extraValue.length > 1000 ? { extra: "Tối đa 1000 ký tự" } : {}),
    };
    setErrors(next);
    if (Object.keys(next).length || !subjectId) return;
    setBusy(true);
    try {
      const created = await generateExam({
        subjectId,
        title: titleValue,
        durationMinutes: durationNumber,
        questionCount: countNumber,
        difficulty,
        ...(extraValue ? { extraInstructions: extraValue } : {}),
        ...(hasMaterials ? { materialVersionIds: [...selected] } : {}),
      });
      trackGenerating(created.examId);
      onClose();
      onCreated?.();
      toast({ tone: "success", title: "AI đang soạn đề", detail: "Xong sẽ báo bạn" });
      router.push("/admin/de-thi");
      await reload();
    } catch (reason) {
      toast({ tone: "error", title: "Không tạo được đề", detail: reason instanceof Error ? reason.message : "Vui lòng thử lại." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Tạo đề bằng AI"
      description="AI soạn câu hỏi, 4 đáp án và lời giải. Đề lưu ở trạng thái chờ duyệt để bạn kiểm từng câu trước khi xuất bản."
      initialFocus="[role=combobox]"
      footer={
        <DialogFooter sticky>
          <Button variant="secondary" onClick={onClose} className="min-h-11 md:min-h-10">Huỷ</Button>
          <Button variant="primary" type="submit" form="ai-exam-form" busy={busy} className="min-h-11 md:min-h-10">
            {countValid ? `Tạo đề ${countNumber} câu` : "Tạo đề"}
          </Button>
        </DialogFooter>
      }
    >
      <form id="ai-exam-form" onSubmit={(event) => void submit(event)} noValidate className="flex flex-col gap-5">
        <Field label="Môn học" htmlFor="x-subject" error={errors.subject}>
          {(aria) => (
            <Combobox
              id="x-subject"
              value={subjectId}
              onChange={changeSubject}
              items={items}
              placeholder="Chọn môn học"
              searchPlaceholder="Tìm môn học"
              invalid={aria["aria-invalid"]}
              describedBy={aria["aria-describedby"]}
            />
          )}
        </Field>
        {subject && (
          <div>
            <p className="text-sm font-medium">Nguồn câu hỏi</p>
            <div className="mt-2">
              {hasMaterials ? (
                <>
                  <p className="text-sm text-pretty text-ink-3">
                    AI soạn câu hỏi từ các đoạn đã lập chỉ mục của {subjectCode(subject)}. Bỏ chọn tài liệu bạn không muốn dùng.
                  </p>
                  <div className="mt-3 flex flex-col gap-2">
                    {ready.map(({ version, material }) => (
                      <div
                        key={version.id}
                        className="rounded-xl border border-line-strong bg-paper p-3.5 transition-colors hover:bg-paper-2 has-checked:border-orange has-checked:ring-2 has-checked:ring-orange/15"
                      >
                        <Checkbox
                          checked={selected.has(version.id)}
                          onChange={(on) => toggle(version.id, on)}
                          label={
                            <>
                              <span className="block text-sm font-medium text-pretty">{material.title}</span>
                              <span className="mt-0.5 block text-xs tabular-nums text-ink-3">v{version.version_number} · {version.slide_count} {materialUnit(version.original_filename)}</span>
                            </>
                          }
                          className="items-start"
                        />
                      </div>
                    ))}
                  </div>
                  {pending > 0 && <p className="mt-2 text-xs text-ink-3">{pending} tài liệu khác đang xử lý hoặc lỗi, chưa dùng được.</p>}
                </>
              ) : (
                <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-pretty text-amber-900">
                  <Sparkles aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-amber-700" />
                  <div>
                    <p className="font-medium">AI sẽ tự soạn theo kiến thức chung</p>
                    <p className="mt-0.5">
                      {subjectCode(subject)} chưa có tài liệu nào đã lập chỉ mục{pending ? ` (${pending} tài liệu đang xử lý hoặc lỗi)` : ""}, nên câu hỏi sẽ không có trích dẫn nguồn. Bạn kiểm kỹ từng câu trước khi xuất bản.
                    </p>
                  </div>
                </div>
              )}
            </div>
            {errors.sources && <p className="mt-1.5 text-sm text-red-600">{errors.sources}</p>}
          </div>
        )}
        <Field label="Tên đề" htmlFor="x-title" error={errors.title}>
          {(aria) => (
            <input {...aria} id="x-title" value={title} onChange={(event) => setTitle(event.target.value)} className={INPUT} placeholder="Luyện tập CSD201 · Chương 1–2" autoComplete="off" />
          )}
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Số câu" htmlFor="x-count" hint="Từ 1 đến 50 câu" error={errors.count}>
            {(aria) => (
              <input {...aria} id="x-count" type="number" inputMode="numeric" min={1} max={50} value={count} onChange={(event) => setCount(event.target.value)} className={cx(INPUT, "tabular-nums")} />
            )}
          </Field>
          <Field label="Thời gian làm bài" htmlFor="x-duration" error={errors.duration}>
            {(aria) => (
              <div className="flex items-center gap-3">
                <input {...aria} id="x-duration" type="number" inputMode="numeric" min={1} max={300} value={duration} onChange={(event) => setDuration(event.target.value)} className={cx(INPUT, "tabular-nums")} />
                <span className="text-sm text-ink-3">phút</span>
              </div>
            )}
          </Field>
        </div>
        <fieldset>
          <legend className="text-sm font-medium">Độ khó</legend>
          <div className="mt-2 flex flex-col gap-1 sm:flex-row sm:gap-6">
            {DIFFICULTIES.map((value) => (
              <Radio key={value} name="x-difficulty" value={value} checked={difficulty === value} onChange={() => setDifficulty(value)} label={DIFFICULTY_LABEL[value]} className="min-h-11 w-fit sm:min-h-0" />
            ))}
          </div>
        </fieldset>
        <Field label="Yêu cầu thêm" htmlFor="x-extra" optional error={errors.extra}>
          {(aria) => (
            <textarea
              {...aria}
              id="x-extra"
              rows={3}
              maxLength={1000}
              value={extra}
              onChange={(event) => setExtra(event.target.value)}
              className={TEXTAREA}
              placeholder="Ví dụ: tập trung chương 2, ưu tiên câu đọc code, tránh câu hỏi định nghĩa"
            />
          )}
        </Field>
      </form>
    </Sheet>
  );
}

/** Remounts the form state every time the sheet is opened. */
export function AiExamSheet({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated?: () => void }) {
  const [session, setSession] = useState(0);
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setSession((s) => s + 1);
  }
  return <AiExamSheetInner key={session} open={open} onClose={onClose} {...(onCreated ? { onCreated } : {})} />;
}
