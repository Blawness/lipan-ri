"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
// `rbac` diimpor sebagai nilai yang benar-benar dipakai, bukan sekadar
// `import "@/rbac"`: server action hidup di graf modul tersendiri, dan
// registrasi RBAC dari layout/instrumentation tidak selalu ikut ke sana —
// gejalanya "RBAC not configured" saat aksi jalan di instance yang dingin.
import { rbac } from "@/rbac";
import { isUniqueViolation, isForeignKeyViolation } from "@blawness/admin-kit";
import { createCategory, updateCategory, deleteCategory } from "@/lib/admin/categories";

export async function createCategoryAction(formData: FormData) {
  await rbac.requirePermission("categories.create");
  const name = String(formData.get("name") ?? "").trim();
  if (!name) redirect("/admin/categories?error=Nama+kategori+wajib+diisi");
  try {
    await createCategory(name, String(formData.get("description") ?? "") || null);
  } catch (e) {
    if (isUniqueViolation(e)) {
      redirect("/admin/categories?error=Kategori+dengan+nama+serupa+sudah+ada");
    }
    throw e;
  }
  revalidatePath("/admin/categories");
}

export async function updateCategoryAction(formData: FormData) {
  await rbac.requirePermission("categories.update");
  const id = Number(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  if (!id || !name) return;
  await updateCategory(id, name, String(formData.get("description") ?? "") || null);
  revalidatePath("/admin/categories");
}

export async function deleteCategoryAction(formData: FormData) {
  await rbac.requirePermission("categories.delete");
  const id = Number(formData.get("id"));
  if (!id) return;
  try {
    await deleteCategory(id);
  } catch (e) {
    if (isForeignKeyViolation(e)) {
      redirect("/admin/categories?error=Kategori+masih+dipakai+oleh+berita");
    }
    throw e;
  }
  revalidatePath("/admin/categories");
}
