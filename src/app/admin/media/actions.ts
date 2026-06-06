"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth-helpers";
import { uploadImage, deleteObjectByUrl } from "@/lib/r2";
import { db } from "@/db";
import { media } from "@blawness/admin-kit/schema";
import { deleteMediaRow, getMediaById, countMediaReferences } from "@/lib/admin/media";

const MAX_BYTES = 8 * 1024 * 1024;
const OK_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function uploadImageAction(formData: FormData): Promise<{ url?: string; error?: string }> {
  await requireUser();
  const file = formData.get("file");
  if (!(file instanceof File)) return { error: "Tidak ada berkas." };
  if (!OK_TYPES.includes(file.type)) return { error: "Format gambar tidak didukung." };
  if (file.size > MAX_BYTES) return { error: "Ukuran gambar maksimal 8MB." };

  const buf = Buffer.from(await file.arrayBuffer());
  const keyBase = `uploads/${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  let url: string;
  try {
    // sharp (inside uploadImage) throws on data that isn't really an image,
    // e.g. a non-image file sent with a spoofed image MIME type.
    ({ url } = await uploadImage(buf, keyBase));
  } catch {
    return { error: "Gambar gagal diproses. Pastikan berkas benar-benar gambar." };
  }

  await db.insert(media).values({ url, altText: file.name });
  revalidatePath("/admin/media");
  return { url };
}

export async function deleteMediaAction(formData: FormData) {
  await requireUser();
  const id = Number(formData.get("id"));
  if (!id) return;

  const row = await getMediaById(id);
  if (!row) return;

  // Jangan hapus gambar yang masih dirujuk berita/banner — kalau dihapus,
  // objek R2-nya hilang dan situs live menampilkan gambar rusak.
  const refs = await countMediaReferences(row.url);
  if (refs > 0) {
    redirect(
      `/admin/media?error=${encodeURIComponent(
        `Gambar masih dipakai oleh ${refs} konten. Lepas dulu dari berita/banner sebelum menghapus.`
      )}`
    );
  }

  // Hapus objek R2 lebih dulu; bila gagal, biarkan melempar agar row DB tetap
  // ada dan operasi bisa diulang (hindari row hilang tapi objek menggantung).
  await deleteObjectByUrl(row.url);
  await deleteMediaRow(id);
  revalidatePath("/admin/media");
}
