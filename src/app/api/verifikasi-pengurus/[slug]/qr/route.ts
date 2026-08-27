import { NextResponse } from "next/server";
import { generateQrPng } from "@/lib/qr";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const png = await generateQrPng(
    `https://www.lipan-ri.com/verifikasi-pengurus/${slug}`,
  );

  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
