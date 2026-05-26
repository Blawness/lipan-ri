import { db } from "@/db";
import { media } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getMediaByAlbum(album: string) {
  return db
    .select()
    .from(media)
    .where(eq(media.album, album))
    .orderBy(media.uploadedAt);
}

export async function getAllAlbums() {
  const result = await db
    .selectDistinct({ album: media.album })
    .from(media);
  return result.map((r) => r.album).filter(Boolean) as string[];
}
