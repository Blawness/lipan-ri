"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Save, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PdfUpload } from "./pdf-upload";
import type { DocumentFormState } from "./actions";

export type DocumentFormValues = {
  number: string;
  title: string;
  signatory: string;
  issuedAt: string;
  fileUrl: string;
  status: "active" | "revoked";
};

const labelClass = "text-sm font-medium text-navy-800";

export function DokumenForm({
  action,
  initial,
}: {
  action: (
    prev: DocumentFormState,
    fd: FormData
  ) => Promise<DocumentFormState>;
  initial: DocumentFormValues;
}) {
  const [state, formAction, pending] = useActionState<
    DocumentFormState,
    FormData
  >(action, {});
  const [fileUrl, setFileUrl] = useState(initial.fileUrl);

  return (
    <form action={formAction} className="max-w-xl space-y-6">
      <input type="hidden" name="fileUrl" value={fileUrl} />

      <div className="space-y-5 rounded-xl border border-navy-100 bg-white p-6 shadow-sm">
        <div className="space-y-1.5">
          <label className={labelClass} htmlFor="number">
            Nomor Surat
          </label>
          <Input
            id="number"
            name="number"
            defaultValue={initial.number}
            required
            placeholder="001/LIPAN/VI/2026"
          />
        </div>

        <div className="space-y-1.5">
          <label className={labelClass} htmlFor="title">
            Perihal
          </label>
          <Input
            id="title"
            name="title"
            defaultValue={initial.title}
            required
            placeholder="Surat Keterangan Keanggotaan"
          />
        </div>

        <div className="space-y-1.5">
          <label className={labelClass} htmlFor="signatory">
            Nama Penandatangan
          </label>
          <Input
            id="signatory"
            name="signatory"
            defaultValue={initial.signatory}
            required
            placeholder="Dr. H. Ahmad Fauzi, M.Si."
          />
        </div>

        <div className="space-y-1.5">
          <label className={labelClass} htmlFor="issuedAt">
            Tanggal Terbit
          </label>
          <Input
            id="issuedAt"
            name="issuedAt"
            type="date"
            defaultValue={initial.issuedAt}
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className={labelClass}>Dokumen PDF (opsional)</label>
          <PdfUpload
            value={fileUrl}
            onChange={setFileUrl}
          />
        </div>
      </div>

      {state.error && (
        <p className="flex items-center gap-1.5 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {pending ? "Menyimpan…" : "Simpan"}
        </Button>
        <Button
          variant="outline"
          render={<Link href="/admin/dokumen">Batal</Link>}
        />
      </div>
    </form>
  );
}
