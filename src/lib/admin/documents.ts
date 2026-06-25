import { db } from "@/db";
import { documents } from "@/db/schema";
import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import { randomUUID } from "crypto";

function documentSlug(number: string): string {
  const base = number
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  const suffix = randomUUID().slice(0, 6);
  return `${base}-${suffix}`;
}

export type DocumentInput = {
  number: string;
  title: string;
  signatory: string;
  issuedAt: Date;
  fileUrl?: string | null;
  status?: "active" | "revoked";
};

export type ListDocumentsAdminParams = {
  q?: string;
  page?: number;
  pageSize?: number;
};

export async function listDocumentsAdmin({
  q,
  page = 1,
  pageSize = 15,
}: ListDocumentsAdminParams = {}) {
  const conditions = [];
  if (q && q.trim()) {
    const term = `%${q.trim()}%`;
    conditions.push(
      or(
        ilike(documents.title, term),
        ilike(documents.number, term),
        ilike(documents.signatory, term)
      )
    );
  }
  const where = conditions.length ? and(...conditions) : undefined;

  const safePage = Math.max(1, page);
  const offset = (safePage - 1) * pageSize;

  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: documents.id,
        number: documents.number,
        title: documents.title,
        signatory: documents.signatory,
        issuedAt: documents.issuedAt,
        status: documents.status,
        slug: documents.slug,
        viewCount: documents.viewCount,
        updatedAt: documents.updatedAt,
      })
      .from(documents)
      .where(where)
      .orderBy(desc(documents.updatedAt))
      .limit(pageSize)
      .offset(offset),
    db.select({ value: count() }).from(documents).where(where),
  ]);

  return { rows, total: Number(countResult[0]?.value ?? 0) };
}

export async function getDocumentById(id: number) {
  const [row] = await db
    .select()
    .from(documents)
    .where(eq(documents.id, id))
    .limit(1);
  return row ?? null;
}

export async function createDocument(input: DocumentInput) {
  const slug = documentSlug(input.number);
  const [row] = await db
    .insert(documents)
    .values({
      slug,
      number: input.number,
      title: input.title,
      signatory: input.signatory,
      issuedAt: input.issuedAt,
      fileUrl: input.fileUrl ?? null,
      status: input.status ?? "active",
    })
    .returning({ id: documents.id });
  return row.id;
}

export async function updateDocument(id: number, input: DocumentInput) {
  await db
    .update(documents)
    .set({
      number: input.number,
      title: input.title,
      signatory: input.signatory,
      issuedAt: input.issuedAt,
      fileUrl: input.fileUrl ?? null,
      status: input.status ?? "active",
      updatedAt: new Date(),
    })
    .where(eq(documents.id, id));
}

export async function revokeDocument(id: number, reason?: string) {
  await db
    .update(documents)
    .set({ status: "revoked", revokeReason: reason ?? null, updatedAt: new Date() })
    .where(eq(documents.id, id));
}

export async function deleteDocument(id: number) {
  await db.delete(documents).where(eq(documents.id, id));
}
