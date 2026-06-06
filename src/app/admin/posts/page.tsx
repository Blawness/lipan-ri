import Link from "next/link";
import { requireUser } from "@blawness/admin-kit/auth-helpers";
import { listPostsAdmin } from "@/lib/admin/posts";
import { deletePostAction } from "./actions";
import { Button } from "@/components/ui/button";
import { ConfirmDelete, ToastOnParam } from "@blawness/admin-kit/components";
import {
  Plus,
  Pencil,
  Star,
  FileText,
  Search,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 15;

type StatusFilter = "all" | "published" | "draft";

function parseStatus(value?: string): StatusFilter {
  return value === "published" || value === "draft" ? value : "all";
}

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "published", label: "Terbit" },
  { value: "draft", label: "Draft" },
];

function buildQuery(params: {
  q?: string;
  status?: StatusFilter;
  page?: number;
}) {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.status && params.status !== "all") sp.set("status", params.status);
  if (params.page && params.page > 1) sp.set("page", String(params.page));
  const qs = sp.toString();
  return qs ? `/admin/posts?${qs}` : "/admin/posts";
}

export default async function PostsListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  await requireUser();

  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const status = parseStatus(sp.status);
  const page = Math.max(1, Number(sp.page) || 1);

  const { rows, total } = await listPostsAdmin({
    q,
    status,
    page,
    pageSize: PAGE_SIZE,
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilters = q !== "" || status !== "all";

  // Build the page list with ellipsis, mirroring the public Pagination component.
  const pageList: (number | "...")[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
      pageList.push(i);
    } else if (pageList[pageList.length - 1] !== "...") {
      pageList.push("...");
    }
  }

  return (
    <div className="max-w-5xl">
      <ToastOnParam
        param="saved"
        messages={{
          created: "Berita berhasil dibuat.",
          updated: "Berita berhasil diperbarui.",
        }}
      />
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-navy-900">Berita</h1>
          <p className="mt-1 text-sm text-muted-foreground">{total} artikel</p>
        </div>
        <Button
          render={
            <Link href="/admin/posts/new">
              <Plus className="h-4 w-4" />
              Tambah Berita
            </Link>
          }
        />
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form method="get" className="relative w-full sm:max-w-xs">
          {status !== "all" && (
            <input type="hidden" name="status" value={status} />
          )}
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Cari judul…"
            aria-label="Cari judul berita"
            className="h-9 w-full rounded-md border border-navy-200 bg-white pl-9 pr-3 text-sm text-navy-900 placeholder:text-navy-400 focus:border-navy-400 focus:outline-none focus:ring-2 focus:ring-navy-100"
          />
        </form>

        <div className="flex items-center gap-1 rounded-md border border-navy-100 bg-white p-1">
          {STATUS_TABS.map((tab) => (
            <Link
              key={tab.value}
              href={buildQuery({ q, status: tab.value })}
              className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                status === tab.value
                  ? "bg-navy-900 text-white"
                  : "text-navy-600 hover:bg-navy-100"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        hasFilters ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-navy-200 bg-white py-16 text-center">
            <Search className="h-8 w-8 text-navy-300" />
            <p className="mt-3 text-sm font-medium text-navy-700">
              Tidak ada berita yang cocok
            </p>
            <p className="text-xs text-muted-foreground">
              Coba ubah kata kunci atau filter status.
            </p>
            <Link
              href="/admin/posts"
              className="mt-3 text-xs font-medium text-navy-600 underline-offset-2 hover:underline"
            >
              Hapus filter
            </Link>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-navy-200 bg-white py-16 text-center">
            <FileText className="h-8 w-8 text-navy-300" />
            <p className="mt-3 text-sm font-medium text-navy-700">
              Belum ada berita
            </p>
            <p className="text-xs text-muted-foreground">
              Klik “Tambah Berita” untuk membuat artikel pertama.
            </p>
          </div>
        )
      ) : (
        <div className="overflow-hidden rounded-xl border border-navy-100 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-100 bg-navy-50/50 text-left text-xs uppercase tracking-wide text-navy-500">
                <th className="px-4 py-3 font-semibold">Judul</th>
                <th className="px-4 py-3 font-semibold">Kategori</th>
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
                    <span className="flex items-center gap-1.5 font-medium text-navy-900">
                      {r.isFeatured && (
                        <Star className="h-3.5 w-3.5 fill-gold-400 text-gold-400" />
                      )}
                      {r.title}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {r.categoryName ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    {r.status === "published" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-100">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Terbit
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-navy-100 px-2 py-0.5 text-xs font-medium text-navy-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-navy-400" />
                        Draft
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        title={
                          r.status === "published"
                            ? "Lihat di situs"
                            : "Pratinjau (draft belum terbit)"
                        }
                        render={
                          <a href={`/${r.slug}`} target="_blank" rel="noopener">
                            <Eye className="h-3.5 w-3.5" />
                            Lihat
                          </a>
                        }
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        render={
                          <Link href={`/admin/posts/${r.id}/edit`}>
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </Link>
                        }
                      />
                      <ConfirmDelete
                        action={deletePostAction}
                        id={r.id}
                        title="Hapus berita?"
                        description={
                          <>
                            <span className="font-medium text-navy-900">
                              {r.title}
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
              href={buildQuery({ q, status, page: page - 1 })}
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
                href={buildQuery({ q, status, page: p })}
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
              href={buildQuery({ q, status, page: page + 1 })}
              className="flex h-9 w-9 items-center justify-center rounded-md text-sm text-navy-600 transition-colors hover:bg-navy-100"
              aria-label="Halaman berikutnya"
            >
              <ChevronRight className="h-4 w-4" />
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
