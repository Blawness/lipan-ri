import { describe, it, expect } from "vitest";
import { generateQrPng } from "@/lib/qr";

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

describe("generateQrPng", () => {
  it("menghasilkan PNG", async () => {
    const buf = await generateQrPng("https://www.lipan-ri.com/verifikasi/abc");
    expect(buf.subarray(0, 4).equals(PNG_MAGIC)).toBe(true);
  });

  it("berukuran 400px persegi seperti QR dokumen yang sudah ada", async () => {
    const buf = await generateQrPng("https://www.lipan-ri.com/verifikasi/abc");
    // Lebar & tinggi PNG ada di IHDR: big-endian uint32 pada offset 16 dan 20.
    expect(buf.readUInt32BE(16)).toBe(400);
    expect(buf.readUInt32BE(20)).toBe(400);
  });
});
