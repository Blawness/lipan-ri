import Link from "next/link";
import { requireUser } from "@/lib/auth-helpers";
import { listPostsAdmin } from "@/lib/admin/posts";
import { deletePostAction } from "./actions";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function PostsListPage() {
  await requireUser();
  const rows = await listPostsAdmin();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl font-bold text-navy-900">Berita</h1>
        <Button render={<Link href="/admin/posts/new">Tambah</Link>} />
      </div>
      <table className="w-full text-sm bg-white rounded-lg ring-1 ring-navy-100">
        <thead className="text-left text-muted-foreground">
          <tr className="border-b border-navy-100">
            <th className="p-3">Judul</th>
            <th className="p-3">Kategori</th>
            <th className="p-3">Status</th>
            <th className="p-3"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-navy-50">
              <td className="p-3 font-medium text-navy-900">{r.title}</td>
              <td className="p-3">{r.categoryName ?? "—"}</td>
              <td className="p-3">{r.status === "published" ? "Terbit" : "Draft"}</td>
              <td className="p-3 flex gap-2 justify-end">
                <Button size="sm" variant="outline" render={<Link href={`/admin/posts/${r.id}/edit`}>Edit</Link>} />
                <form action={deletePostAction}>
                  <input type="hidden" name="id" value={r.id} />
                  <Button size="sm" variant="outline" type="submit">Hapus</Button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
