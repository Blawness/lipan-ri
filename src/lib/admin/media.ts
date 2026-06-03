import { db } from "@/db";
import { media } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export async function listMedia() {
  return db.select().from(media).orderBy(desc(media.uploadedAt));
}

export async function deleteMediaRow(id: number) {
  await db.delete(media).where(eq(media.id, id));
}
