import { NextResponse } from "next/server";
import QRCode from "qrcode";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const url = `https://lipan-ri.or.id/verifikasi/${slug}`;
  const pngBuffer = await QRCode.toBuffer(url, {
    width: 400,
    margin: 2,
    color: { dark: "#0f2b46", light: "#ffffff" },
  });

  return new NextResponse(new Uint8Array(pngBuffer), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
