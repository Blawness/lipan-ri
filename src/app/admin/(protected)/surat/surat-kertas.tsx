import { QrCode } from "lucide-react";
import { KOP } from "@/lib/surat/kop";

const dateFmt = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "long",
  timeZone: "Asia/Jakarta",
});

/** Sama dengan `jabatanTtd` di PDF: "Ketua" → "Ketua LIPAN RI". */
function jabatanTtd(jabatan: string): string {
  return jabatan.toUpperCase().replace(/-/g, " ").includes(KOP.singkatan) ? jabatan : `${jabatan} ${KOP.singkatan}`;
}

/**
 * Tiruan selembar surat sebagaimana tercetak di PDF — kop, judul, nomor,
 * isian, badan, dan blok TTD. Bukan pengganti PDF, tetapi tata letaknya
 * sengaja mengikuti `src/lib/surat/pdf/surat-document.tsx` supaya penulis dan
 * penandatangan bisa menilai hasil akhir tanpa harus mengesahkan dulu.
 *
 * Tanpa hook, jadi bisa dipakai di server component (halaman detail) maupun
 * di form client (pratinjau langsung).
 */
export function SuratKertas({
  subject,
  number,
  fields,
  bodyHtml,
  signatoryName,
  signatoryPosition,
  issuedAt,
  qrUrl,
}: {
  subject: string;
  /** Nomor final, atau calon nomor/penanda untuk surat yang belum disahkan. */
  number: string;
  fields: { key: string; label: string; value: string }[];
  bodyHtml: string;
  signatoryName: string;
  signatoryPosition: string | null;
  /** Tanggal terbit; untuk draft pakai hari ini sebagai perkiraan. */
  issuedAt: Date;
  /** Ada hanya untuk surat terbit — selain itu tampil kotak penanda QR. */
  qrUrl?: string | null;
}) {
  const rows = fields.filter((f) => f.value.trim() !== "");
  return (
    <article className="mx-auto w-full max-w-[794px] bg-white px-6 py-8 text-[13px] leading-relaxed text-[#0f2b46] shadow-sm ring-1 ring-navy-100 sm:px-12 sm:py-10">
      <header>
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- logo statis kecil, sama dengan yang di PDF */}
          <img src={KOP.logoUrl} alt="Logo LIPAN RI" className="h-14 w-14 shrink-0 sm:h-16 sm:w-16" />
          <div className="min-w-0 flex-1 text-center">
            {KOP.nama.map((baris) => (
              <p key={baris} className="text-[11px] font-bold leading-tight tracking-wide sm:text-[15px]">
                {baris}
              </p>
            ))}
            <p className="text-[11px] font-bold sm:text-[12px]">({KOP.singkatan})</p>
            <p className="text-[9px] italic sm:text-[10px]">{KOP.legalitas}</p>
            <p className="mt-0.5 text-[9px] leading-snug text-[#5b6b7c] sm:text-[10px]">
              {KOP.alamat}
              <br />
              {KOP.kontak}
            </p>
          </div>
          {/* Penyeimbang selebar logo agar teks kop tepat di tengah. */}
          <div className="hidden w-16 shrink-0 sm:block" aria-hidden />
        </div>
        <div className="mt-3 h-[3px] bg-[#0f2b46]" />
        <div className="mt-[2px] h-px bg-[#0f2b46]" />
      </header>

      <p className="mt-7 text-center font-bold uppercase underline underline-offset-2">
        {subject || <span className="text-navy-300 no-underline">Perihal surat</span>}
      </p>
      <p className="text-center">Nomor: {number}</p>

      {rows.length > 0 ? (
        <dl className="mt-5 space-y-0.5">
          {rows.map((f) => (
            <div key={f.key} className="flex">
              <dt className="w-24 shrink-0 sm:w-36">{f.label}</dt>
              <dd className="w-3 shrink-0">:</dd>
              <dd className="min-w-0 flex-1 whitespace-pre-line">{f.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {bodyHtml.trim() ? (
        <div
          className="prose prose-sm mt-5 max-w-none text-[13px] text-[#0f2b46] prose-p:my-2 prose-p:text-justify prose-headings:text-[#0f2b46] prose-ol:my-2 prose-ul:my-2 prose-li:my-0"
          dangerouslySetInnerHTML={{ __html: bodyHtml }}
        />
      ) : (
        <p className="mt-5 italic text-navy-300">Badan surat masih kosong.</p>
      )}

      <div className="mt-8 flex justify-end">
        <div className="w-56 text-center">
          <p>
            {KOP.kota}, {dateFmt.format(issuedAt)}
          </p>
          {signatoryPosition ? <p>{jabatanTtd(signatoryPosition)}</p> : null}
          <div className="mx-auto my-2 flex h-24 w-24 items-center justify-center">
            {qrUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- PNG QR dari route internal
              <img src={qrUrl} alt="QR verifikasi" className="h-24 w-24" />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-1 rounded border border-dashed border-navy-200 text-[10px] leading-tight text-navy-400">
                <QrCode className="h-6 w-6" />
                QR terbit
                <br />
                saat disahkan
              </div>
            )}
          </div>
          <p className="font-bold underline">
            {signatoryName || <span className="font-normal text-navy-300 no-underline">Penandatangan</span>}
          </p>
        </div>
      </div>
    </article>
  );
}
