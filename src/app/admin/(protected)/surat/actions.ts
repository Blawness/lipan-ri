"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requirePermission, requireUserId } from "@blawness/admin-kit/auth-helpers";
import { sanitizeSuratHtml } from "@/lib/sanitize";
import { canEdit, canSubmit } from "@/lib/surat/status";
import {
  createLetter,
  updateLetter,
  deleteLetter,
  submitLetter,
  createLetterLog,
  getLetterDetail,
  type LetterInput,
} from "@/lib/admin/letters";

const schema = z.object({
  templateId: z.coerce.number().int().positive(),
  subject: z.string().min(1, "Perihal wajib diisi"),
  bodyHtml: z.string().default(""),
  signatoryId: z.coerce.number().int().positive("Penandatangan wajib dipilih"),
  fieldValues: z.record(z.string(), z.string()).default({}),
});

export type LetterFormState = { error?: string };

function parse(formData: FormData): LetterInput {
  let fieldValues: unknown = {};
  try {
    fieldValues = JSON.parse(String(formData.get("fieldValues") || "{}"));
  } catch {
    throw new z.ZodError([
      { code: "custom", path: ["fieldValues"], message: "Isian tambahan tidak valid." },
    ]);
  }
  const data = schema.parse({
    templateId: formData.get("templateId"),
    subject: formData.get("subject"),
    bodyHtml: formData.get("bodyHtml") ?? "",
    signatoryId: formData.get("signatoryId"),
    fieldValues,
  });
  return { ...data, bodyHtml: sanitizeSuratHtml(data.bodyHtml) };
}

export async function createLetterAction(
  _prev: LetterFormState,
  formData: FormData
): Promise<LetterFormState> {
  await requirePermission("letters.write");
  let input: LetterInput;
  try {
    input = parse(formData);
  } catch (e) {
    return { error: e instanceof z.ZodError ? e.issues[0].message : "Data tidak valid." };
  }
  const actorId = await requireUserId();
  const id = await createLetter(input, actorId);
  await createLetterLog(id, actorId, "created");

  if (formData.get("intent") === "submit") {
    await requirePermission("letters.submit");
    await submitLetter(id);
    await createLetterLog(id, actorId, "submitted");
  }
  revalidatePath("/admin/surat");
  redirect(`/admin/surat/${id}?saved=created`);
}

export async function updateLetterAction(
  id: number,
  _prev: LetterFormState,
  formData: FormData
): Promise<LetterFormState> {
  await requirePermission("letters.write");
  const current = await getLetterDetail(id);
  if (!current) return { error: "Surat tidak ditemukan." };
  if (!canEdit(current.status)) return { error: "Surat ini tidak bisa disunting lagi." };

  let input: LetterInput;
  try {
    input = parse(formData);
  } catch (e) {
    return { error: e instanceof z.ZodError ? e.issues[0].message : "Data tidak valid." };
  }
  const actorId = await requireUserId();
  await updateLetter(id, input);
  await createLetterLog(id, actorId, "updated");

  if (formData.get("intent") === "submit") {
    await requirePermission("letters.submit");
    if (!canSubmit(current.status)) return { error: "Surat ini sudah diajukan." };
    await submitLetter(id);
    await createLetterLog(id, actorId, "submitted");
  }
  revalidatePath("/admin/surat");
  redirect(`/admin/surat/${id}?saved=updated`);
}

export async function submitLetterAction(id: number): Promise<void> {
  await requirePermission("letters.submit");
  const current = await getLetterDetail(id);
  if (!current || !canSubmit(current.status)) return;
  const actorId = await requireUserId();
  await submitLetter(id);
  await createLetterLog(id, actorId, "submitted");
  revalidatePath("/admin/surat");
  revalidatePath(`/admin/surat/${id}`);
}

export async function deleteLetterAction(id: number): Promise<void> {
  await requirePermission("letters.write");
  const current = await getLetterDetail(id);
  // Hanya draft yang boleh dihapus — surat yang sudah diajukan atau terbit
  // harus tetap bisa dijelaskan jejaknya.
  if (!current || !canEdit(current.status)) return;
  await deleteLetter(id);
  revalidatePath("/admin/surat");
  redirect("/admin/surat?saved=deleted");
}
