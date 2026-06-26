"use server";

import { uploadImageAction } from "@blawness/admin-kit/screens/media/actions";

const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

export async function uploadDocumentFileAction(
  formData: FormData
): Promise<{ url?: string; error?: string }> {
  // admin-kit v0.7.1 ImageUpload doesn't forward allowedTypes to the server action,
  // so we inject them here before delegation.
  formData.set("allowedTypes", ALLOWED_TYPES.join(","));
  formData.set("maxBytes", String(16 * 1024 * 1024));
  return uploadImageAction(formData);
}
