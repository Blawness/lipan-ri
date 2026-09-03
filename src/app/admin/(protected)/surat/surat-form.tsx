"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { Save, Send, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Editor } from "@blawness/admin-kit/components";
import type { LetterTemplateField } from "@/db/schema";
import type { LetterFormState } from "./actions";

const labelClass = "text-sm font-medium text-navy-800";

export type SuratTemplateOption = {
  id: number;
  name: string;
  bodyDefault: string;
  fields: LetterTemplateField[];
};

export type SuratFormValues = {
  templateId: number | null;
  subject: string;
  bodyHtml: string;
  fieldValues: Record<string, string>;
  signatoryId: number | null;
};

export function SuratForm({
  action,
  initial,
  templates,
  signatories,
  canSubmit,
  lockTemplate = false,
}: {
  action: (prev: LetterFormState, fd: FormData) => Promise<LetterFormState>;
  initial: SuratFormValues;
  templates: SuratTemplateOption[];
  signatories: { id: number; name: string; title: string | null; position: string | null }[];
  canSubmit: boolean;
  lockTemplate?: boolean;
}) {
  const [state, formAction, pending] = useActionState<LetterFormState, FormData>(action, {});
  const [templateId, setTemplateId] = useState<number | null>(initial.templateId);
  const [body, setBody] = useState(initial.bodyHtml);
  const [values, setValues] = useState<Record<string, string>>(initial.fieldValues);

  const template = useMemo(
    () => templates.find((t) => t.id === templateId) ?? null,
    [templates, templateId]
  );

  function pilihTemplate(id: number) {
    setTemplateId(id);
    const t = templates.find((x) => x.id === id);
    // Badan hanya diisi ulang kalau masih kosong, supaya tulisan tidak hilang.
    if (t && body.trim() === "") setBody(t.bodyDefault);
  }

  return (
    <form action={formAction} className="max-w-2xl space-y-6">
      <input type="hidden" name="bodyHtml" value={body} />
      <input type="hidden" name="fieldValues" value={JSON.stringify(values)} />
      <input type="hidden" name="templateId" value={templateId ?? ""} />

      <div className="space-y-5 rounded-xl border border-navy-100 bg-white p-6 shadow-sm">
        <div className="space-y-1.5">
          <label className={labelClass} htmlFor="template">Jenis Surat</label>
          <select
            id="template"
            disabled={lockTemplate}
            value={templateId ?? ""}
            onChange={(e) => pilihTemplate(Number(e.target.value))}
            className="h-9 w-full rounded-md border border-navy-200 bg-white px-2 text-sm disabled:bg-navy-50"
            required
          >
            <option value="" disabled>— pilih jenis surat —</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className={labelClass} htmlFor="subject">Perihal</label>
          <Input id="subject" name="subject" defaultValue={initial.subject} required placeholder="Pengangkatan Pengurus Periode 2026" />
        </div>

        <div className="space-y-1.5">
          <label className={labelClass} htmlFor="signatoryId">Penandatangan</label>
          <select
            id="signatoryId"
            name="signatoryId"
            defaultValue={initial.signatoryId ?? ""}
            className="h-9 w-full rounded-md border border-navy-200 bg-white px-2 text-sm"
            required
          >
            <option value="" disabled>— pilih penandatangan —</option>
            {signatories.map((sg) => (
              <option key={sg.id} value={sg.id}>
                {sg.name}{sg.position ? ` — ${sg.position}` : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      {template && template.fields.length > 0 ? (
        <div className="space-y-5 rounded-xl border border-navy-100 bg-white p-6 shadow-sm">
          <h2 className="font-heading text-sm font-semibold text-navy-900">Isian {template.name}</h2>
          {template.fields.map((f) => (
            <div key={f.key} className="space-y-1.5">
              <label className={labelClass} htmlFor={`f-${f.key}`}>
                {f.label}{f.required ? " *" : ""}
              </label>
              {f.type === "textarea" ? (
                <textarea
                  id={`f-${f.key}`}
                  required={f.required}
                  value={values[f.key] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                  className="min-h-24 w-full rounded-md border border-navy-200 px-3 py-2 text-sm"
                />
              ) : (
                <Input
                  id={`f-${f.key}`}
                  type={f.type === "date" ? "date" : f.type === "number" ? "number" : "text"}
                  required={f.required}
                  value={values[f.key] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                />
              )}
            </div>
          ))}
        </div>
      ) : null}

      <div className="space-y-2 rounded-xl border border-navy-100 bg-white p-6 shadow-sm">
        <label className={labelClass}>Badan Surat</label>
        {/*
          `key` sengaja diikat ke templateId supaya editor dipasang ulang saat
          jenis surat berganti. Editor admin-kit hanya membaca `value` sekali
          saat mount (useEditor({ content })), jadi tanpa remount badan bawaan
          template masuk ke state tapi TIDAK terlihat di layar — penulis surat
          mengira template tidak punya isi bawaan, padahal isinya ikut tersimpan.
        */}
        {/* .surat-editor menyembunyikan tombol Tautan & Gambar — lihat globals.css */}
        <div className="surat-editor">
          <Editor key={templateId ?? "kosong"} value={body} onChange={setBody} />
        </div>
        {template && template.fields.length > 0 ? (
          <p className="text-xs text-muted-foreground">
            Sisipkan isian ke dalam kalimat dengan menulis tokennya:{" "}
            {template.fields.map((f, i) => (
              <span key={f.key}>
                {i > 0 ? ", " : ""}
                <code className="rounded bg-navy-50 px-1 font-mono">{`{{${f.key}}}`}</code>
              </span>
            ))}
            . Token akan diganti nilainya saat surat dicetak.
          </p>
        ) : null}
      </div>

      {state.error ? (
        <p className="flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" /> {state.error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" name="intent" value="save" variant="outline" disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Simpan Draft
        </Button>
        {canSubmit ? (
          <Button type="submit" name="intent" value="submit" disabled={pending}>
            <Send className="h-4 w-4" /> Ajukan untuk Pengesahan
          </Button>
        ) : null}
        <Button variant="ghost" render={<Link href="/admin/surat">Batal</Link>} />
      </div>
    </form>
  );
}
