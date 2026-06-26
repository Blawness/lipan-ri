"use server";

import { Buffer } from "node:buffer";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { requireUser } from "@blawness/admin-kit/auth-helpers";

const OK_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];
const MAX_BYTES = 16 * 1024 * 1024;

const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});
const R2_BUCKET = process.env.R2_BUCKET ?? "lipan-ri";
const R2_PUBLIC_URL = (process.env.R2_PUBLIC_URL ?? "").replace(/\/$/, "");

export async function uploadDocumentAction(
  formData: FormData
): Promise<{ url?: string; error?: string }> {
  await requireUser();

  const file = formData.get("file");
  if (!(file instanceof File)) return { error: "Tidak ada berkas." };
  if (!OK_TYPES.includes(file.type))
    return { error: "Format tidak didukung — gunakan PDF, JPG, PNG, atau WebP." };
  if (file.size > MAX_BYTES)
    return { error: "Ukuran file maksimal 16MB." };

  const ext = file.type === "application/pdf" ? ".pdf" : ".jpg";
  const contentType = file.type;
  const keyBase = `uploads/${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  try {
    const buf = Buffer.from(await file.arrayBuffer());
    const key = `${keyBase}${ext}`;

    await r2.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        Body: buf,
        ContentType: contentType,
        CacheControl: "public, max-age=31536000, immutable",
      })
    );

    return { url: `${R2_PUBLIC_URL}/${key}` };
  } catch {
    return { error: "Gagal mengunggah berkas." };
  }
}
