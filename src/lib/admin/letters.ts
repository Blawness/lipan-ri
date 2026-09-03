import { db } from "@/db";
import { letters, letterLogs, letterTemplates, signatories, documents } from "@/db/schema";
import { and, count, desc, eq, ilike, max, or } from "drizzle-orm";

export type LetterInput = {
  templateId: number;
  subject: string;
  bodyHtml: string;
  fieldValues: Record<string, string>;
  signatoryId: number;
};

export type LetterStatusFilter = "all" | "draft" | "submitted" | "issued";

export async function listLettersAdmin({
  q,
  status = "all",
  page = 1,
  pageSize = 15,
}: {
  q?: string;
  status?: LetterStatusFilter;
  page?: number;
  pageSize?: number;
} = {}) {
  const conditions = [];
  if (q && q.trim()) {
    const term = `%${q.trim()}%`;
    conditions.push(or(ilike(letters.subject, term), ilike(letters.number, term)));
  }
  if (status !== "all") conditions.push(eq(letters.status, status));
  const where = conditions.length ? and(...conditions) : undefined;

  const safePage = Math.max(1, page);
  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: letters.id,
        subject: letters.subject,
        number: letters.number,
        status: letters.status,
        updatedAt: letters.updatedAt,
        templateName: letterTemplates.name,
        signatoryName: signatories.name,
        documentStatus: documents.status,
        documentSlug: documents.slug,
      })
      .from(letters)
      .innerJoin(letterTemplates, eq(letters.templateId, letterTemplates.id))
      .innerJoin(signatories, eq(letters.signatoryId, signatories.id))
      .leftJoin(documents, eq(letters.documentId, documents.id))
      .where(where)
      .orderBy(desc(letters.updatedAt))
      .limit(pageSize)
      .offset((safePage - 1) * pageSize),
    db.select({ value: count() }).from(letters).where(where),
  ]);

  return { rows, total: Number(countResult[0]?.value ?? 0) };
}

export async function getLetterDetail(id: number) {
  const [row] = await db
    .select({
      id: letters.id,
      templateId: letters.templateId,
      subject: letters.subject,
      bodyHtml: letters.bodyHtml,
      fieldValues: letters.fieldValues,
      signatoryId: letters.signatoryId,
      status: letters.status,
      number: letters.number,
      numberSeq: letters.numberSeq,
      numberYear: letters.numberYear,
      documentId: letters.documentId,
      rejectionNote: letters.rejectionNote,
      createdBy: letters.createdBy,
      createdAt: letters.createdAt,
      updatedAt: letters.updatedAt,
      templateName: letterTemplates.name,
      templateCode: letterTemplates.code,
      templateFields: letterTemplates.fields,
      numberPattern: letterTemplates.numberPattern,
      signatoryName: signatories.name,
      signatoryTitle: signatories.title,
      signatoryPosition: signatories.position,
      signatoryUserId: signatories.userId,
      documentSlug: documents.slug,
      documentStatus: documents.status,
      documentFileUrl: documents.fileUrl,
      documentIssuedAt: documents.issuedAt,
    })
    .from(letters)
    .innerJoin(letterTemplates, eq(letters.templateId, letterTemplates.id))
    .innerJoin(signatories, eq(letters.signatoryId, signatories.id))
    .leftJoin(documents, eq(letters.documentId, documents.id))
    .where(eq(letters.id, id))
    .limit(1);
  return row ?? null;
}

export type LetterDetail = NonNullable<Awaited<ReturnType<typeof getLetterDetail>>>;
export type LetterListRow = Awaited<ReturnType<typeof listLettersAdmin>>["rows"][number];

export async function createLetter(input: LetterInput, createdBy: number): Promise<number> {
  const [row] = await db
    .insert(letters)
    .values({ ...input, createdBy })
    .returning({ id: letters.id });
  return row.id;
}

export async function updateLetter(id: number, input: LetterInput): Promise<void> {
  await db.update(letters).set({ ...input, updatedAt: new Date() }).where(eq(letters.id, id));
}

export async function deleteLetter(id: number): Promise<void> {
  await db.delete(letters).where(eq(letters.id, id));
}

export async function submitLetter(id: number): Promise<void> {
  await db
    .update(letters)
    .set({ status: "submitted", rejectionNote: null, updatedAt: new Date() })
    .where(eq(letters.id, id));
}

/**
 * Menarik kembali pengajuan ke draft atas permintaan pembuatnya. Dijaga
 * dengan `status = "submitted"` di WHERE, alasan yang sama seperti
 * `rejectLetter`: kalau penandatangan keburu mengesahkan di antara pembacaan
 * dan penulisan ini, surat sudah punya nomor dan dokumen publik — tarikan itu
 * harus gagal, bukan menang balapan.
 *
 * `rejectionNote` tidak disentuh: `submitLetter` sudah mengosongkannya saat
 * diajukan, jadi tidak ada catatan penolakan basi yang bisa tertinggal.
 */
export async function withdrawLetter(id: number): Promise<boolean> {
  const updated = await db
    .update(letters)
    .set({ status: "draft", updatedAt: new Date() })
    .where(and(eq(letters.id, id), eq(letters.status, "submitted")))
    .returning({ id: letters.id });
  return updated.length > 0;
}

/**
 * Menolak surat kembali ke draft. Dijaga dengan `status = "submitted"` supaya
 * surat yang sudah disahkan orang lain di antara pembacaan dan penulisan ini
 * tidak ikut ditarik balik ke draft — nomor, `numberSeq`, dan `documentId`-nya
 * sudah terlanjur dipakai dokumen publik yang aktif.
 */
export async function rejectLetter(id: number, note: string): Promise<boolean> {
  const updated = await db
    .update(letters)
    .set({ status: "draft", rejectionNote: note, updatedAt: new Date() })
    .where(and(eq(letters.id, id), eq(letters.status, "submitted")))
    .returning({ id: letters.id });
  return updated.length > 0;
}

export async function getLetterLogs(letterId: number) {
  return db
    .select()
    .from(letterLogs)
    .where(eq(letterLogs.letterId, letterId))
    .orderBy(desc(letterLogs.createdAt));
}

export async function createLetterLog(
  letterId: number,
  actorId: number,
  action: "created" | "updated" | "submitted" | "rejected" | "issued" | "withdrawn",
  note?: string
): Promise<void> {
  await db.insert(letterLogs).values({ letterId, actorId, action, note: note ?? null });
}

/** Urutan berikutnya untuk (template, tahun). Reset otomatis tiap ganti tahun. */
export async function nextSeq(templateId: number, year: number): Promise<number> {
  const [row] = await db
    .select({ value: max(letters.numberSeq) })
    .from(letters)
    .where(and(eq(letters.templateId, templateId), eq(letters.numberYear, year)));
  return (row?.value ?? 0) + 1;
}
