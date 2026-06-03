import { requireAdmin } from "@/lib/auth-helpers";
import { listCategories } from "@/lib/admin/categories";
import { createCategoryAction, deleteCategoryAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  await requireAdmin();
  const rows = await listCategories();

  return (
    <div className="max-w-2xl">
      <h1 className="font-heading text-2xl font-bold text-navy-900 mb-6">Kategori</h1>

      <form action={createCategoryAction} className="flex gap-2 mb-6">
        <Input name="name" placeholder="Nama kategori" required />
        <Input name="description" placeholder="Deskripsi (opsional)" />
        <Button type="submit">Tambah</Button>
      </form>

      <ul className="bg-white rounded-lg ring-1 ring-navy-100 divide-y divide-navy-50">
        {rows.map((c) => (
          <li key={c.id} className="flex items-center justify-between p-3">
            <div>
              <p className="font-medium text-navy-900">{c.name}</p>
              <p className="text-xs text-muted-foreground">/{c.slug}</p>
            </div>
            <form action={deleteCategoryAction}>
              <input type="hidden" name="id" value={c.id} />
              <Button size="sm" variant="outline" type="submit">Hapus</Button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
