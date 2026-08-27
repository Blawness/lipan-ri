"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@blawness/admin-kit/auth-helpers";
import { db } from "@/db";
import { signatories } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function createSignatoryAction(formData: FormData) {
  await requireUser();

  const raw = Object.fromEntries(formData);
  const data = z
    .object({
      name: z.string().min(1, "Nama wajib diisi"),
      title: z.string().optional(),
    })
    .parse(raw);

  await db.insert(signatories).values({
    name: data.name.trim(),
    title: data.title?.trim() || null,
  });

  revalidatePath("/admin/penandatangan");
}

export async function deleteSignatoryAction(formData: FormData) {
  await requireUser();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return;
  await db.delete(signatories).where(eq(signatories.id, id));
  revalidatePath("/admin/penandatangan");
}
