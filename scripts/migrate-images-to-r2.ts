import "dotenv/config";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { posts } from "../src/db/schema";
import { uploadImage, R2_PUBLIC_URL } from "@blawness/admin-kit";

/**
 * Migrasi gambar lokal di public/uploads/<slug>.<ext> ke Cloudflare R2.
 * Untuk tiap file: optimize + upload, lalu update posts.featured_image ke URL R2.
 * Aman dijalankan ulang (idempoten) — file yang sudah berupa URL R2 dilewati.
 */
async function main() {
  if (!R2_PUBLIC_URL) {
    throw new Error(
      "R2_PUBLIC_URL belum di-set. Isi .env dulu (lihat instruksi) sebelum migrasi."
    );
  }

  const dir = path.join(process.cwd(), "public", "uploads");
  const files = await readdir(dir);
  console.log(`📦 Menemukan ${files.length} file di public/uploads`);

  for (const file of files) {
    const slug = file.replace(/\.[^.]+$/, "");
    const row = await db
      .select({ id: posts.id, featuredImage: posts.featuredImage })
      .from(posts)
      .where(eq(posts.slug, slug))
      .limit(1);

    if (row.length === 0) {
      console.warn(`⚠️  Lewati ${file} — tidak ada post dengan slug "${slug}"`);
      continue;
    }
    if (row[0].featuredImage?.startsWith("http")) {
      console.log(`⏭️  ${slug} sudah pakai URL remote, dilewati`);
      continue;
    }

    const buf = await readFile(path.join(dir, file));
    const { url, size } = await uploadImage(buf, `berita/${slug}`);
    await db
      .update(posts)
      .set({ featuredImage: url })
      .where(eq(posts.id, row[0].id));

    console.log(`✅ ${slug} → ${url} (${(size / 1024).toFixed(0)} KB)`);
  }

  console.log("🎉 Selesai.");
  process.exit(0);
}

main().catch((e) => {
  console.error("❌ Migrasi gagal:", e);
  process.exit(1);
});
