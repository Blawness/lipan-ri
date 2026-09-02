"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { Save, Loader2, AlertCircle, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Editor } from "@blawness/admin-kit/components";
import { renderNumberPattern } from "@/lib/surat/nomor";
import type { LetterTemplateField } from "@/db/schema";
import type { TemplateFormState } from "./actions";

const labelClass = "text-sm font-medium text-navy-800";

export type TemplateFormValues = {
  code: string;
  name: string;
  numberPattern: string;
  bodyDefault: string;
  fields: LetterTemplateField[];
  isActive: boolean;
};

export function TemplateForm({
  action,
  initial,
}: {
  action: (prev: TemplateFormState, fd: FormData) => Promise<TemplateFormState>;
  initial: TemplateFormValues;
}) {
  const [state, formAction, pending] = useActionState<TemplateFormState, FormData>(action, {});
  const [pattern, setPattern] = useState(initial.numberPattern);
  const [code, setCode] = useState(initial.code);
  const [body, setBody] = useState(initial.bodyDefault);
  const [fields, setFields] = useState<LetterTemplateField[]>(initial.fields);

  const contoh = useMemo(
    () => renderNumberPattern(pattern, { seq: 1, date: new Date(), code }),
    [pattern, code]
  );

  function updateField(i: number, patch: Partial<LetterTemplateField>) {
    setFields((prev) => prev.map((f, j) => (j === i ? { ...f, ...patch } : f)));
  }

  return (
    <form action={formAction} className="max-w-2xl space-y-6">
      <input type="hidden" name="bodyDefault" value={body} />
      <input type="hidden" name="fields" value={JSON.stringify(fields)} />

      <div className="space-y-5 rounded-xl border border-navy-100 bg-white p-6 shadow-sm">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className={labelClass} htmlFor="name">Nama Jenis Surat</label>
            <Input id="name" name="name" defaultValue={initial.name} required placeholder="Surat Keputusan" />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass} htmlFor="code">Kode</label>
            <Input id="code" name="code" value={code} onChange={(e) => setCode(e.target.value)} required placeholder="SK" />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className={labelClass} htmlFor="numberPattern">Pola Nomor</label>
          <Input
            id="numberPattern"
            name="numberPattern"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            required
            placeholder="{seq}/{kode}/LIPAN-RI/{bulanRomawi}/{tahun}"
          />
          <p className="text-xs text-muted-foreground">
            Token: <code>{"{seq} {kode} {bulan} {bulanRomawi} {tahun}"}</code> — contoh hasil:{" "}
            <span className="font-medium text-navy-900">{contoh}</span>
          </p>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isActive" defaultChecked={initial.isActive} />
          Aktif (muncul saat membuat surat baru)
        </label>
      </div>

      <div className="space-y-4 rounded-xl border border-navy-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-sm font-semibold text-navy-900">Field Tambahan</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setFields((prev) => [...prev, { key: "", label: "", type: "text", required: false }])
            }
          >
            <Plus className="h-4 w-4" /> Tambah Field
          </Button>
        </div>

        {fields.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada field tambahan.</p>
        ) : (
          fields.map((f, i) => (
            <div key={i} className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_auto_auto_auto]">
              <Input placeholder="key (mis. dasar_hukum)" value={f.key} onChange={(e) => updateField(i, { key: e.target.value })} />
              <Input placeholder="Label" value={f.label} onChange={(e) => updateField(i, { label: e.target.value })} />
              <select
                className="h-9 rounded-md border border-navy-200 bg-white px-2 text-sm"
                value={f.type}
                onChange={(e) => updateField(i, { type: e.target.value as LetterTemplateField["type"] })}
              >
                <option value="text">Teks</option>
                <option value="textarea">Teks Panjang</option>
                <option value="date">Tanggal</option>
                <option value="number">Angka</option>
              </select>
              <label className="flex items-center gap-1.5 text-xs">
                <input type="checkbox" checked={f.required} onChange={(e) => updateField(i, { required: e.target.checked })} />
                Wajib
              </label>
              <Button type="button" variant="ghost" size="sm" onClick={() => setFields((prev) => prev.filter((_, j) => j !== i))}>
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          ))
        )}
      </div>

      <div className="space-y-2 rounded-xl border border-navy-100 bg-white p-6 shadow-sm">
        <label className={labelClass}>Badan Surat Default</label>
        <Editor value={body} onChange={setBody} />
      </div>

      {state.error ? (
        <p className="flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" /> {state.error}
        </p>
      ) : null}

      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Simpan
        </Button>
        <Button variant="outline" render={<Link href="/admin/surat/template">Batal</Link>} />
      </div>
    </form>
  );
}
