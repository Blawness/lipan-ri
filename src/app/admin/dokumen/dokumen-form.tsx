"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Save, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageUpload } from "@blawness/admin-kit/components";
import { uploadImageAction } from "@blawness/admin-kit/screens/media/actions";
import type { DocumentFormState } from "./actions";

export type DocumentFormValues = {
  number: string;
  title: string;
  signatory: string;
  issuedAt: string;
  fileUrl: string;
  status: "active" | "revoked";
  showDocument: boolean;
};

const labelClass = "text-sm font-medium text-navy-800";

export function DokumenForm({
  action,
  initial,
  signatories,
  onCancel,
}: {
  action: (
    prev: DocumentFormState,
    fd: FormData
  ) => Promise<DocumentFormState>;
  initial: DocumentFormValues;
  signatories: { id: number; name: string; title: string | null }[];
  onCancel?: () => void;
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
            list="signatory-list"
            defaultValue={initial.signatory}
            required
            placeholder="Pilih atau ketik nama…"
          />
          <datalist id="signatory-list">
            {signatories.map((s) => (
              <option key={s.id} value={s.name}>
                {s.title ? `${s.name}, ${s.title}` : s.name}
              </option>
            ))}
          </datalist>
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
          <ImageUpload
            value={fileUrl}
            onChange={setFileUrl}
            label="dokumen"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            allowedTypes={[
              "application/pdf",
              "image/jpeg",
              "image/png",
              "image/webp",
            ]}
            maxBytes={16 * 1024 * 1024}
            uploadAction={uploadImageAction}
          />
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-sm text-navy-800">
          <input
            type="checkbox"
            name="showDocument"
            defaultChecked={initial.showDocument}
            className="h-4 w-4 accent-brand-600"
          />
          Tampilkan dokumen di halaman verifikasi publik
        </label>
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
        {onCancel ? (
          <Button variant="outline" type="button" onClick={onCancel}>
            Batal
          </Button>
        ) : (
          <Link href="/admin/dokumen">
            <Button variant="outline" type="button">
              Batal
            </Button>
          </Link>
        )}
      </div>
    </form>
  );
}
