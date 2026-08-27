import Link from "next/link";
import { requireUser } from "@blawness/admin-kit/auth-helpers";
import { listDocumentsAdmin } from "@/lib/admin/documents";
import { getSignatories } from "@/lib/signatories";
import { deleteDocumentAction, revokeDocumentAction } from "./actions";
import { Button } from "@/components/ui/button";
import { ConfirmDelete, ToastOnParam } from "@blawness/admin-kit/components";
import { CreateDokumenButton } from "./create-button";
import { QrPreviewButton } from "./qr-preview-button";
import { QrPreviewModal } from "./qr-preview-modal";
import { EditDokumenButton } from "./edit-button";
import {
  FileText,
  Search,
  ChevronLeft,
  ChevronRight,
  Ban,
  Eye,
  Package,
} from "lucide-react";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 15;
const dateFmt = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" });

function buildQuery(params: { q?: string; page?: number }) {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.page && params.page > 1) sp.set("page", String(params.page));
  const qs = sp.toString();
  return qs ? `/admin/dokumen?${qs}` : "/admin/dokumen";
}

export default async function DokumenListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  await requireUser();

  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const page = Math.max(1, Number(sp.page) || 1);

  const { rows, total } = await listDocumentsAdmin({
    q,
    page,
    pageSize: PAGE_SIZE,
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilters = q !== "";

  const pageList: (number | "...")[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
      pageList.push(i);
    } else if (pageList[pageList.length - 1] !== "...") {
      pageList.push("...");
    }
  }

  const sigs = await getSignatories();

  return (
    <div className="max-w-5xl">
      <ToastOnParam
        param="saved"
        messages={{
          created: "Dokumen berhasil dibuat.",
          updated: "Dokumen berhasil diperbarui.",
        }}
      />
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-navy-900">
            Dokumen
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {total} dokumen
          </p>
        </div>
        <div className="flex items-center gap-2">
          {rows.length > 0 && (
            <a
              href="/api/admin/dokumen/qr-bulk"
              download="qr-lipan-ri.zip"
              title="Unduh semua QR code sebagai ZIP"
            >
              <Button size="sm" variant="ghost" type="button">
                <Package className="h-4 w-4" />
                Semua QR
              </Button>
            </a>
          )}
          <CreateDokumenButton signatories={sigs} />
        </div>
      </div>

      <div className="mb-4">
        <form method="get" className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Cari no surat, perihal…"
            aria-label="Cari dokumen"
            className="h-9 w-full rounded-md border border-navy-200 bg-white pl-9 pr-3 text-sm text-navy-900 placeholder:text-navy-400 focus:border-navy-400 focus:outline-none focus:ring-2 focus:ring-navy-100"
          />
        </form>
      </div>

      {rows.length === 0 ? (
        hasFilters ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-navy-200 bg-white py-16 text-center">
            <Search className="h-8 w-8 text-navy-300" />
            <p className="mt-3 text-sm font-medium text-navy-700">
              Tidak ada dokumen yang cocok
            </p>
            <p className="text-xs text-muted-foreground">
              Coba ubah kata kunci pencarian.
            </p>
            <Link
              href="/admin/dokumen"
              className="mt-3 text-xs font-medium text-navy-600 underline-offset-2 hover:underline"
            >
              Hapus filter
            </Link>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-navy-200 bg-white py-16 text-center">
            <FileText className="h-8 w-8 text-navy-300" />
            <p className="mt-3 text-sm font-medium text-navy-700">
              Belum ada dokumen
            </p>
            <p className="text-xs text-muted-foreground">
              Klik &ldquo;Tambah Dokumen&rdquo; untuk mendaftarkan dokumen
              pertama.
            </p>
          </div>
        )
      ) : (
        <div className="overflow-hidden rounded-xl border border-navy-100 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-100 bg-navy-50/50 text-left text-xs uppercase tracking-wide text-navy-500">
                <th className="px-4 py-3 font-semibold">Nomor / Perihal</th>
                <th className="px-4 py-3 font-semibold">Tgl Terbit</th>
                <th className="px-4 py-3 font-semibold">Verifikasi</th>
                <th className="px-4 py-3 font-semibold">Dokumen</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-navy-50 last:border-0 transition-colors hover:bg-navy-50/40"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-navy-900">{r.number}</p>
                    <p className="text-xs text-muted-foreground">{r.title}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {dateFmt.format(r.issuedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-sm text-navy-600">
                      <Eye className="h-3.5 w-3.5 text-navy-400" />
                      {r.viewCount ?? 0}
                      {r.viewCount ?? 0}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {r.fileUrl ? (
                      <div className="flex flex-col gap-0.5">
                        <a
                          href={r.fileUrl}
                          target="_blank"
                          rel="noopener"
                          className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
                        >
                          Lihat
                        </a>
                        {r.showDocument ? (
                          <span className="text-xs text-emerald-600">Publik</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Privat</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {r.status === "active" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-100">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Berlaku
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 ring-1 ring-red-100">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                        Dicabut
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <QrPreviewButton
                        slug={r.slug}
                        number={r.number}
                        title={r.title}
                      />
                      <EditDokumenButton id={r.id} signatories={sigs} />
                      {r.status === "active" && (
                        <form action={revokeDocumentAction} className="flex items-center gap-1">
                          <input type="hidden" name="id" value={r.id} />
                          <input
                            type="text"
                            name="revokeReason"
                            placeholder="Alasan..."
                            className="h-8 w-28 rounded-md border border-navy-200 px-2 text-xs text-navy-700 placeholder:text-navy-400 focus:border-red-300 focus:outline-none focus:ring-1 focus:ring-red-200"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            type="submit"
                            title="Cabut legalitas"
                          >
                            <Ban className="h-3.5 w-3.5" />
                            Cabut
                          </Button>
                        </form>
                      )}
                      <ConfirmDelete
                        action={deleteDocumentAction}
                        id={r.id}
                        title="Hapus dokumen?"
                        description={
                          <>
                            <span className="font-medium text-navy-900">
                              {r.number}
                            </span>{" "}
                            akan dihapus permanen.
                          </>
                        }
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <nav
          className="mt-8 flex items-center justify-center gap-1"
          aria-label="Pagination"
        >
          {page > 1 && (
            <Link
              href={buildQuery({ q, page: page - 1 })}
              className="flex h-9 w-9 items-center justify-center rounded-md text-sm text-navy-600 transition-colors hover:bg-navy-100"
              aria-label="Halaman sebelumnya"
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>
          )}
          {pageList.map((p, i) =>
            p === "..." ? (
              <span
                key={`dots-${i}`}
                className="flex h-9 w-9 items-center justify-center text-sm text-navy-400"
              >
                ...
              </span>
            ) : (
              <Link
                key={p}
                href={buildQuery({ q, page: p })}
                className={`flex h-9 min-w-[36px] items-center justify-center rounded-md text-sm transition-colors ${
                  p === page
                    ? "bg-navy-900 font-medium text-white"
                    : "text-navy-600 hover:bg-navy-100"
                }`}
              >
                {p}
              </Link>
            )
          )}
          {page < totalPages && (
            <Link
              href={buildQuery({ q, page: page + 1 })}
              className="flex h-9 w-9 items-center justify-center rounded-md text-sm text-navy-600 transition-colors hover:bg-navy-100"
              aria-label="Halaman berikutnya"
            >
              <ChevronRight className="h-4 w-4" />
            </Link>
          )}
        </nav>
      )}
      <QrPreviewModal />
    </div>
  );
}
