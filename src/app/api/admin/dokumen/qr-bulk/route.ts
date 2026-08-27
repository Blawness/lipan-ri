import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { documents } from "@/db/schema";
import { generateQrPng } from "@/lib/qr";
import { createRequire } from "node:module";

const req = createRequire(import.meta.url);
const archiver = req("archiver");

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const rows = await db
    .select({ slug: documents.slug, number: documents.number })
    .from(documents);

  if (rows.length === 0) {
    return new NextResponse("No documents found", { status: 404 });
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
      `https://www.lipan-ri.com/verifikasi/${row.slug}`,
    );
    archive.append(png, { name: `qr-${row.slug}.png` });
  }

  await archive.finalize();

  const zipBuffer = await finished;

  return new NextResponse(new Uint8Array(zipBuffer), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="qr-lipan-ri.zip"`,
    },
  });
}
