"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requirePermission } from "@blawness/admin-kit/auth-helpers";
import { db } from "@/db";
import { signatories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isForeignKeyViolation } from "@/lib/db-errors";

export async function createSignatoryAction(formData: FormData) {
  await requirePermission("signatories.manage");

  const raw = Object.fromEntries(formData);
  const data = z
    .object({
      name: z.string().min(1, "Nama wajib diisi"),
      title: z.string().optional(),
      position: z.string().optional(),
      userId: z.string().optional(),
    })
    .parse(raw);

  await db.insert(signatories).values({
    name: data.name.trim(),
    title: data.title?.trim() || null,
    position: data.position?.trim() || null,
    userId: data.userId ? Number(data.userId) : null,
  });

  revalidatePath("/admin/penandatangan");
}

export async function updateSignatoryAction(formData: FormData) {
  await requirePermission("signatories.manage");

  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return;

  const data = z
    .object({
      position: z.string().optional(),
      userId: z.string().optional(),
    })
    .parse(Object.fromEntries(formData));

  await db
    .update(signatories)
    .set({
      position: data.position?.trim() || null,
      userId: data.userId ? Number(data.userId) : null,
    })
    .where(eq(signatories.id, id));

  revalidatePath("/admin/penandatangan");
}

export async function deleteSignatoryAction(formData: FormData) {
  await requirePermission("signatories.manage");
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return;

  try {
    await db.delete(signatories).where(eq(signatories.id, id));
  } catch (e) {
    // `letters.signatoryId` punya FK `ON DELETE restrict` — penandatangan
    // yang masih dirujuk surat mana pun (termasuk draft) tidak boleh
    // dihapus. Gagalkan dengan pesan yang bisa dibaca, bukan 500 mentah.
    if (isForeignKeyViolation(e)) {
      revalidatePath("/admin/penandatangan");
      redirect("/admin/penandatangan?saved=delete-blocked");
    }
    throw e;
  }

  revalidatePath("/admin/penandatangan");
}
