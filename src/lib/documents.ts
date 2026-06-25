import { db } from "@/db";
import { documents } from "@/db/schema";
import { eq } from "drizzle-orm";

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
    })
    .from(documents)
    .where(eq(documents.slug, slug))
    .limit(1);

  return results[0] ?? null;
}
