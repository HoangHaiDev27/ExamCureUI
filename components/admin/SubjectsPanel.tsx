"use client";

import Link from "next/link";
import { useState } from "react";
import { FileQuestion, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/Button";
import { adminApi, DIFFICULTIES, KIND_LABEL, KINDS, type AdminSchool, type AdminSubject } from "@/lib/admin";
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
  Table,
  Td,
  Toolbar,
  useDebounced,
  useLoader,
  useToast,
} from "./ui";

type Form = {
  schoolId: string;
  name: string;
  code: string;
  faculty: string;
  semester: string;
  durationMin: number;
  questionCount: number;
  difficulty: string;
  scale: string;
  kind: string;
};

const emptyForm = (schoolId = ""): Form => ({
  schoolId,
  name: "",
  code: "",
  faculty: "",
  semester: "",
  durationMin: 60,
  questionCount: 40,
  difficulty: "Cơ bản",
  scale: "10",
  kind: "theory",
});

export function SubjectsPanel() {
  const toast = useToast();
  const schools = useLoader(adminApi.schools, "schools");
  const [schoolId, setSchoolId] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const q = useDebounced(search);
  const { data, error, loading, reload } = useLoader(
    () => adminApi.subjects({ page, search: q, schoolId }),
    `${page}|${q}|${schoolId}`,
  );
  const [editing, setEditing] = useState<{ id?: string; form: Form } | null>(null);
  const [deleting, setDeleting] = useState<AdminSubject | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!editing) return;
    setBusy(true);
    try {
      const f = editing.form;
      const body = { ...f, faculty: f.faculty || undefined, semester: f.semester || undefined };
      if (editing.id) await adminApi.updateSubject(editing.id, body);
      else await adminApi.createSubject(body);
      toast("ok", editing.id ? "Đã lưu học phần." : "Đã thêm học phần.");
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
      await adminApi.deleteSubject(deleting.id);
      toast("ok", `Đã xoá ${deleting.name}.`);
      setDeleting(null);
      reload();
    } catch (e) {
      toast("error", (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const noSchools = schools.data && schools.data.length === 0;

  return (
    <>
      <PageHeader
        title="Học phần"
        description="Học phần mở thi thử theo từng trường: thời lượng, số câu mỗi đề, độ khó."
        actions={
          <Button size="sm" disabled={!schools.data?.length} onClick={() => setEditing({ form: emptyForm(schoolId || schools.data?.[0]?.id) })}>
            <Plus size={16} /> Thêm học phần
          </Button>
        }
      />
      {(error || schools.error) && <ErrorBanner message={(error || schools.error)!} onRetry={reload} />}

      <Card className="mt-4">
        <Toolbar>
          <SearchBox
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Tìm tên, mã, khoa…"
          />
          <SchoolSelect
            schools={schools.data}
            value={schoolId}
            onChange={(v) => {
              setSchoolId(v);
              setPage(1);
            }}
            allLabel="Tất cả trường"
            className="!h-9 !w-auto max-w-[260px]"
          />
        </Toolbar>

        {loading && !data ? (
          <Spinner />
        ) : noSchools ? (
          <Empty title="Chưa có trường nào" hint="Hãy tạo trường trước, sau đó thêm học phần cho trường." />
        ) : data && data.items.length === 0 ? (
          <Empty title="Không có học phần phù hợp" />
        ) : (
          data && (
            <>
              <Table head={["Học phần", "Trường", "Đề thi", "Loại · Độ khó", "Ngân hàng", ""]}>
                {data.items.map((s) => (
                  <tr key={s.id} className={loading ? "opacity-60" : ""}>
                    <Td>
                      <p className="font-medium text-ink">{s.name}</p>
                      <p className="text-[12.5px] text-ink-3">
                        {s.code}
                        {s.faculty && ` · ${s.faculty}`}
                        {s.semester && ` · HK ${s.semester}`}
                      </p>
                    </Td>
                    <Td>
                      {s.school ? (
                        <span className="inline-flex items-center gap-2 text-ink-2">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.school.brandColor || "#6b7480" }} />
                          {s.school.abbr.toUpperCase()}
                        </span>
                      ) : (
                        <Badge tone="danger">Mất liên kết</Badge>
                      )}
                    </Td>
                    <Td className="text-[13px] text-ink-2">
                      {s.questionCount} câu · {s.durationMin} phút
                    </Td>
                    <Td>
                      <div className="flex flex-wrap gap-1">
                        <Badge>{KIND_LABEL[s.kind] ?? s.kind}</Badge>
                        <Badge tone={s.difficulty === "Nâng cao" ? "warning" : s.difficulty === "Trung bình" ? "blue" : "neutral"}>{s.difficulty}</Badge>
                      </div>
                    </Td>
                    <Td>
                      <Link
                        href={`/admin/cau-hoi?subjectId=${s.id}`}
                        className={`inline-flex items-center gap-1.5 text-[13px] font-medium hover:underline ${
                          s.bankSize < s.questionCount ? "text-[#9a6200]" : "text-orange"
                        }`}
                        title={s.bankSize < s.questionCount ? "Ngân hàng ít câu hơn số câu mỗi đề" : undefined}
                      >
                        <FileQuestion size={14} /> {s.bankSize} câu
                      </Link>
                    </Td>
                    <Td className="whitespace-nowrap text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label={`Sửa ${s.name}`}
                        onClick={() =>
                          setEditing({
                            id: s.id,
                            form: {
                              schoolId: s.schoolId ?? "",
                              name: s.name,
                              code: s.code,
                              faculty: s.faculty ?? "",
                              semester: s.semester ?? "",
                              durationMin: s.durationMin,
                              questionCount: s.questionCount,
                              difficulty: s.difficulty,
                              scale: s.scale,
                              kind: s.kind,
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
                        aria-label={`Xoá ${s.name}`}
                        onClick={() => setDeleting(s)}
                      >
                        <Trash2 size={15} />
                      </Button>
                    </Td>
                  </tr>
                ))}
              </Table>
              <Pagination page={data.page} limit={data.limit} total={data.total} onPage={setPage} />
            </>
          )
        )}
      </Card>

      {editing && (
        <Modal
          open
          title={editing.id ? "Sửa học phần" : "Thêm học phần"}
          onClose={() => setEditing(null)}
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setEditing(null)} disabled={busy}>
                Huỷ
              </Button>
              <Button
                size="sm"
                onClick={save}
                disabled={busy || !editing.form.schoolId || !editing.form.name.trim() || !editing.form.code.trim()}
              >
                {busy ? "Đang lưu…" : "Lưu"}
              </Button>
            </>
          }
        >
          <SubjectFields form={editing.form} schools={schools.data} onChange={(form) => setEditing({ ...editing, form })} />
        </Modal>
      )}

      <ConfirmDialog
        open={!!deleting}
        title="Xoá học phần"
        danger
        busy={busy}
        confirmLabel="Xoá học phần"
        message={
          deleting && (
            <>
              Xoá <b className="text-ink">{deleting.name}</b> ({deleting.code})? Chỉ xoá được khi ngân hàng câu hỏi của học phần trống
              {deleting.bankSize > 0 && ` (hiện còn ${deleting.bankSize} câu)`}.
            </>
          )
        }
        onConfirm={remove}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}

function SubjectFields({ form, schools, onChange }: { form: Form; schools?: AdminSchool[]; onChange: (f: Form) => void }) {
  const set = <K extends keyof Form>(k: K, v: Form[K]) => onChange({ ...form, [k]: v });
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Field label="Trường" required>
          <SchoolSelect schools={schools} value={form.schoolId} onChange={(v) => set("schoolId", v)} />
        </Field>
      </div>
      <div className="sm:col-span-2">
        <Field label="Tên học phần" required>
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Lập trình hướng đối tượng với Java" />
        </Field>
      </div>
      <Field label="Mã học phần" required>
        <Input value={form.code} onChange={(e) => set("code", e.target.value.toUpperCase())} placeholder="PRO192" />
      </Field>
      <Field label="Khoa / Viện">
        <Input value={form.faculty} onChange={(e) => set("faculty", e.target.value)} placeholder="Công nghệ thông tin" />
      </Field>
      <Field label="Thời lượng (phút)" required>
        <Input type="number" min={5} max={300} value={form.durationMin} onChange={(e) => set("durationMin", Number(e.target.value) || 0)} />
      </Field>
      <Field label="Số câu mỗi đề">
        <Input type="number" min={1} max={200} value={form.questionCount} onChange={(e) => set("questionCount", Number(e.target.value) || 0)} />
      </Field>
      <Field label="Loại nội dung">
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
      <Field label="Thang điểm">
        <Select value={form.scale} onChange={(e) => set("scale", e.target.value)}>
          <option value="10">Hệ 10</option>
          <option value="letter">Điểm chữ (A, B+, B…)</option>
        </Select>
      </Field>
      <Field label="Học kỳ">
        <Input value={form.semester} onChange={(e) => set("semester", e.target.value)} placeholder="2025.1" />
      </Field>
    </div>
  );
}

export function SchoolSelect({
  schools,
  value,
  onChange,
  allLabel,
  className,
}: {
  schools?: AdminSchool[];
  value: string;
  onChange: (v: string) => void;
  allLabel?: string;
  className?: string;
}) {
  return (
    <Select value={value} onChange={(e) => onChange(e.target.value)} className={className} aria-label="Chọn trường">
      {allLabel ? <option value="">{allLabel}</option> : !value && <option value="">— Chọn trường —</option>}
      {schools?.map((s) => (
        <option key={s.id} value={s.id}>
          {s.abbr.toUpperCase()} — {s.name}
        </option>
      ))}
    </Select>
  );
}
