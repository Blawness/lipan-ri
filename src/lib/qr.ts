import QRCode from "qrcode";
import sharp from "sharp";
import path from "node:path";

const LOGO_PATH = path.resolve("public/logo.png");
const QR_SIZE = 400;
// Logo menempati ~22% luas QR; error correction H menoleransi ini.
const LOGO_SIZE = Math.round(QR_SIZE * 0.22);
const LOGO_PADDING = 8; // padding putih agar logo terpisah dari sel QR

/** PNG QR berlogo LIPAN RI. Satu-satunya tempat parameter QR ditentukan. */
export async function generateQrPng(url: string): Promise<Buffer> {
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

  // Alas putih agar sel QR tidak menembus bagian transparan logo.
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
