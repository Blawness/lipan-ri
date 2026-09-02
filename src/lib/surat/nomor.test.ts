import { describe, it, expect } from "vitest";
import { renderNumberPattern, bulanRomawi } from "@/lib/surat/nomor";

describe("bulanRomawi", () => {
  it("memetakan 1..12 ke angka romawi", () => {
    expect(bulanRomawi(1)).toBe("I");
    expect(bulanRomawi(6)).toBe("VI");
    expect(bulanRomawi(9)).toBe("IX");
    expect(bulanRomawi(12)).toBe("XII");
  });
});

describe("renderNumberPattern", () => {
  const ctx = { seq: 7, date: new Date("2026-06-15T00:00:00Z"), code: "SK" };

  it("mengisi semua token", () => {
    expect(
      renderNumberPattern("{seq}/{kode}/LIPAN-RI/{bulanRomawi}/{tahun}", ctx)
    ).toBe("007/SK/LIPAN-RI/VI/2026");
  });

  it("memberi padding 3 digit pada seq", () => {
    expect(renderNumberPattern("{seq}", { ...ctx, seq: 1 })).toBe("001");
  });

  it("tidak memotong seq yang sudah lebih dari 3 digit", () => {
    expect(renderNumberPattern("{seq}", { ...ctx, seq: 1234 })).toBe("1234");
  });

  it("mendukung {bulan} sebagai angka dua digit", () => {
    expect(renderNumberPattern("{bulan}", ctx)).toBe("06");
  });

  it("membiarkan pola tanpa token apa adanya", () => {
    expect(renderNumberPattern("SURAT-TETAP", ctx)).toBe("SURAT-TETAP");
  });

  it("membiarkan token tak dikenal apa adanya agar salah ketik terlihat", () => {
    expect(renderNumberPattern("{nomor}/{tahun}", ctx)).toBe("{nomor}/2026");
  });
});
