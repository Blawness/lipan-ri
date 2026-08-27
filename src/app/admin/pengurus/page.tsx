import Link from "next/link";
import Image from "next/image";
import { requireUser } from "@blawness/admin-kit/auth-helpers";
import { ConfirmDelete } from "@blawness/admin-kit/components";
import { Button } from "@/components/ui/button";
import { Plus, Download, Pencil } from "lucide-react";
import { getAllPengurus } from "@/lib/pengurus";
import { isBerlaku } from "@/lib/pengurus-rules";
import { POS } from "@/components/tentang-kami/org-flow";
import { deletePengurusAction } from "./actions";

export const dynamic = "force-dynamic";

/** Urut mengikuti posisi di bagan (atas ke bawah); tanpa slot ditaruh terakhir. */
function urutBagan(slot: string | null): number {
  if (!slot) return Number.MAX_SAFE_INTEGER;
  const p = POS[slot];
  return p ? p.y * 10_000 + p.x : Number.MAX_SAFE_INTEGER - 1;
}

export default async function PengurusPage() {
  await requireUser();
  const rows = (await getAllPengurus()).sort(
    (a, b) => urutBagan(a.slot) - urutBagan(b.slot),
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-navy-900">
            Pengurus
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Profil pengurus yang tampil di bagan struktur dan halaman verifikasi
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            render={<a href="/api/admin/pengurus/qr-bulk" download />}
          >
            <Download className="h-4 w-4" />
            Unduh semua QR
          </Button>
          <Button size="sm" render={<Link href="/admin/pengurus/baru" />}>
            <Plus className="h-4 w-4" />
            Tambah
          </Button>
        </div>
      </div>

      <ul className="mt-6 space-y-2">
        {rows.map((p) => (
          <li
            key={p.id}
            className="flex items-center gap-4 rounded-xl border border-navy-100 bg-white px-4 py-3 shadow-sm"
          >
            {p.foto ? (
              <Image
                src={p.foto}
                alt={p.nama}
                width={40}
                height={40}
                className="size-10 shrink-0 rounded-lg object-cover object-top"
              />
            ) : (
              <div className="size-10 shrink-0 rounded-lg bg-navy-50" />
            )}

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-navy-900">
                {p.nama}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {p.jabatan} · {p.nomorAnggota}
              </p>
            </div>

            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                isBerlaku(p)
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {isBerlaku(p) ? "Aktif" : "Tidak berlaku"}
            </span>

            <Button
              size="sm"
              variant="ghost"
              render={<Link href={`/admin/pengurus/${p.id}/edit`} />}
            >
              <Pencil className="h-3.5 w-3.5" />
              Ubah
            </Button>

            <ConfirmDelete
              action={deletePengurusAction}
              id={p.id}
              title="Hapus pengurus?"
              description={
                <>
                  <span className="font-medium text-navy-900">{p.nama}</span>{" "}
                  akan dihapus, dan QR-nya berhenti berlaku.
                </>
              }
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
