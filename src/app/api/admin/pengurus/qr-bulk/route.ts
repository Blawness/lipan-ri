import { NextResponse } from "next/server";
import { createRequire } from "node:module";
import { auth } from "@/auth";
import { db } from "@/db";
import { pengurus } from "@/db/schema";
import { generateQrPng } from "@/lib/qr";

const req = createRequire(import.meta.url);
const archiver = req("archiver");

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

  const archive = archiver("zip", { zlib: { level: 9 } });
  const chunks: Buffer[] = [];
  archive.on("data", (chunk: Buffer) => chunks.push(chunk));

  const finished = new Promise<Buffer>((resolve, reject) => {
    archive.on("end", () => resolve(Buffer.concat(chunks)));
    archive.on("error", reject);
  });

  for (const row of rows) {
    const png = await generateQrPng(
      `https://www.lipan-ri.com/verifikasi-pengurus/${row.slug}`,
    );
    // Nama berkas memuat nomor anggota agar mudah dicocokkan saat menata cetakan.
    const aman = row.nama.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    archive.append(png, { name: `${row.nomorAnggota}-${aman}.png` });
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
