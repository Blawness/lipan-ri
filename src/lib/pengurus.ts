import { db } from "@/db";
import { pengurus } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { SLOT_LABELS, type OrgMember } from "@/components/tentang-kami/org-flow";
import { mergeSlots } from "./pengurus-rules";

export type Pengurus = typeof pengurus.$inferSelect;

export async function getAllPengurus(): Promise<Pengurus[]> {
  return db.select().from(pengurus).orderBy(asc(pengurus.nama));
}

/** Peta slot → anggota untuk bagan. Setiap slot selalu ada (lihat mergeSlots). */
export async function getPengurusBySlot(): Promise<Record<string, OrgMember>> {
  const rows = await db.select().from(pengurus);
  return mergeSlots(SLOT_LABELS, rows);
}

export async function getPengurusBySlug(slug: string): Promise<Pengurus | null> {
  const [row] = await db
    .select()
    .from(pengurus)
    .where(eq(pengurus.slug, slug))
    .limit(1);
  return row ?? null;
}
