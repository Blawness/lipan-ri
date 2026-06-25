import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { documents } from "@/db/schema";
import QRCode from "qrcode";
import sharp from "sharp";
import path from "node:path";
import { createRequire } from "node:module";

const req = createRequire(import.meta.url);
const archiver = req("archiver");

const LOGO_PATH = path.resolve("public/logo.png");
const QR_SIZE = 400;
const LOGO_SIZE = Math.round(QR_SIZE * 0.22);
const LOGO_PADDING = 8;

async function generateQR(slug: string): Promise<Buffer> {
  const url = `https://lipan-ri.or.id/verifikasi/${slug}`;
  const qrBuffer = await QRCode.toBuffer(url, {
    width: QR_SIZE,
    margin: 2,
    errorCorrectionLevel: "H",
    color: { dark: "#0f2b46", light: "#ffffff" },
  });

  const paddedLogoSize = LOGO_SIZE + LOGO_PADDING * 2;
  const logo = await sharp(LOGO_PATH)
    .resize(LOGO_SIZE, LOGO_SIZE, { fit: "inside" })
    .toBuffer();

  const paddedLogo = await sharp({
    create: {
      width: paddedLogoSize,
      height: paddedLogoSize,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([{ input: logo, top: LOGO_PADDING, left: LOGO_PADDING }])
    .png()
    .toBuffer();

  const { width: qrW, height: qrH } = await sharp(qrBuffer).metadata();
  const left = Math.round(((qrW ?? QR_SIZE) - paddedLogoSize) / 2);
  const top = Math.round(((qrH ?? QR_SIZE) - paddedLogoSize) / 2);

  return sharp(qrBuffer)
    .composite([{ input: paddedLogo, top, left }])
    .png()
    .toBuffer();
}

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
    const png = await generateQR(row.slug);
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
