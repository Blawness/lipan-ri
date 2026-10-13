import Link from "next/link";
import { requirePermission } from "@blawness/admin-kit/auth-helpers";
import { ToastOnParam } from "@blawness/admin-kit/components";
import { Button } from "@/components/ui/button";
import { listLettersAdmin, type LetterStatusFilter } from "@/lib/admin/letters";
import { rbac } from "@/rbac";
import type { AdminSessionUser } from "@blawness/admin-kit";
import { StatusBadge } from "./status-badge";
import { Plus, Search, ChevronLeft, ChevronRight, X, FileText } from "lucide-react";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 15;

const TABS: { value: LetterStatusFilter; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "draft", label: "Draft" },
  { value: "submitted", label: "Menunggu Pengesahan" },
  { value: "issued", label: "Terbit" },
];

function parseStatus(v?: string): LetterStatusFilter {
  return v === "draft" || v === "submitted" || v === "issued" ? v : "all";
}

function buildQuery(p: { q?: string; status?: LetterStatusFilter; page?: number }) {
  const sp = new URLSearchParams();
  if (p.q) sp.set("q", p.q);
  if (p.status && p.status !== "all") sp.set("status", p.status);
  if (p.page && p.page > 1) sp.set("page", String(p.page));
  const qs = sp.toString();
  return qs ? `/admin/surat?${qs}` : "/admin/surat";
}

const dateFmt = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeZone: "Asia/Jakarta",
});

export default async function SuratListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const session = await requirePermission("letters.read");
  const sp = await searchParams;
  const user = session.user as AdminSessionUser;
  const bisaSahkan = rbac.can(user.role, "letters.issue");
  const bisaTulis = rbac.can(user.role, "letters.write");

  // Pengesah lebih sering datang untuk mengesahkan daripada menelusuri arsip.
  const status = sp.status ? parseStatus(sp.status) : bisaSahkan ? "submitted" : "all";
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const { rows, total } = await listLettersAdmin({ q: sp.q, status, page, pageSize: PAGE_SIZE });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <ToastOnParam param="saved" messages={{ deleted: "Surat berhasil dihapus." }} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-xl font-bold text-navy-900">Surat</h1>
          <p className="text-sm text-muted-foreground">
            Susun surat, ajukan ke penandatangan, lalu terbitkan PDF ber-QR.
          </p>
        </div>
        {bisaTulis ? (
          <Button
            render={
              <Link href="/admin/surat/baru">
                <Plus className="h-4 w-4" />
                Surat Baru
              </Link>
            }
          />
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {TABS.map((t) => (
          <Link
            key={t.value}
            href={buildQuery({ q: sp.q, status: t.value })}
            aria-current={status === t.value ? "page" : undefined}
            className={`rounded-full px-3 py-1 text-sm transition-colors ${
              status === t.value ? "bg-navy-900 text-white" : "bg-navy-50 text-navy-700 hover:bg-navy-100"
            }`}
          >
            {t.label}
          </Link>
        ))}
        <form action="/admin/surat" className="flex w-full items-center gap-2 sm:ml-auto sm:w-auto">
          <input type="hidden" name="status" value={status} />
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-navy-400" />
            <input
              type="search"
              name="q"
              defaultValue={sp.q ?? ""}
              placeholder="Cari perihal atau nomor…"
              aria-label="Cari perihal atau nomor surat"
              className="h-9 w-full rounded-md border border-navy-200 pl-8 pr-8 text-sm focus:border-navy-400 focus:outline-none focus:ring-2 focus:ring-navy-100"
            />
            {sp.q ? (
              <Link
                href={buildQuery({ status })}
                aria-label="Hapus pencarian"
                className="absolute right-1.5 top-1.5 rounded p-1 text-navy-400 hover:bg-navy-50 hover:text-navy-700"
              >
                <X className="h-4 w-4" />
              </Link>
            ) : null}
          </div>
        </form>
      </div>

      {sp.q ? (
        <p className="text-sm text-muted-foreground">
          {total} surat cocok dengan “{sp.q}”.
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-navy-100 bg-white shadow-sm">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-navy-50/60 text-left text-xs uppercase text-navy-500">
            <tr>
              <th className="px-4 py-3">Perihal</th>
              <th className="px-4 py-3">Nomor</th>
              <th className="hidden px-4 py-3 lg:table-cell">Penandatangan</th>
              <th className="px-4 py-3">Status</th>
              <th className="hidden px-4 py-3 md:table-cell">Diperbarui</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center">
                  <FileText className="mx-auto h-8 w-8 text-navy-200" />
                  <p className="mt-2 font-medium text-navy-900">
                    {sp.q
                      ? "Tidak ada surat yang cocok."
                      : status === "submitted"
                        ? "Tidak ada surat yang menunggu pengesahan."
                        : status === "draft"
                          ? "Tidak ada draft surat."
                          : status === "issued"
                            ? "Belum ada surat yang terbit."
                            : "Belum ada surat."}
                  </p>
                  {status !== "all" || sp.q ? (
                    <Link href="/admin/surat?status=all" className="mt-1 inline-block text-sm text-navy-600 hover:underline">
                      Lihat semua surat
                    </Link>
                  ) : bisaTulis ? (
                    <Link href="/admin/surat/baru" className="mt-1 inline-block text-sm text-navy-600 hover:underline">
                      Buat surat pertama
                    </Link>
                  ) : null}
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t border-navy-100 hover:bg-navy-50/40">
                  <td className="px-4 py-3">
                    <Link href={`/admin/surat/${r.id}`} className="font-medium text-navy-900 hover:underline">
                      {r.subject}
                    </Link>
                    <p className="text-xs text-muted-foreground">{r.templateName}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {/* Nomor baru terbit saat disahkan; "draft" di sini dulu
                        menabrak kolom Status yang bisa saja "Menunggu Pengesahan". */}
                    {r.number ?? <span className="text-muted-foreground">belum bernomor</span>}
                  </td>
                  <td className="hidden px-4 py-3 lg:table-cell">{r.signatoryName}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={r.status} documentStatus={r.documentStatus} />
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                    {r.updatedAt ? dateFmt.format(r.updatedAt) : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <div className="flex items-center justify-end gap-2">
          {page > 1 ? (
            <Button
              variant="outline"
              size="sm"
              render={
                <Link href={buildQuery({ q: sp.q, status, page: page - 1 })} aria-label="Halaman sebelumnya">
                  <ChevronLeft className="h-4 w-4" />
                </Link>
              }
            />
          ) : (
            <Button variant="outline" size="sm" disabled aria-label="Halaman sebelumnya">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          <span className="text-sm text-muted-foreground">
            Halaman {page} dari {totalPages}
          </span>
          {page < totalPages ? (
            <Button
              variant="outline"
              size="sm"
              render={
                <Link href={buildQuery({ q: sp.q, status, page: page + 1 })} aria-label="Halaman berikutnya">
                  <ChevronRight className="h-4 w-4" />
                </Link>
              }
            />
          ) : (
            <Button variant="outline" size="sm" disabled aria-label="Halaman berikutnya">
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}
