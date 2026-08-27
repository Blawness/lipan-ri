"use client";

import { useActionState, useState } from "react";
import { Save, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageUpload } from "@blawness/admin-kit/components";
import { uploadImageAction } from "@blawness/admin-kit/screens/media/actions";
import { SLOT_LABELS } from "@/components/tentang-kami/org-flow";
import type { PengurusFormState } from "./actions";

export type PengurusFormValues = {
  slot: string;
  slug: string;
  nomorAnggota: string;
  nama: string;
  jabatan: string;
  foto: string;
  deskripsi: string;
  email: string;
  telepon: string;
  status: "aktif" | "nonaktif";
  mulaiMenjabat: string;
  selesaiMenjabat: string;
};

const labelClass = "text-sm font-medium text-navy-800";

export function PengurusForm({
  action,
  initial,
}: {
  action: (
    prev: PengurusFormState,
    fd: FormData,
  ) => Promise<PengurusFormState>;
  initial: PengurusFormValues;
}) {
  const [state, formAction, pending] = useActionState<
    PengurusFormState,
    FormData
  >(action, {});
  const [foto, setFoto] = useState(initial.foto);

  return (
    <form action={formAction} className="max-w-xl space-y-6">
      <input type="hidden" name="foto" value={foto} />

      <div className="space-y-5 rounded-xl border border-navy-100 bg-white p-6 shadow-sm">
        <div className="space-y-1.5">
          <label className={labelClass} htmlFor="nama">
            Nama
          </label>
          <Input
            id="nama"
            name="nama"
            defaultValue={initial.nama}
            required
            placeholder="Cahya Puspita Rini, S.E."
          />
        </div>

        <div className="space-y-1.5">
          <label className={labelClass} htmlFor="jabatan">
            Jabatan
          </label>
          <Input
            id="jabatan"
            name="jabatan"
            defaultValue={initial.jabatan}
            required
            placeholder="Sekretaris Jenderal"
          />
        </div>

        <div className="space-y-1.5">
          <label className={labelClass} htmlFor="slot">
            Posisi di bagan
          </label>
          <select
            id="slot"
            name="slot"
            defaultValue={initial.slot}
            className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          >
            <option value="">— tidak tampil di bagan —</option>
            {Object.entries(SLOT_LABELS).map(([slot, l]) => (
              <option key={slot} value={slot}>
                {l.role} ({slot})
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            Satu posisi hanya bisa diisi satu orang.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className={labelClass} htmlFor="slug">
            Slug URL verifikasi
          </label>
          <Input id="slug" name="slug" defaultValue={initial.slug} />
          <p className="text-xs text-muted-foreground">
            Dirapikan otomatis (huruf kecil, tanpa spasi/simbol). Kosongkan
            untuk menurunkannya dari nama.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className={labelClass} htmlFor="nomorAnggota">
            Nomor Anggota
          </label>
          <Input
            id="nomorAnggota"
            name="nomorAnggota"
            defaultValue={initial.nomorAnggota}
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className={labelClass} htmlFor="deskripsi">
            Tupoksi
          </label>
          <textarea
            id="deskripsi"
            name="deskripsi"
            defaultValue={initial.deskripsi}
            rows={4}
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
            placeholder="Uraian tugas pokok dan fungsi jabatan…"
          />
        </div>

        <div className="space-y-1.5">
          <label className={labelClass}>Foto</label>
          <ImageUpload
            value={foto}
            onChange={setFoto}
            uploadAction={uploadImageAction}
          />
        </div>
      </div>

      <div className="space-y-5 rounded-xl border border-navy-100 bg-white p-6 shadow-sm">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className={labelClass} htmlFor="mulaiMenjabat">
              Mulai Menjabat
            </label>
            <Input
              id="mulaiMenjabat"
              name="mulaiMenjabat"
              type="date"
              defaultValue={initial.mulaiMenjabat}
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass} htmlFor="selesaiMenjabat">
              Selesai Menjabat
            </label>
            <Input
              id="selesaiMenjabat"
              name="selesaiMenjabat"
              type="date"
              defaultValue={initial.selesaiMenjabat}
            />
            <p className="text-xs text-muted-foreground">
              Kosongkan bila belum ada batas.
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className={labelClass} htmlFor="status">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={initial.status}
            className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          >
            <option value="aktif">Aktif</option>
            <option value="nonaktif">Nonaktif</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className={labelClass} htmlFor="email">
            Email dinas
          </label>
          <Input id="email" name="email" type="email" defaultValue={initial.email} />
          <p className="text-xs text-muted-foreground">
            Tampil publik di panel bagan. Jangan isi kontak pribadi.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className={labelClass} htmlFor="telepon">
            Telepon dinas
          </label>
          <Input id="telepon" name="telepon" defaultValue={initial.telepon} />
        </div>
      </div>

      {state.error && (
        <p className="flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        Simpan
      </Button>
    </form>
  );
}
