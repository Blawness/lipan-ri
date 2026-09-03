import { describe, it, expect } from "vitest";
import { formatFieldValue, renderFieldTokens, siapkanIsian } from "@/lib/surat/isian";
import type { LetterTemplateField } from "@/db/schema";

const f = (key: string, type: LetterTemplateField["type"]): LetterTemplateField => ({
  key, label: key, type, required: false,
});

describe("formatFieldValue", () => {
  it("mengubah tanggal ISO jadi ejaan Indonesia", () => {
    expect(formatFieldValue("date", "2026-09-10")).toBe("10 September 2026");
  });

  it("tidak menggeser tanggal walau server bukan WIB", () => {
    expect(formatFieldValue("date", "2026-01-01")).toBe("1 Januari 2026");
  });

  it("membiarkan tanggal yang bukan ISO apa adanya", () => {
    expect(formatFieldValue("date", "10/09/2026")).toBe("10/09/2026");
  });

  it("tidak menyentuh tipe selain tanggal", () => {
    expect(formatFieldValue("text", "2026-09-10")).toBe("2026-09-10");
  });
});

describe("renderFieldTokens", () => {
  const fields = [f("nama", "text"), f("mulai", "date"), f("selesai", "date")];

  it("menyulih token dengan nilai isian", () => {
    expect(
      renderFieldTokens("<p>Kepada {{nama}}.</p>", fields, { nama: "Budi" })
    ).toBe("<p>Kepada Budi.</p>");
  });

  it("memformat tanggal saat menyulih", () => {
    expect(
      renderFieldTokens("<p>Mulai {{mulai}}</p>", fields, { mulai: "2026-09-10" })
    ).toBe("<p>Mulai 10 September 2026</p>");
  });

  it("memaafkan spasi di dalam kurung", () => {
    expect(renderFieldTokens("<p>{{ nama }}</p>", fields, { nama: "Budi" })).toBe(
      "<p>Budi</p>"
    );
  });

  it("membiarkan token yang key-nya tidak dikenal template", () => {
    expect(renderFieldTokens("<p>{{salah_ketik}}</p>", fields, {})).toBe(
      "<p>{{salah_ketik}}</p>"
    );
  });

  it("menyulih field opsional yang kosong jadi kosong", () => {
    expect(renderFieldTokens("<p>[{{selesai}}]</p>", fields, {})).toBe("<p>[]</p>");
  });

  it("meng-escape isian supaya tidak jadi tag", () => {
    expect(
      renderFieldTokens("<p>{{nama}}</p>", fields, { nama: "<b>Budi</b>" })
    ).toBe("<p>&lt;b&gt;Budi&lt;/b&gt;</p>");
  });

  it("mengembalikan html apa adanya kalau template tidak punya field", () => {
    expect(renderFieldTokens("<p>{{nama}}</p>", [], { nama: "Budi" })).toBe(
      "<p>{{nama}}</p>"
    );
  });
});

describe("siapkanIsian", () => {
  const letter = {
    bodyHtml: "<p>Menugaskan {{nama}} mulai {{mulai}}.</p>",
    templateFields: [f("nama", "text"), f("mulai", "date")],
    fieldValues: { nama: "Budi", mulai: "2026-09-10" },
  };

  it("menyulih badan surat dan memformat baris isian sekaligus", () => {
    const hasil = siapkanIsian(letter);
    expect(hasil.bodyHtml).toBe("<p>Menugaskan Budi mulai 10 September 2026.</p>");
    expect(hasil.fields).toEqual([
      { key: "nama", label: "nama", value: "Budi" },
      { key: "mulai", label: "mulai", value: "10 September 2026" },
    ]);
  });
});
