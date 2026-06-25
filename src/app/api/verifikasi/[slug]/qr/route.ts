import { NextResponse } from "next/server";
import QRCode from "qrcode";
import sharp from "sharp";
import path from "node:path";

const LOGO_PATH = path.resolve("public/logo.png");
const QR_SIZE = 400;
// Logo occupies ~22% of QR area; high error correction (H) tolerates this
const LOGO_SIZE = Math.round(QR_SIZE * 0.22);
const LOGO_PADDING = 8; // white padding around logo to isolate from QR cells

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const url = `https://www.lipan-ri.com/verifikasi/${slug}`;

  const qrBuffer = await QRCode.toBuffer(url, {
    width: QR_SIZE,
    margin: 2,
    errorCorrectionLevel: "H",
    color: { dark: "#0f2b46", light: "#ffffff" },
  });

  const paddedLogoSize = LOGO_SIZE + LOGO_PADDING * 2;
  const [logo] = await Promise.all([
    sharp(LOGO_PATH)
      .resize(LOGO_SIZE, LOGO_SIZE, { fit: "inside" })
      .toBuffer(),
    // Pre-warm sharp to handle concurrency better in serverless
  ]);

  // Create white square backdrop so QR cells don't show through logo transparency
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

  const result = await sharp(qrBuffer)
    .composite([{ input: paddedLogo, top, left }])
    .png()
    .toBuffer();

  return new NextResponse(new Uint8Array(result), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
