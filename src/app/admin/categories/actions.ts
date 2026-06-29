"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission } from "@blawness/admin-kit/auth-helpers";
import { isUniqueViolation, isForeignKeyViolation } from "@blawness/admin-kit";
import { createCategory, updateCategory, deleteCategory } from "@/lib/admin/categories";

export async function createCategoryAction(formData: FormData) {
  await requirePermission("categories.create");
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
  await requirePermission("categories.update");
  const id = Number(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  if (!id || !name) return;
  await updateCategory(id, name, String(formData.get("description") ?? "") || null);
  revalidatePath("/admin/categories");
}

export async function deleteCategoryAction(formData: FormData) {
  await requirePermission("categories.delete");
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
