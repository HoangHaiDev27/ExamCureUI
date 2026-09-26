"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/Button";
import {
  adminApi,
  DIFFICULTIES,
  KIND_LABEL,
  KINDS,
  type AdminQuestion,
  type AdminSubject,
  type QuestionInput,
} from "@/lib/admin";
import {
  Badge,
  Card,
  ConfirmDialog,
  Empty,
  ErrorBanner,
  Field,
  Input,
  Modal,
  PageHeader,
  Pagination,
  SearchBox,
  Select,
  Spinner,
  Textarea,
  Toolbar,
  useDebounced,
  useLoader,
  useToast,
} from "./ui";

const LETTERS = "ABCDEF";
const MAX_OPTIONS = 6;

const emptyQuestion = (subjectId: string): QuestionInput => ({
  subjectId,
  prompt: "",
  code: "",
  formula: "",
  options: ["", "", "", ""],
  answerIndex: 0,
  explain: "",
  kind: "theory",
  difficulty: "Cơ bản",
});

export function QuestionsPanel() {
  const toast = useToast();
  const params = useSearchParams();
  // Danh sách học phần cho bộ lọc & form (tối đa 100 — đủ cho giai đoạn hiện tại).
  const subjects = useLoader(() => adminApi.subjects({ limit: 100 }), "all-subjects");
  const [subjectId, setSubjectId] = useState(params.get("subjectId") ?? "");
  const [kind, setKind] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const q = useDebounced(search);
  const { data, error, loading, reload } = useLoader(
    () => adminApi.questions({ page, search: q, subjectId, kind, difficulty }),
    `${page}|${q}|${subjectId}|${kind}|${difficulty}`,
  );
  const [editing, setEditing] = useState<{ id?: string; form: QuestionInput } | null>(null);
  const [deleting, setDeleting] = useState<AdminQuestion | null>(null);
  const [busy, setBusy] = useState(false);

  const filter = (fn: (v: string) => void) => (v: string) => {
    fn(v);
    setPage(1);
  };

  async function save() {
    if (!editing) return;
    setBusy(true);
    try {
      const f = editing.form;
      const body: QuestionInput = {
        ...f,
        prompt: f.prompt.trim(),
        options: f.options.map((o) => o.trim()),
        code: f.code?.trim() || undefined,
        formula: f.formula?.trim() || undefined,
        explain: f.explain?.trim() || undefined,
      };
      if (editing.id) await adminApi.updateQuestion(editing.id, body);
      else await adminApi.createQuestion(body);
      toast("ok", editing.id ? "Đã lưu câu hỏi." : "Đã thêm câu hỏi.");
      setEditing(null);
      reload();
    } catch (e) {
      toast("error", (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!deleting) return;
    setBusy(true);
    try {
      await adminApi.deleteQuestion(deleting.id);
      toast("ok", "Đã xoá câu hỏi.");
      setDeleting(null);
      reload();
    } catch (e) {
      toast("error", (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const subjectList = subjects.data?.items ?? [];

  return (
    <>
      <PageHeader
        title="Ngân hàng câu hỏi"
        description="Câu hỏi trắc nghiệm dùng để sinh đề ngẫu nhiên cho phòng thi."
        actions={
          <Button size="sm" disabled={!subjectList.length} onClick={() => setEditing({ form: emptyQuestion(subjectId || subjectList[0]?.id || "") })}>
            <Plus size={16} /> Thêm câu hỏi
          </Button>
        }
      />
      {(error || subjects.error) && <ErrorBanner message={(error || subjects.error)!} onRetry={reload} />}

      <Card className="mt-4">
        <Toolbar>
          <SearchBox value={search} onChange={filter(setSearch)} placeholder="Tìm trong đề bài, phương án…" />
          <SubjectSelect subjects={subjectList} value={subjectId} onChange={filter(setSubjectId)} allLabel="Tất cả học phần" className="!h-9 !w-auto max-w-[280px]" />
          <Select value={kind} onChange={(e) => filter(setKind)(e.target.value)} className="!h-9 !w-auto" aria-label="Lọc theo loại">
            <option value="">Mọi loại</option>
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {KIND_LABEL[k]}
              </option>
            ))}
          </Select>
          <Select value={difficulty} onChange={(e) => filter(setDifficulty)(e.target.value)} className="!h-9 !w-auto" aria-label="Lọc theo độ khó">
            <option value="">Mọi độ khó</option>
            {DIFFICULTIES.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </Select>
        </Toolbar>

        {loading && !data ? (
          <Spinner />
        ) : data && data.items.length === 0 ? (
          <Empty
            title="Chưa có câu hỏi phù hợp"
            hint={subjectList.length ? "Thêm câu hỏi mới hoặc đổi bộ lọc." : "Hãy tạo học phần trước khi thêm câu hỏi."}
          />
        ) : (
          data && (
            <>
              <ul className={loading ? "opacity-60" : ""}>
                {data.items.map((qn, idx) => (
                  <li key={qn.id} className="border-b border-line px-5 py-4 last:border-0">
                    <div className="flex items-start gap-4">
                      <span className="mt-0.5 w-7 shrink-0 text-[13px] font-semibold tabular-nums text-ink-3">
                        {(data.page - 1) * data.limit + idx + 1}.
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="whitespace-pre-line text-[14.5px] font-medium text-ink">{qn.prompt}</p>
                        {qn.code && (
                          <pre className="mt-2 overflow-x-auto rounded-[6px] bg-paper-2 px-3 py-2 font-mono text-[12.5px] text-ink">{qn.code}</pre>
                        )}
                        {qn.formula && <p className="mt-2 font-mono text-[13px] text-ink-2">{qn.formula}</p>}
                        <ul className="mt-2.5 grid gap-1.5 sm:grid-cols-2">
                          {qn.options.map((o, i) => (
                            <li
                              key={i}
                              className={`flex items-start gap-2 rounded-[6px] px-2.5 py-1.5 text-[13.5px] ${
                                i === qn.answerIndex ? "bg-green-soft font-medium text-ink" : "text-ink-2"
                              }`}
                            >
                              <span className={`font-semibold ${i === qn.answerIndex ? "text-green" : "text-ink-3"}`}>{LETTERS[i]}.</span>
                              <span className="min-w-0 flex-1">{o}</span>
                              {i === qn.answerIndex && <Check size={15} className="mt-0.5 shrink-0 text-green" aria-label="Đáp án đúng" />}
                            </li>
                          ))}
                        </ul>
                        {qn.explain && <p className="mt-2 text-[13px] text-ink-2">Giải thích: {qn.explain}</p>}
                        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                          {qn.subject && (
                            <Badge tone="blue">
                              {qn.subject.code} · {qn.subject.name}
                            </Badge>
                          )}
                          <Badge>{KIND_LABEL[qn.kind] ?? qn.kind}</Badge>
                          <Badge tone={qn.difficulty === "Nâng cao" ? "warning" : "neutral"}>{qn.difficulty}</Badge>
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          aria-label="Sửa câu hỏi"
                          onClick={() =>
                            setEditing({
                              id: qn.id,
                              form: {
                                subjectId: qn.subjectId ?? "",
                                prompt: qn.prompt,
                                code: qn.code ?? "",
                                formula: qn.formula ?? "",
                                options: [...qn.options],
                                answerIndex: qn.answerIndex,
                                explain: qn.explain ?? "",
                                kind: qn.kind,
                                difficulty: qn.difficulty,
                              },
                            })
                          }
                        >
                          <Pencil size={15} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-danger hover:!bg-danger-soft hover:!text-danger"
                          aria-label="Xoá câu hỏi"
                          onClick={() => setDeleting(qn)}
                        >
                          <Trash2 size={15} />
                        </Button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <Pagination page={data.page} limit={data.limit} total={data.total} onPage={setPage} />
            </>
          )
        )}
      </Card>

      {editing && (
        <QuestionEditor
          title={editing.id ? "Sửa câu hỏi" : "Thêm câu hỏi"}
          form={editing.form}
          subjects={subjectList}
          busy={busy}
          onChange={(form) => setEditing({ ...editing, form })}
          onSave={save}
          onClose={() => setEditing(null)}
        />
      )}

      <ConfirmDialog
        open={!!deleting}
        title="Xoá câu hỏi"
        danger
        busy={busy}
        confirmLabel="Xoá câu hỏi"
        message={
          deleting && (
            <>
              Xoá câu hỏi <b className="text-ink">“{deleting.prompt.slice(0, 120)}{deleting.prompt.length > 120 ? "…" : ""}”</b>? Bài thi đã nộp vẫn
              giữ bản chụp câu hỏi nên không bị ảnh hưởng.
            </>
          )
        }
        onConfirm={remove}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}

function QuestionEditor({
  title,
  form,
  subjects,
  busy,
  onChange,
  onSave,
  onClose,
}: {
  title: string;
  form: QuestionInput;
  subjects: AdminSubject[];
  busy: boolean;
  onChange: (f: QuestionInput) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  const set = <K extends keyof QuestionInput>(k: K, v: QuestionInput[K]) => onChange({ ...form, [k]: v });
  const setOption = (i: number, v: string) => set("options", form.options.map((o, j) => (j === i ? v : o)));
  const removeOption = (i: number) =>
    onChange({
      ...form,
      options: form.options.filter((_, j) => j !== i),
      answerIndex: form.answerIndex === i ? 0 : form.answerIndex > i ? form.answerIndex - 1 : form.answerIndex,
    });

  const problems = [
    !form.subjectId && "Chọn học phần",
    !form.prompt.trim() && "Nhập đề bài",
    form.options.some((o) => !o.trim()) && "Điền đủ các phương án",
    new Set(form.options.map((o) => o.trim())).size !== form.options.length && "Các phương án không được trùng nhau",
  ].filter(Boolean) as string[];

  return (
    <Modal
      open
      wide
      title={title}
      onClose={onClose}
      footer={
        <>
          {problems.length > 0 && <span className="mr-auto self-center text-[12.5px] text-ink-3">{problems[0]}</span>}
          <Button variant="outline" size="sm" onClick={onClose} disabled={busy}>
            Huỷ
          </Button>
          <Button size="sm" onClick={onSave} disabled={busy || problems.length > 0}>
            {busy ? "Đang lưu…" : "Lưu câu hỏi"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-[1fr_160px_160px]">
          <Field label="Học phần" required>
            <SubjectSelect subjects={subjects} value={form.subjectId} onChange={(v) => set("subjectId", v)} />
          </Field>
          <Field label="Loại">
            <Select value={form.kind} onChange={(e) => set("kind", e.target.value)}>
              {KINDS.map((k) => (
                <option key={k} value={k}>
                  {KIND_LABEL[k]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Độ khó">
            <Select value={form.difficulty} onChange={(e) => set("difficulty", e.target.value)}>
              {DIFFICULTIES.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Đề bài" required>
          <Textarea rows={3} value={form.prompt} onChange={(e) => set("prompt", e.target.value)} placeholder="Nội dung câu hỏi…" />
        </Field>

        {(form.kind === "code" || form.code) && (
          <Field label="Đoạn code (tuỳ chọn)">
            <Textarea rows={5} value={form.code} onChange={(e) => set("code", e.target.value)} className="font-mono text-[13px]" spellCheck={false} />
          </Field>
        )}
        {(form.kind === "math" || form.kind === "econ" || form.formula) && (
          <Field label="Công thức (tuỳ chọn)">
            <Input value={form.formula} onChange={(e) => set("formula", e.target.value)} className="font-mono" placeholder="f(x) = x^2 + 2x + 1" />
          </Field>
        )}

        <div>
          <p className="mb-1.5 text-[13px] font-semibold text-ink">
            Phương án <span className="text-danger">*</span>
            <span className="ml-2 font-normal text-ink-3">Chọn nút tròn ở phương án đúng.</span>
          </p>
          <div className="space-y-2" role="radiogroup" aria-label="Đáp án đúng">
            {form.options.map((o, i) => (
              <div
                key={i}
                className={`flex items-center gap-2.5 rounded-[8px] border px-2.5 py-1.5 ${
                  i === form.answerIndex ? "border-green bg-green-soft/60" : "border-line"
                }`}
              >
                <input
                  type="radio"
                  name="answer"
                  checked={i === form.answerIndex}
                  onChange={() => set("answerIndex", i)}
                  className="h-4 w-4 accent-[var(--color-green)]"
                  aria-label={`Phương án ${LETTERS[i]} là đáp án đúng`}
                />
                <span className="w-4 text-[13px] font-semibold text-ink-3">{LETTERS[i]}</span>
                <input
                  value={o}
                  onChange={(e) => setOption(i, e.target.value)}
                  placeholder={`Phương án ${LETTERS[i]}`}
                  className="h-8 min-w-0 flex-1 bg-transparent text-[14px] text-ink outline-none placeholder:text-ink-3"
                />
                <button
                  type="button"
                  onClick={() => removeOption(i)}
                  disabled={form.options.length <= 2}
                  className="grid h-7 w-7 place-items-center rounded-[6px] text-ink-3 hover:bg-paper-3 hover:text-danger disabled:opacity-30"
                  aria-label={`Xoá phương án ${LETTERS[i]}`}
                >
                  <X size={15} />
                </button>
              </div>
            ))}
          </div>
          {form.options.length < MAX_OPTIONS && (
            <Button type="button" size="sm" variant="ghost" className="mt-2" onClick={() => set("options", [...form.options, ""])}>
              <Plus size={15} /> Thêm phương án
            </Button>
          )}
        </div>

        <Field label="Giải thích đáp án">
          <Textarea rows={2} value={form.explain} onChange={(e) => set("explain", e.target.value)} placeholder="Hiển thị cho sinh viên ở màn xem lại bài." />
        </Field>
      </div>
    </Modal>
  );
}

function SubjectSelect({
  subjects,
  value,
  onChange,
  allLabel,
  className,
}: {
  subjects: AdminSubject[];
  value: string;
  onChange: (v: string) => void;
  allLabel?: string;
  className?: string;
}) {
  return (
    <Select value={value} onChange={(e) => onChange(e.target.value)} className={className} aria-label="Chọn học phần">
      {allLabel ? <option value="">{allLabel}</option> : !value && <option value="">— Chọn học phần —</option>}
      {subjects.map((s) => (
        <option key={s.id} value={s.id}>
          {s.code} — {s.name}
          {s.school ? ` (${s.school.abbr.toUpperCase()})` : ""}
        </option>
      ))}
    </Select>
  );
}
