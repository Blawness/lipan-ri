import { db } from "@/db";
import { documents } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function getDocumentBySlug(slug: string) {
  const results = await db
    .select({
      id: documents.id,
      slug: documents.slug,
      number: documents.number,
      title: documents.title,
      signatory: documents.signatory,
      issuedAt: documents.issuedAt,
      status: documents.status,
      revokeReason: documents.revokeReason,
      showDocument: documents.showDocument,
      fileUrl: documents.fileUrl,
    })
    .from(documents)
    .where(eq(documents.slug, slug))
    .limit(1);

  return results[0] ?? null;
}

export async function getDocumentBySlugAndIncrement(slug: string) {
  // Fetch + atomically bump view_count
  const results = await db
    .update(documents)
    .set({ viewCount: sql`${documents.viewCount} + 1` })
    .where(eq(documents.slug, slug))
    .returning({
      id: documents.id,
      slug: documents.slug,
      number: documents.number,
      title: documents.title,
      signatory: documents.signatory,
      issuedAt: documents.issuedAt,
      status: documents.status,
      revokeReason: documents.revokeReason,
      showDocument: documents.showDocument,
      fileUrl: documents.fileUrl,
    });

  return results[0] ?? null;
}
