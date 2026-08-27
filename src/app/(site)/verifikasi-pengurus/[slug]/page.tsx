import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CheckCircle, XCircle, BadgeCheck, Calendar, User } from "lucide-react";
import { getPengurusBySlug } from "@/lib/pengurus";
import { isBerlaku, formatMasaBerlaku } from "@/lib/pengurus-rules";
import { SafeImage } from "@/components/safe-image";

export const dynamic = "force-dynamic";

// Halaman ini memuat foto dan data pribadi. Membiarkannya terindeks berarti
// seluruh foto pengurus dapat dipanen tanpa perlu memindai QR sama sekali.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function VerifikasiPengurusPage({ params }: Props) {
  const { slug } = await params;
  const p = await getPengurusBySlug(slug);

  if (!p) notFound();

  const valid = isBerlaku(p);

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <div className="rounded-2xl border border-navy-100 bg-white p-8 text-center shadow-sm">
        {valid ? (
          <CheckCircle className="mx-auto h-16 w-16 text-emerald-500" />
        ) : (
          <XCircle className="mx-auto h-16 w-16 text-red-500" />
        )}

        <h1 className="mt-4 font-heading text-xl font-bold text-navy-900">
          {valid ? "Pengurus Aktif" : "Tidak Berlaku"}
        </h1>

        <p
          className={`mt-1 text-sm ${valid ? "text-emerald-700" : "text-red-700"}`}
        >
          {valid
            ? "Nama berikut terdaftar sebagai pengurus aktif LIPAN RI."
            : "Nama berikut sudah tidak menjabat sebagai pengurus LIPAN RI."}
        </p>

        {p.foto && (
          <SafeImage
            src={p.foto}
            alt={p.nama}
            className="mx-auto mt-6 size-32 rounded-2xl object-cover object-top ring-1 ring-navy-100 sm:size-40"
          />
        )}

        <div className="mt-6 space-y-3 rounded-xl border border-navy-100 bg-navy-50/50 p-5 text-left text-sm">
          <div className="flex items-start gap-3">
            <User className="mt-0.5 h-4 w-4 shrink-0 text-navy-400" />
            <div>
              <p className="text-xs text-muted-foreground">Nama</p>
              <p className="font-medium text-navy-900">{p.nama}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-navy-400" />
            <div>
              <p className="text-xs text-muted-foreground">Jabatan</p>
              <p className="font-medium text-navy-900">{p.jabatan}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-navy-400" />
            <div>
              <p className="text-xs text-muted-foreground">Nomor Anggota</p>
              <p className="font-medium text-navy-900">{p.nomorAnggota}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-navy-400" />
            <div>
              <p className="text-xs text-muted-foreground">Masa Berlaku</p>
              <p className="font-medium text-navy-900">
                {formatMasaBerlaku(p.mulaiMenjabat, p.selesaiMenjabat)}
              </p>
            </div>
          </div>
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          Halaman ini dihasilkan otomatis oleh sistem LIPAN RI.
        </p>
      </div>
    </div>
  );
}
