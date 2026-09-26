"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/Button";
import { adminApi, LAYOUTS, MARKS, REGIONS, type AdminSchool } from "@/lib/admin";
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
  SearchBox,
  Select,
  Spinner,
  Table,
  Td,
  Toolbar,
  useLoader,
  useToast,
} from "./ui";

const LAYOUT_LABEL: Record<string, string> = {
  classic: "Classic — thanh đặc màu trường",
  moodle: "Moodle — nền sáng + viền màu",
  banded: "Banded — dải màu + hàng thông tin",
};

type Form = Omit<AdminSchool, "id" | "subjectCount">;
const EMPTY: Form = {
  name: "",
  abbr: "",
  city: "",
  region: "Miền Bắc",
  field: "Công nghệ",
  popular: false,
  learnersK: 0,
  brandColor: "#078DF8",
  brandDarkColor: "#0670CC",
  onBrandColor: "#FFFFFF",
  tintColor: "#E6F2FE",
  layout: "classic",
  systemName: "",
  mark: "square",
};

export function SchoolsPanel() {
  const toast = useToast();
  const { data, error, loading, reload } = useLoader(adminApi.schools, "schools");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<{ id?: string; form: Form } | null>(null);
  const [deleting, setDeleting] = useState<AdminSchool | null>(null);
  const [busy, setBusy] = useState(false);

  const rows = useMemo(() => {
    const s = search.trim().toLowerCase();
    return (data ?? []).filter((x) => !s || `${x.name} ${x.abbr} ${x.city}`.toLowerCase().includes(s));
  }, [data, search]);

  async function save() {
    if (!editing) return;
    setBusy(true);
    try {
      const body = { ...editing.form, systemName: editing.form.systemName || undefined };
      if (editing.id) await adminApi.updateSchool(editing.id, body);
      else await adminApi.createSchool(body);
      toast("ok", editing.id ? "Đã lưu thay đổi." : "Đã thêm trường.");
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
      await adminApi.deleteSchool(deleting.id);
      toast("ok", `Đã xoá ${deleting.name}.`);
      setDeleting(null);
      reload();
    } catch (e) {
      toast("error", (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Trường"
        description="Danh sách trường và nhận diện phần mềm thi (màu, kiểu header) dùng trong phòng thi."
        actions={
          <Button size="sm" onClick={() => setEditing({ form: EMPTY })}>
            <Plus size={16} /> Thêm trường
          </Button>
        }
      />
      {error && <ErrorBanner message={error} onRetry={reload} />}

      <Card className="mt-4">
        <Toolbar>
          <SearchBox value={search} onChange={setSearch} placeholder="Tìm tên, mã, thành phố…" />
        </Toolbar>
        {loading && !data ? (
          <Spinner />
        ) : rows.length === 0 ? (
          <Empty title={data?.length ? "Không có trường phù hợp" : "Chưa có trường nào"} hint={data?.length ? undefined : "Bấm “Thêm trường” để tạo trường đầu tiên."} />
        ) : (
          <Table head={["Trường", "Khu vực", "Khối ngành", "Phòng thi", "Học phần", ""]}>
            {rows.map((s) => (
              <tr key={s.id}>
                <Td>
                  <div className="flex items-center gap-3">
                    <span
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-[6px] text-[11px] font-bold uppercase"
                      style={{ background: s.brandColor || "#1a1d21", color: s.onBrandColor || "#fff" }}
                    >
                      {s.abbr.slice(0, 4)}
                    </span>
                    <div>
                      <p className="flex items-center gap-1.5 font-medium text-ink">
                        {s.name}
                        {s.popular && <Star size={13} className="fill-warning text-warning" aria-label="Phổ biến" />}
                      </p>
                      <p className="text-[12.5px] text-ink-3">
                        {s.abbr} · {s.city}
                      </p>
                    </div>
                  </div>
                </Td>
                <Td className="text-ink-2">{s.region}</Td>
                <Td className="text-ink-2">{s.field}</Td>
                <Td>
                  <Badge>{s.layout}</Badge>
                  {s.systemName && <p className="mt-1 text-[12.5px] text-ink-3">{s.systemName}</p>}
                </Td>
                <Td className="tabular-nums text-ink-2">{s.subjectCount}</Td>
                <Td className="whitespace-nowrap text-right">
                  <Button size="sm" variant="ghost" aria-label={`Sửa ${s.name}`} onClick={() => setEditing({ id: s.id, form: pick(s) })}>
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
        )}
      </Card>

      {editing && (
        <SchoolForm
          title={editing.id ? "Sửa trường" : "Thêm trường"}
          form={editing.form}
          onChange={(form) => setEditing({ ...editing, form })}
          busy={busy}
          onSave={save}
          onClose={() => setEditing(null)}
        />
      )}

      <ConfirmDialog
        open={!!deleting}
        title="Xoá trường"
        danger
        busy={busy}
        confirmLabel="Xoá trường"
        message={
          deleting && (
            <>
              Xoá <b className="text-ink">{deleting.name}</b>? Chỉ xoá được khi trường không còn học phần nào
              {deleting.subjectCount > 0 && ` (hiện còn ${deleting.subjectCount})`}.
            </>
          )
        }
        onConfirm={remove}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}

/** Lấy đúng các trường của form từ bản ghi (bỏ id, subjectCount, timestamps…). */
function pick(s: AdminSchool): Form {
  const form: Record<string, unknown> = { ...EMPTY };
  for (const k of Object.keys(EMPTY) as (keyof Form)[]) if (s[k] != null) form[k] = s[k];
  return form as Form;
}

function SchoolForm({
  title,
  form,
  onChange,
  busy,
  onSave,
  onClose,
}: {
  title: string;
  form: Form;
  onChange: (f: Form) => void;
  busy: boolean;
  onSave: () => void;
  onClose: () => void;
}) {
  const set = <K extends keyof Form>(k: K, v: Form[K]) => onChange({ ...form, [k]: v });
  const valid = form.name.trim() && /^[a-z0-9-]{2,20}$/.test(form.abbr) && form.city.trim() && form.field.trim();

  return (
    <Modal
      open
      wide
      title={title}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={busy}>
            Huỷ
          </Button>
          <Button size="sm" onClick={onSave} disabled={busy || !valid}>
            {busy ? "Đang lưu…" : "Lưu"}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tên trường" required>
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Đại học FPT" />
        </Field>
        <Field label="Mã trường" required hint="Chữ thường, số, “-”. Dùng trong URL, vd. fptu">
          <Input value={form.abbr} onChange={(e) => set("abbr", e.target.value.toLowerCase())} placeholder="fptu" />
        </Field>
        <Field label="Thành phố" required>
          <Input value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="Hà Nội" />
        </Field>
        <Field label="Khu vực" required>
          <Select value={form.region} onChange={(e) => set("region", e.target.value)}>
            {REGIONS.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </Select>
        </Field>
        <Field label="Khối ngành" required>
          <Input value={form.field} onChange={(e) => set("field", e.target.value)} placeholder="Công nghệ" />
        </Field>
        <Field label="Số người học (nghìn)">
          <Input type="number" min={0} value={form.learnersK} onChange={(e) => set("learnersK", Number(e.target.value) || 0)} />
        </Field>
        <label className="flex items-center gap-2.5 text-[14px] text-ink sm:col-span-2">
          <input type="checkbox" checked={form.popular} onChange={(e) => set("popular", e.target.checked)} className="h-4 w-4 accent-[var(--color-orange)]" />
          Ghim vào nhóm trường phổ biến
        </label>
      </div>

      <h3 className="mt-6 mb-3 text-[13px] font-bold uppercase tracking-[0.05em] text-ink-3">Phòng thi mô phỏng</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tên phần mềm thi">
          <Input value={form.systemName ?? ""} onChange={(e) => set("systemName", e.target.value)} placeholder="EOS, HUST CBT…" />
        </Field>
        <Field label="Kiểu header">
          <Select value={form.layout} onChange={(e) => set("layout", e.target.value)}>
            {LAYOUTS.map((l) => (
              <option key={l} value={l}>
                {LAYOUT_LABEL[l]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Hình dạng logo">
          <Select value={form.mark} onChange={(e) => set("mark", e.target.value)}>
            {MARKS.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              ["brandColor", "Màu chính"],
              ["brandDarkColor", "Màu đậm"],
              ["onBrandColor", "Chữ trên màu"],
              ["tintColor", "Màu nền nhạt"],
            ] as const
          ).map(([k, label]) => (
            <Field key={k} label={label}>
              <div className="flex h-10 items-center gap-2 rounded-[7px] border border-line px-2">
                <input
                  type="color"
                  value={form[k] || "#000000"}
                  onChange={(e) => set(k, e.target.value.toUpperCase())}
                  className="h-6 w-7 cursor-pointer rounded border-0 bg-transparent p-0"
                  aria-label={label}
                />
                <span className="font-mono text-[12.5px] text-ink-2">{form[k]}</span>
              </div>
            </Field>
          ))}
        </div>
      </div>

      <HeaderPreview form={form} />
    </Modal>
  );
}

/** Xem trước header phòng thi theo 3 biến thể layout. */
function HeaderPreview({ form }: { form: Form }) {
  const brand = form.brandColor || "#078DF8";
  const on = form.onBrandColor || "#FFFFFF";
  const label = `${form.abbr.toUpperCase() || "MÃ"} · ${form.systemName || "Phần mềm thi"}`;
  return (
    <div className="mt-5">
      <p className="mb-2 text-[12.5px] font-semibold text-ink-3">Xem trước header phòng thi</p>
      <div className="overflow-hidden rounded-[8px] border border-line text-[13px]">
        {form.layout === "moodle" ? (
          <div className="border-t-4 bg-paper px-4 py-3" style={{ borderTopColor: brand }}>
            <p className="font-semibold text-ink">{label}</p>
            <p className="text-[12px] text-ink-3">Trang chủ › Học phần › Bài thi</p>
          </div>
        ) : form.layout === "banded" ? (
          <>
            <div className="px-4 py-2.5 font-semibold" style={{ background: form.brandDarkColor || brand, color: on }}>
              {label}
            </div>
            <div className="bg-paper px-4 py-2 text-[12px] text-ink-2">Thí sinh · MSSV · Mã đề</div>
          </>
        ) : (
          <div className="px-4 py-3 font-semibold" style={{ background: brand, color: on }}>
            {label}
          </div>
        )}
        <div className="px-4 py-3 text-[12px] text-ink-3" style={{ background: form.tintColor || "#F7F8FA" }}>
          Nội dung câu hỏi…
        </div>
      </div>
    </div>
  );
}
