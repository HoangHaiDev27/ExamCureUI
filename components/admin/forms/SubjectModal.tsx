"use client";

import { useRef, useState, type FormEvent } from "react";
import { createSubject } from "@/lib/admin";
import { SCHOOLS } from "@/lib/schools";
import { useAdminData, useToast } from "../AdminData";
import { Combobox, DialogFooter, Modal } from "../overlays";
import { Button, Field, INPUT, cx } from "../ui";
import { schoolAbbr } from "../views/common";

const SCHOOL_ITEMS = SCHOOLS.map((s) => ({ value: s.id, label: `${s.abbr} · ${s.name}` }));

function SubjectForm({ onClose }: { onClose: () => void }) {
  const { overview, reload } = useAdminData();
  const { toast } = useToast();
  const [school, setSchool] = useState("fptu");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [errors, setErrors] = useState<{ code?: string; name?: string }>({});
  const [busy, setBusy] = useState(false);
  const codeRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    const codeValue = code.trim().toUpperCase();
    const nameValue = name.trim();
    let codeError = codeValue ? "" : "Nhập mã môn, ví dụ CSD201";
    if (codeValue && overview?.subjects.some((s) => s.school_code === school && s.code.toUpperCase() === codeValue))
      codeError = `${schoolAbbr(school)} đã có môn ${codeValue}`;
    const nameError = nameValue ? "" : "Nhập tên môn";
    setErrors({ ...(codeError ? { code: codeError } : {}), ...(nameError ? { name: nameError } : {}) });
    if (codeError) return codeRef.current?.focus();
    if (nameError) return nameRef.current?.focus();
    setBusy(true);
    try {
      await createSubject({ schoolCode: school, code: codeValue, name: nameValue });
      onClose();
      toast({ tone: "success", title: `Đã thêm môn ${codeValue}` });
      await reload();
    } catch (reason) {
      toast({ tone: "error", title: "Không thêm được môn học", detail: reason instanceof Error ? reason.message : "Vui lòng thử lại." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={(event) => void submit(event)} noValidate>
      <div className="flex flex-col gap-5">
        <Field label="Trường" htmlFor="f-school">
          <Combobox id="f-school" value={school} onChange={setSchool} items={SCHOOL_ITEMS} placeholder="Chọn trường" searchPlaceholder="Tìm trường" />
        </Field>
        <div className="grid gap-5 sm:grid-cols-[9rem_minmax(0,1fr)]">
          <Field label="Mã môn" htmlFor="f-code" error={errors.code}>
            {(aria) => (
              <input
                {...aria}
                ref={codeRef}
                id="f-code"
                name="code"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                className={cx(INPUT, "font-mono uppercase")}
                placeholder="CSD201"
                autoComplete="off"
                maxLength={16}
              />
            )}
          </Field>
          <Field label="Tên môn" htmlFor="f-name" error={errors.name}>
            {(aria) => (
              <input
                {...aria}
                ref={nameRef}
                id="f-name"
                name="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className={INPUT}
                placeholder="Cấu trúc dữ liệu và giải thuật"
                autoComplete="off"
              />
            )}
          </Field>
        </div>
      </div>
      <DialogFooter>
        <Button variant="secondary" onClick={onClose} className="min-h-11 md:min-h-10">Huỷ</Button>
        <Button variant="primary" type="submit" busy={busy} className="min-h-11 md:min-h-10">Lưu môn học</Button>
      </DialogFooter>
    </form>
  );
}

export function SubjectModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Thêm môn học"
      description="Môn học gom tài liệu và đề thi của một học phần. Chưa có tài liệu thì AI vẫn soạn đề được theo kiến thức chung."
      initialFocus="#f-code"
    >
      <SubjectForm onClose={onClose} />
    </Modal>
  );
}
