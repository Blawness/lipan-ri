import { requirePermission } from "@blawness/admin-kit/auth-helpers";
import { listCategories } from "@/lib/admin/categories";
import { createCategoryAction, deleteCategoryAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDelete } from "@blawness/admin-kit/components";
import { Plus, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requirePermission("categories.read");
  const rows = await listCategories();
  const { error } = await searchParams;

  return (
    <div className="max-w-2xl">
      <h1 className="font-heading text-2xl font-bold text-navy-900">Kategori</h1>
      <p className="mt-1 text-sm text-muted-foreground">{rows.length} kategori</p>

      {error && (
        <p className="mt-4 flex items-center gap-1.5 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600 ring-1 ring-red-100" role="alert">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      <form
        action={createCategoryAction}
        className="mt-6 flex flex-wrap gap-2 rounded-xl border border-navy-100 bg-white p-4 shadow-sm"
      >
        <Input name="name" placeholder="Nama kategori" required className="min-w-40 flex-1" />
        <Input name="description" placeholder="Deskripsi (opsional)" className="min-w-40 flex-1" />
        <Button type="submit">
          <Plus className="h-4 w-4" />
          Tambah
        </Button>
      </form>

      <ul className="mt-6 divide-y divide-navy-50 overflow-hidden rounded-xl border border-navy-100 bg-white shadow-sm">
        {rows.map((c) => (
          <li key={c.id} className="flex items-center justify-between p-3 transition-colors hover:bg-navy-50/40">
            <div>
              <p className="font-medium text-navy-900">{c.name}</p>
              <p className="text-xs text-muted-foreground">/{c.slug}</p>
            </div>
            <ConfirmDelete
              action={deleteCategoryAction}
              id={c.id}
              title="Hapus kategori?"
              description={
                <>
                  Kategori <span className="font-medium text-navy-900">{c.name}</span> akan dihapus.
                </>
              }
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
