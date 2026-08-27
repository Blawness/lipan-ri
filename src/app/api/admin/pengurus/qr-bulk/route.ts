import { NextResponse } from "next/server";
import { ZipArchive } from "archiver";
import { auth } from "@/auth";
import { db } from "@/db";
import { pengurus } from "@/db/schema";
import { generateQrPng } from "@/lib/qr";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const rows = await db
    .select({
      slug: pengurus.slug,
      nama: pengurus.nama,
      nomorAnggota: pengurus.nomorAnggota,
    })
    .from(pengurus);

  if (rows.length === 0) {
    return new NextResponse("No pengurus found", { status: 404 });
  }

  const archive = new ZipArchive({ zlib: { level: 9 } });
  const chunks: Buffer[] = [];
  archive.on("data", (chunk: Buffer) => chunks.push(chunk));

  const finished = new Promise<Buffer>((resolve, reject) => {
    archive.on("end", () => resolve(Buffer.concat(chunks)));
    archive.on("error", reject);
  });

  for (const row of rows) {
    const png = await generateQrPng(
      `https://www.lipan-ri.com/verifikasi-pengurus/${encodeURIComponent(row.slug)}`,
    );
    // Nama berkas memuat nomor anggota agar mudah dicocokkan saat menata cetakan.
    // nomorAnggota juga teks bebas ketikan admin (bukan hanya `nama`), jadi
    // disanitasi sama seperti `nama` supaya "/" atau ".." tidak lolos ke entri ZIP.
    const sanitasi = (s: string) => s.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    const nomorAman = sanitasi(row.nomorAnggota);
    const aman = sanitasi(row.nama);
    archive.append(png, { name: `${nomorAman}-${aman}.png` });
  }

  await archive.finalize();
  const zipBuffer = await finished;

  return new NextResponse(new Uint8Array(zipBuffer), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="qr-pengurus-lipan-ri.zip"`,
    },
  });
}
