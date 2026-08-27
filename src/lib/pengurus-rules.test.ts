import { describe, it, expect } from "vitest";
import { isBerlaku, nextNomorAnggota } from "@/lib/pengurus-rules";

const NOW = new Date("2026-08-27T00:00:00Z");

describe("isBerlaku", () => {
  it("berlaku saat aktif tanpa tanggal selesai", () => {
    expect(isBerlaku({ status: "aktif", selesaiMenjabat: null }, NOW)).toBe(true);
  });

  it("berlaku saat aktif dan tanggal selesai masih di depan", () => {
    const akhir = new Date("2027-01-01T00:00:00Z");
    expect(isBerlaku({ status: "aktif", selesaiMenjabat: akhir }, NOW)).toBe(true);
  });

  it("tidak berlaku saat status nonaktif", () => {
    expect(isBerlaku({ status: "nonaktif", selesaiMenjabat: null }, NOW)).toBe(false);
  });

  it("tidak berlaku saat tanggal selesai sudah lewat, meski status aktif", () => {
    const akhir = new Date("2026-01-01T00:00:00Z");
    expect(isBerlaku({ status: "aktif", selesaiMenjabat: akhir }, NOW)).toBe(false);
  });

  it("tidak berlaku saat status null", () => {
    expect(isBerlaku({ status: null, selesaiMenjabat: null }, NOW)).toBe(false);
  });
});

describe("nextNomorAnggota", () => {
  it("mulai dari 0001 saat belum ada nomor", () => {
    expect(nextNomorAnggota([], 2026)).toBe("LIPAN-2026-0001");
  });

  it("melanjutkan dari urutan tertinggi tahun itu", () => {
    const existing = ["LIPAN-2026-0001", "LIPAN-2026-0007", "LIPAN-2026-0003"];
    expect(nextNomorAnggota(existing, 2026)).toBe("LIPAN-2026-0008");
  });

  it("mengabaikan nomor dari tahun lain", () => {
    expect(nextNomorAnggota(["LIPAN-2025-0042"], 2026)).toBe("LIPAN-2026-0001");
  });

  it("mengabaikan nomor bebas yang diketik manual", () => {
    expect(nextNomorAnggota(["KTA-KHUSUS-9"], 2026)).toBe("LIPAN-2026-0001");
  });
});
