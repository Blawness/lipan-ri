"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUserId } from "@blawness/admin-kit/auth-helpers";
// Diimpor sebagai nilai yang dipakai (bukan `import "@/rbac"`): registrasi RBAC
// dari layout tidak selalu ikut ke graf modul server action.
import { rbac } from "@/rbac";
import {
  createDocument,
  updateDocument,
  revokeDocument,
  deleteDocument,
  createDocumentLog,
  type DocumentInput,
} from "@/lib/admin/documents";

const schema = z.object({
  number: z.string().min(1, "Nomor surat wajib diisi"),
  title: z.string().min(1, "Perihal wajib diisi"),
  signatory: z.string().min(1, "Nama penandatangan wajib diisi"),
  issuedAt: z.string().min(1, "Tanggal terbit wajib diisi"),
  fileUrl: z.string().optional(),
  status: z.enum(["active", "revoked"]).optional(),
  showDocument: z.coerce.boolean().optional(),
});

export type DocumentFormState = { error?: string; ok?: boolean };

// Form di dalam modal mengirim `_modal`: modal yang menutup dirinya sendiri,
// jadi jangan redirect (status "terbuka" modal hidup di store dan tidak ikut
// ter-reset oleh navigasi). Halaman penuh (/baru, /[id]/edit) tetap redirect.
function isModal(formData: FormData) {
  return formData.get("_modal") === "1";
}

function parse(formData: FormData): DocumentInput {
  const data = schema.parse({
    number: formData.get("number"),
    title: formData.get("title"),
    signatory: formData.get("signatory"),
    issuedAt: formData.get("issuedAt"),
    fileUrl: formData.get("fileUrl") || undefined,
    status: formData.get("status") || undefined,
    showDocument: formData.get("showDocument") || undefined,
  });
  return {
    number: data.number,
    title: data.title,
    signatory: data.signatory,
    issuedAt: new Date(data.issuedAt),
    fileUrl: data.fileUrl ?? null,
    status: data.status as "active" | "revoked" | undefined,
    showDocument: data.showDocument ?? false,
  };
}

export async function createDocumentAction(
  _prev: DocumentFormState,
  formData: FormData
): Promise<DocumentFormState> {
  await rbac.requirePermission("documents.manage");
  let input: DocumentInput;
  try {
    input = parse(formData);
  } catch (e) {
    return {
      error: e instanceof z.ZodError ? e.issues[0].message : "Data tidak valid.",
    };
  }
  const docId = await createDocument(input);
  const actorId = await requireUserId();
  await createDocumentLog(docId, actorId, "created");
  revalidatePath("/admin/dokumen");
  if (isModal(formData)) return { ok: true };
  redirect("/admin/dokumen?saved=created");
}

export async function updateDocumentAction(
  id: number,
  _prev: DocumentFormState,
  formData: FormData
): Promise<DocumentFormState> {
  await rbac.requirePermission("documents.manage");
  let input: DocumentInput;
  try {
    input = parse(formData);
  } catch (e) {
    return {
      error: e instanceof z.ZodError ? e.issues[0].message : "Data tidak valid.",
    };
  }
  await updateDocument(id, input);
  const actorId = await requireUserId();
  await createDocumentLog(id, actorId, "updated");
  revalidatePath("/admin/dokumen");
  if (isModal(formData)) return { ok: true };
  redirect("/admin/dokumen?saved=updated");
}

export async function revokeDocumentAction(formData: FormData) {
  await rbac.requirePermission("documents.manage");
  const actorId = await requireUserId();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return;
  const reason = formData.get("revokeReason")?.toString()?.trim() || undefined;
  await revokeDocument(id, reason);
  await createDocumentLog(id, actorId, "revoked", reason);
  revalidatePath("/admin/dokumen");
}

export async function deleteDocumentAction(formData: FormData) {
  await rbac.requirePermission("documents.manage");
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return;
  await deleteDocument(id);
  revalidatePath("/admin/dokumen");
}
