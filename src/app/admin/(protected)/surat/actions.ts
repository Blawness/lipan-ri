"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requirePermission, requireUserId } from "@blawness/admin-kit/auth-helpers";
import type { AdminSessionUser } from "@blawness/admin-kit";
import { sanitizeSuratHtml } from "@/lib/sanitize";
import { canEdit, canSubmit } from "@/lib/surat/status";
import {
  createLetter,
  updateLetter,
  deleteLetter,
  submitLetter,
  createLetterLog,
  getLetterDetail,
  rejectLetter,
  type LetterInput,
} from "@/lib/admin/letters";
import { getTemplateById } from "@/lib/admin/letter-templates";
import { issueLetter, renderAndAttachPdf } from "@/lib/surat/issue";

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

/**
 * Menyesuaikan `fieldValues` dengan definisi field jenis surat saat ini:
 * kunci yang tidak lagi dikenal template dibuang (mis. field yang sudah
 * dihapus/diganti nama pada template), dan saat `enforceRequired` field
 * wajib yang kosong digagalkan di server — bukan hanya mengandalkan atribut
 * `required` di browser, yang bisa dilewati dengan POST langsung ke action.
 */
async function reconcileFieldValues(
  templateId: number,
  values: Record<string, string>,
  { enforceRequired }: { enforceRequired: boolean }
): Promise<{ fieldValues: Record<string, string> } | { error: string }> {
  const template = await getTemplateById(templateId);
  if (!template) return { error: "Jenis surat tidak ditemukan." };

  const filtered: Record<string, string> = {};
  for (const field of template.fields) {
    if (field.key in values) filtered[field.key] = values[field.key];
  }

  if (enforceRequired) {
    for (const field of template.fields) {
      if (field.required && !(filtered[field.key] ?? "").trim()) {
        return { error: `Field "${field.label}" wajib diisi.` };
      }
    }
  }

  return { fieldValues: filtered };
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
  const intent = formData.get("intent");
  const reconciled = await reconcileFieldValues(input.templateId, input.fieldValues, {
    enforceRequired: intent === "submit",
  });
  if ("error" in reconciled) return { error: reconciled.error };
  input.fieldValues = reconciled.fieldValues;

  const actorId = await requireUserId();
  const id = await createLetter(input, actorId);
  await createLetterLog(id, actorId, "created");

  if (intent === "submit") {
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
  const intent = formData.get("intent");
  const reconciled = await reconcileFieldValues(input.templateId, input.fieldValues, {
    enforceRequired: intent === "submit",
  });
  if ("error" in reconciled) return { error: reconciled.error };
  input.fieldValues = reconciled.fieldValues;

  const actorId = await requireUserId();
  await updateLetter(id, input);
  await createLetterLog(id, actorId, "updated");

  if (intent === "submit") {
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

export type IssueFormState = { error?: string };

export async function issueLetterAction(
  id: number,
  _prev: IssueFormState,
  formData: FormData
): Promise<IssueFormState> {
  const session = await requirePermission("letters.issue");
  const user = session.user as AdminSessionUser;
  const result = await issueLetter(
    id,
    { userId: Number(user.id), role: user.role },
    String(formData.get("number") ?? "")
  );
  if (!result.ok) return { error: result.error };

  revalidatePath("/admin/surat");
  revalidatePath("/admin/dokumen");
  redirect(`/admin/surat/${id}?saved=${result.pdfFailed ? "issued-nopdf" : "issued"}`);
}

export async function rejectLetterAction(
  id: number,
  _prev: IssueFormState,
  formData: FormData
): Promise<IssueFormState> {
  await requirePermission("letters.issue");
  const note = String(formData.get("note") ?? "").trim();
  if (note.length === 0) return { error: "Catatan penolakan wajib diisi." };

  const current = await getLetterDetail(id);
  if (!current || current.status !== "submitted") {
    return { error: "Surat ini tidak sedang menunggu pengesahan." };
  }
  const actorId = await requireUserId();
  await rejectLetter(id, note);
  await createLetterLog(id, actorId, "rejected", note);
  revalidatePath(`/admin/surat/${id}`);
  redirect(`/admin/surat/${id}?saved=rejected`);
}

export async function renderPdfAction(id: number): Promise<void> {
  await requirePermission("letters.issue");
  await renderAndAttachPdf(id);
  revalidatePath(`/admin/surat/${id}`);
}
