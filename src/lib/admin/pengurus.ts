import { db } from "@/db";
import { pengurus } from "@/db/schema";
import { eq } from "drizzle-orm";
import { nextNomorAnggota } from "@/lib/pengurus-rules";

export interface PengurusInput {
  slot: string | null;
  slug: string;
  nomorAnggota: string;
  nama: string;
  jabatan: string;
  foto: string | null;
  deskripsi: string | null;
  email: string | null;
  telepon: string | null;
  status: "aktif" | "nonaktif";
  mulaiMenjabat: Date;
  selesaiMenjabat: Date | null;
}

export async function getPengurusById(id: number) {
  const [row] = await db
    .select()
    .from(pengurus)
    .where(eq(pengurus.id, id))
    .limit(1);
  return row ?? null;
}

/** Nomor anggota usulan untuk form "baru". */
export async function suggestNomorAnggota(): Promise<string> {
  const rows = await db.select({ nomor: pengurus.nomorAnggota }).from(pengurus);
  return nextNomorAnggota(
    rows.map((r) => r.nomor),
    new Date().getFullYear(),
  );
}

export async function createPengurus(input: PengurusInput): Promise<number> {
  const [row] = await db
    .insert(pengurus)
    .values(input)
    .returning({ id: pengurus.id });
  return row.id;
}

export async function updatePengurus(id: number, input: PengurusInput) {
  await db
    .update(pengurus)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(pengurus.id, id));
}

export async function deletePengurus(id: number) {
  await db.delete(pengurus).where(eq(pengurus.id, id));
}
