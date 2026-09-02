import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { uploadFile } from "@blawness/admin-kit";
import { db } from "@/db";
import { letters, documents } from "@/db/schema";
import { getLetterDetail, nextSeq, createLetterLog } from "@/lib/admin/letters";
import { createDocumentLog } from "@/lib/admin/documents";
import { canIssue } from "@/lib/surat/status";
import { renderNumberPattern } from "@/lib/surat/nomor";
import { renderSuratPdf } from "@/lib/surat/pdf/surat-document";

export type IssueResult =
  | { ok: true; documentSlug: string; number: string; pdfFailed: boolean }
  | { ok: false; error: string };

function slugFor(number: string): string {
  const base = number
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${base}-${randomUUID().slice(0, 6)}`;
}

function verifyUrl(slug: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.lipan-ri.com";
  return `${base.replace(/\/$/, "")}/verifikasi/${slug}`;
}

/** Kode error unique-violation Postgres, apa adanya dari driver `pg`. */
function isUniqueViolation(e: unknown): e is { code: "23505" } {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as { code?: unknown }).code === "23505"
  );
}

/**
 * Satu-satunya jalan menuju status `issued`.
 *
 * Nomor dikunci, baris `documents` dibuat, dan status dipindah dalam satu
 * transaksi. Render PDF sengaja ditaruh setelah commit: memakan ratusan
 * milidetik dan tidak boleh menahan koneksi Neon. Kalau render gagal, surat
 * tetap sah dan terverifikasi — hanya berkasnya yang belum ada.
 *
 * `numberOverride`, kalau diisi, HARUS sudah dibedakan oleh pemanggil dari
 * calon nomor yang dirender halaman — lihat `issueLetterAction`. Kalau
 * dikirim mentah-mentah tiap submit (mis. langsung dari nilai terisi form),
 * "override" jadi jalur normal dan nomor yang tercetak lepas dari kunci
 * `numberSeq` yang sebenarnya dipakai transaksi ini.
 */
export async function issueLetter(
  letterId: number,
  actor: { userId: number; role: string },
  numberOverride?: string
): Promise<IssueResult> {
  const letter = await getLetterDetail(letterId);
  if (!letter) return { ok: false, error: "Surat tidak ditemukan." };

  const check = canIssue({
    status: letter.status,
    actorUserId: actor.userId,
    actorRole: actor.role,
    signatoryUserId: letter.signatoryUserId,
  });
  if (!check.ok) return { ok: false, error: check.reason };
  if (letter.documentId) return { ok: false, error: "Surat ini sudah punya dokumen." };

  const override = numberOverride?.trim() || undefined;

  if (override) {
    // Nomor manual bisa dipakai lintas template/tahun, jadi tidak tertangkap
    // oleh unique constraint (templateId, numberYear, numberSeq). Dicek
    // sendiri di sini — celah TOCTOU-nya sempit dan tak berbahaya: paling
    // buruk transaksi di bawah gagal dan pemanggil diminta coba lagi.
    const [existing] = await db
      .select({ id: documents.id })
      .from(documents)
      .where(eq(documents.number, override))
      .limit(1);
    if (existing) return { ok: false, error: "Nomor itu sudah dipakai dokumen lain." };
  }

  const issuedAt = new Date();
  const year = issuedAt.getFullYear();

  let slug = "";
  let number = "";
  let documentId = 0;

  // Retry hanya masuk akal saat nomor dihitung otomatis: unique constraint
  // (templateId, numberYear, numberSeq) menangkap dua pengesahan bersamaan,
  // dan urutannya bergeser di percobaan kedua. Nomor manual tidak diulang —
  // mengulang dengan nilai yang sama hanya akan bentrok lagi.
  const maxAttempts = override ? 1 : 2;
  let committed = false;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const seq = await nextSeq(letter.templateId, year);
    number =
      override ??
      renderNumberPattern(letter.numberPattern, {
        seq,
        date: issuedAt,
        code: letter.templateCode,
      });
    slug = slugFor(number);

    try {
      await db.transaction(async (tx) => {
        const [doc] = await tx
          .insert(documents)
          .values({
            slug,
            number,
            title: letter.subject,
            signatory: letter.signatoryName,
            issuedAt,
            status: "active",
            showDocument: false,
          })
          .returning({ id: documents.id });

        const updated = await tx
          .update(letters)
          .set({
            status: "issued",
            number,
            numberSeq: seq,
            numberYear: year,
            documentId: doc.id,
            updatedAt: issuedAt,
          })
          // Penjaga terakhir: kalau status sudah bergeser sejak dibaca, batal.
          .where(and(eq(letters.id, letterId), eq(letters.status, "submitted")))
          .returning({ id: letters.id });

        if (updated.length === 0) {
          throw new Error("STATUS_BERUBAH");
        }
        documentId = doc.id;
      });

      committed = true;
      break;
    } catch (e) {
      if (e instanceof Error && e.message === "STATUS_BERUBAH") {
        return { ok: false, error: "Surat sudah diproses orang lain." };
      }
      if (isUniqueViolation(e)) {
        if (attempt < maxAttempts - 1) continue;
        return {
          ok: false,
          error: override
            ? "Nomor itu sudah dipakai dokumen lain."
            : "Nomor surat bentrok. Coba lagi.",
        };
      }
      console.error("[issueLetter] gagal menyimpan pengesahan surat", letterId, e);
      return { ok: false, error: "Terjadi kesalahan saat menyimpan. Coba lagi." };
    }
  }

  if (!committed) {
    // Tak tercapai dalam praktik: tiap iterasi di atas selalu return atau
    // continue. Dijaga di sini murni supaya TypeScript yakin `documentId`
    // sudah terisi di bawah.
    return { ok: false, error: "Nomor surat bentrok. Coba lagi." };
  }

  // Sengaja di luar blok try/catch transaksi: kalau salah satu insert log ini
  // gagal setelah commit, ia TIDAK boleh terbaca sebagai tabrakan nomor oleh
  // catch di atas dan memicu percobaan ulang yang membuat baris `documents`
  // kedua — padahal surat sudah sah terbit lewat percobaan pertama.
  await createLetterLog(
    letterId,
    actor.userId,
    "issued",
    actor.role === "admin" ? "Disahkan oleh admin" : undefined
  );
  await createDocumentLog(
    documentId,
    actor.userId,
    "created",
    `Terbit dari surat #${letterId}`
  );

  const pdfFailed = !(await renderAndAttachPdf(letterId));
  return { ok: true, documentSlug: slug, number, pdfFailed };
}

/**
 * Render PDF lalu tempelkan URL-nya ke `documents.fileUrl`.
 * Dipisah supaya tombol "Render Ulang PDF" bisa memakainya kembali.
 */
export async function renderAndAttachPdf(letterId: number): Promise<boolean> {
  const letter = await getLetterDetail(letterId);
  if (!letter || !letter.documentId || !letter.documentSlug || !letter.number) return false;

  try {
    const buffer = await renderSuratPdf({
      number: letter.number,
      subject: letter.subject,
      bodyHtml: letter.bodyHtml,
      signatoryName: [letter.signatoryName, letter.signatoryTitle].filter(Boolean).join(", "),
      signatoryPosition: letter.signatoryPosition,
      issuedAt: letter.documentIssuedAt ?? new Date(),
      verifyUrl: verifyUrl(letter.documentSlug),
    });
    const { url } = await uploadFile(buffer, `surat/${letter.documentSlug}`, {
      contentType: "application/pdf",
      skipProcessing: true,
    });
    await db
      .update(documents)
      .set({ fileUrl: url, updatedAt: new Date() })
      .where(eq(documents.id, letter.documentId));
    return true;
  } catch (e) {
    // Keabsahan surat tidak digantungkan pada ketersediaan R2 — tapi kalau
    // ini gagal terus di production, harus ada jejaknya di suatu tempat.
    console.error("[renderAndAttachPdf] gagal merender/mengunggah PDF surat", letterId, e);
    return false;
  }
}
