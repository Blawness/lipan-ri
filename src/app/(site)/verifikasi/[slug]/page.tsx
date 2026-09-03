import { notFound } from "next/navigation";
import { getDocumentBySlugAndIncrement } from "@/lib/documents";
import { CheckCircle, XCircle, Calendar, User, FileText } from "lucide-react";
import { PrintButton } from "./print-button";

export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "long",
  timeZone: "Asia/Jakarta",
});

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function VerifikasiPage({ params }: Props) {
  const { slug } = await params;
  const doc = await getDocumentBySlugAndIncrement(slug);

  if (!doc) {
    notFound();
  }

  const isValid = doc.status === "active";

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <div className="rounded-2xl border border-navy-100 bg-white p-8 shadow-sm text-center">
        {isValid ? (
          <CheckCircle className="mx-auto h-16 w-16 text-emerald-500" />
        ) : (
          <XCircle className="mx-auto h-16 w-16 text-red-500" />
        )}

        <h1 className="mt-4 font-heading text-xl font-bold text-navy-900">
          {isValid ? "Dokumen Valid" : "Dokumen Tidak Berlaku"}
        </h1>

        {isValid ? (
          <p className="mt-1 text-sm text-emerald-700">
            Dokumen ini terdaftar dan sah menurut sistem LIPAN RI.
          </p>
        ) : (
          <p className="mt-1 text-sm text-red-700">
            Dokumen ini telah dicabut dan tidak berlaku lagi.
          </p>
        )}

        <div className="mt-8 space-y-3 rounded-xl border border-navy-100 bg-navy-50/50 p-5 text-left text-sm">
          <div className="flex items-start gap-3">
            <FileText className="mt-0.5 h-4 w-4 shrink-0 text-navy-400" />
            <div>
              <p className="text-xs text-muted-foreground">Nomor Surat</p>
              <p className="font-medium text-navy-900">{doc.number}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <FileText className="mt-0.5 h-4 w-4 shrink-0 text-navy-400" />
            <div>
              <p className="text-xs text-muted-foreground">Perihal</p>
              <p className="font-medium text-navy-900">{doc.title}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-navy-400" />
            <div>
              <p className="text-xs text-muted-foreground">Tanggal Terbit</p>
              <p className="font-medium text-navy-900">
                {dateFmt.format(doc.issuedAt)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <User className="mt-0.5 h-4 w-4 shrink-0 text-navy-400" />
            <div>
              <p className="text-xs text-muted-foreground">Penandatangan</p>
              <p className="font-medium text-navy-900">{doc.signatory}</p>
            </div>
          </div>
        </div>

        {!isValid && doc.revokeReason && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-left text-sm">
            <p className="text-xs font-medium text-red-700">Alasan Pencabutan</p>
            <p className="mt-1 text-red-600">{doc.revokeReason}</p>
          </div>
        )}

        {doc.showDocument && doc.fileUrl && (
          <div className="mt-4 rounded-lg border border-navy-200 bg-navy-50/50 p-4 text-center">
            <p className="text-xs text-muted-foreground mb-2">Dokumen Asli</p>
            <a
              href={doc.fileUrl}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              <FileText className="h-4 w-4" />
              Lihat Dokumen
            </a>
          </div>
        )}

        <p className="mt-6 text-xs text-muted-foreground">
          Verifikasi oleh LIPAN RI &middot; Informasi ini bersifat publik
        </p>
      </div>

      <div className="mt-4 text-center no-print">
        <PrintButton />
      </div>
    </div>
  );
}
