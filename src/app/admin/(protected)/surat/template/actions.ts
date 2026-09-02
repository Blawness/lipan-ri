"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requirePermission } from "@blawness/admin-kit/auth-helpers";
import { sanitizeSuratHtml } from "@/lib/sanitize";
import {
  createTemplate,
  updateTemplate,
  type TemplateInput,
} from "@/lib/admin/letter-templates";

const fieldSchema = z.object({
  key: z.string().regex(/^[a-z][a-z0-9_]*$/, "Key field harus huruf kecil tanpa spasi"),
  label: z.string().min(1),
  type: z.enum(["text", "textarea", "date", "number"]),
  required: z.boolean(),
});

const schema = z.object({
  code: z.string().min(1, "Kode wajib diisi").max(10),
  name: z.string().min(1, "Nama jenis surat wajib diisi"),
  numberPattern: z.string().min(1, "Pola nomor wajib diisi"),
  bodyDefault: z.string().default(""),
  fields: z
    .array(fieldSchema)
    .max(20)
    .refine((fields) => new Set(fields.map((f) => f.key)).size === fields.length, {
      message: "Key field tidak boleh sama",
    }),
  isActive: z.boolean(),
});

export type TemplateFormState = { error?: string };

function parse(formData: FormData): TemplateInput {
  let fields: unknown = [];
  try {
    fields = JSON.parse(String(formData.get("fields") || "[]"));
  } catch {
    throw new z.ZodError([
      { code: "custom", path: ["fields"], message: "Daftar field tidak valid." },
    ]);
  }
  const data = schema.parse({
    code: formData.get("code"),
    name: formData.get("name"),
    numberPattern: formData.get("numberPattern"),
    bodyDefault: formData.get("bodyDefault") ?? "",
    fields,
    isActive: formData.get("isActive") === "on" || formData.get("isActive") === "true",
  });
  return { ...data, bodyDefault: sanitizeSuratHtml(data.bodyDefault) };
}

export async function createTemplateAction(
  _prev: TemplateFormState,
  formData: FormData
): Promise<TemplateFormState> {
  await requirePermission("letterTemplates.manage");
  let input: TemplateInput;
  try {
    input = parse(formData);
  } catch (e) {
    return { error: e instanceof z.ZodError ? e.issues[0].message : "Data tidak valid." };
  }
  await createTemplate(input);
  revalidatePath("/admin/surat/template");
  redirect("/admin/surat/template?saved=created");
}

export async function updateTemplateAction(
  id: number,
  _prev: TemplateFormState,
  formData: FormData
): Promise<TemplateFormState> {
  await requirePermission("letterTemplates.manage");
  let input: TemplateInput;
  try {
    input = parse(formData);
  } catch (e) {
    return { error: e instanceof z.ZodError ? e.issues[0].message : "Data tidak valid." };
  }
  await updateTemplate(id, input);
  revalidatePath("/admin/surat/template");
  redirect("/admin/surat/template?saved=updated");
}

