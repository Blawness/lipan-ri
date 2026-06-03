import Link from "next/link";
import { requireUser } from "@/lib/auth-helpers";
import { listPostsAdmin } from "@/lib/admin/posts";
import { deletePostAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Star, FileText } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PostsListPage() {
  await requireUser();
  const rows = await listPostsAdmin();

  return (
    <div className="max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-navy-900">Berita</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {rows.length} artikel
          </p>
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

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-navy-200 bg-white py-16 text-center">
          <FileText className="h-8 w-8 text-navy-300" />
          <p className="mt-3 text-sm font-medium text-navy-700">Belum ada berita</p>
          <p className="text-xs text-muted-foreground">
            Klik “Tambah Berita” untuk membuat artikel pertama.
          </p>
        </div>
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
                        variant="outline"
                        render={
                          <Link href={`/admin/posts/${r.id}/edit`}>
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </Link>
                        }
                      />
                      <form action={deletePostAction}>
                        <input type="hidden" name="id" value={r.id} />
                        <Button size="sm" variant="outline" type="submit" aria-label="Hapus">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
