"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useState } from "react";
import { Save, Send, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Editor } from "@blawness/admin-kit/components";
import type { LetterTemplateField } from "@/db/schema";
import { siapkanIsian } from "@/lib/surat/isian";
import type { LetterFormState } from "./actions";
import { SuratKertas } from "./surat-kertas";

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
  const [subject, setSubject] = useState(initial.subject);
  const [signatoryId, setSignatoryId] = useState<number | null>(initial.signatoryId);
  const [lihatPratinjau, setLihatPratinjau] = useState(false);
  const [berubah, setBerubah] = useState(false);

  // Cegah tulisan hilang karena tab tertutup atau tombol kembali tak sengaja.
  useEffect(() => {
    if (!berubah) return;
    const tahan = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", tahan);
    return () => window.removeEventListener("beforeunload", tahan);
  }, [berubah]);

  const template = useMemo(
    () => templates.find((t) => t.id === templateId) ?? null,
    [templates, templateId]
  );

  const signatory = signatories.find((sg) => sg.id === signatoryId) ?? null;
  // Sumber yang sama dengan halaman detail dan perender PDF.
  const isian = siapkanIsian({
    bodyHtml: body,
    templateFields: template?.fields ?? [],
    fieldValues: values,
  });

  function pilihTemplate(id: number) {
    setBerubah(true);
    setTemplateId(id);
    const t = templates.find((x) => x.id === id);
    // Badan hanya diisi ulang kalau masih kosong, supaya tulisan tidak hilang.
    if (t && body.trim() === "") setBody(t.bodyDefault);
  }

  return (
    <form
      action={formAction}
      onChange={() => setBerubah(true)}
      onSubmit={() => setBerubah(false)}
      className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
    >
      <div className="min-w-0 space-y-6">
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
            <Input
              id="subject"
              name="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              placeholder="Pengangkatan Pengurus Periode 2026"
            />
            <p className="text-xs text-muted-foreground">Dicetak sebagai judul surat, di bawah kop.</p>
          </div>

          <div className="space-y-1.5">
            <label className={labelClass} htmlFor="signatoryId">Penandatangan</label>
            <select
              id="signatoryId"
              name="signatoryId"
              value={signatoryId ?? ""}
              onChange={(e) => setSignatoryId(Number(e.target.value) || null)}
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
            <Editor
              key={templateId ?? "kosong"}
              value={body}
              onChange={(html) => {
                setBody(html);
                setBerubah(true);
              }}
            />
          </div>
          {template && template.fields.length > 0 ? (
            <p className="text-xs leading-relaxed text-muted-foreground">
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
          <p role="alert" className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" /> {state.error}
          </p>
        ) : null}

        <div className="sticky bottom-0 z-10 -mx-1 flex flex-wrap items-center gap-3 border-t border-navy-100 bg-white/95 px-1 py-3 backdrop-blur">
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
          <Button
            type="button"
            variant="ghost"
            className="ml-auto xl:hidden"
            onClick={() => setLihatPratinjau((v) => !v)}
            aria-expanded={lihatPratinjau}
            aria-controls="pratinjau-surat"
          >
            {lihatPratinjau ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {lihatPratinjau ? "Tutup Pratinjau" : "Pratinjau"}
          </Button>
        </div>
      </div>

      <aside
        id="pratinjau-surat"
        className={`${lihatPratinjau ? "block" : "hidden"} min-w-0 xl:block`}
        aria-label="Pratinjau surat"
      >
        <div className="space-y-2 xl:sticky xl:top-4">
          <p className="text-xs font-medium uppercase tracking-wide text-navy-500">
            Pratinjau langsung
          </p>
          <div className="max-h-[calc(100vh-6rem)] overflow-auto rounded-xl bg-navy-50/70 p-2 sm:p-4">
            <SuratKertas
              subject={subject}
              number="(terbit saat disahkan)"
              fields={isian.fields}
              bodyHtml={isian.bodyHtml}
              signatoryName={signatory ? [signatory.name, signatory.title].filter(Boolean).join(", ") : ""}
              signatoryPosition={signatory?.position ?? null}
              issuedAt={new Date()}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Nomor, tanggal, dan QR ditetapkan saat surat disahkan.
          </p>
        </div>
      </aside>
    </form>
  );
}
