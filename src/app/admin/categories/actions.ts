"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-helpers";
import { createCategory, updateCategory, deleteCategory } from "@/lib/admin/categories";

export async function createCategoryAction(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  await createCategory(name, String(formData.get("description") ?? "") || null);
  revalidatePath("/admin/categories");
}

export async function updateCategoryAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  if (!id || !name) return;
  await updateCategory(id, name, String(formData.get("description") ?? "") || null);
  revalidatePath("/admin/categories");
}

export async function deleteCategoryAction(formData: FormData) {
  await requireAdmin();
  await deleteCategory(Number(formData.get("id")));
  revalidatePath("/admin/categories");
}
