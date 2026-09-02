import { describe, it, expect } from "vitest";
import { renderSuratPdf } from "@/lib/surat/pdf/surat-document";

const PDF_MAGIC = "%PDF";

const input = {
  number: "001/SK/LIPAN-RI/VI/2026",
  subject: "Pengangkatan Pengurus",
  bodyHtml: "<p>Menetapkan hal berikut.</p><ul><li>Poin satu</li></ul>",
  fields: [] as { label: string; value: string }[],
  signatoryName: "Nama Ketua, SH",
  signatoryPosition: "Ketua Umum",
  issuedAt: new Date("2026-06-15T00:00:00Z"),
  verifyUrl: "https://www.lipan-ri.com/verifikasi/abc-123",
};

describe("renderSuratPdf", () => {
  it("menghasilkan PDF", async () => {
    const buf = await renderSuratPdf(input);
    expect(buf.subarray(0, 4).toString("latin1")).toBe(PDF_MAGIC);
  }, 30_000);

  it("tidak melempar untuk badan surat kosong", async () => {
    const buf = await renderSuratPdf({ ...input, bodyHtml: "" });
    expect(buf.length).toBeGreaterThan(0);
  }, 30_000);

  it("menghasilkan PDF dengan baris isian field", async () => {
    const buf = await renderSuratPdf({
      ...input,
      fields: [
        { label: "Nama Pegawai", value: "Budi Santoso" },
        { label: "Jabatan", value: "" },
      ],
    });
    expect(buf.subarray(0, 4).toString("latin1")).toBe(PDF_MAGIC);
  }, 30_000);

  it("tidak melempar saat daftar field kosong", async () => {
    const buf = await renderSuratPdf({ ...input, fields: [] });
    expect(buf.length).toBeGreaterThan(0);
  }, 30_000);
});
