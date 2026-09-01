import { describe, it, expect } from "vitest";
import {
  isBerlaku,
  nextNomorAnggota,
  mergeSlots,
  formatMasaBerlaku,
} from "@/lib/pengurus-rules";

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

  it("masih berlaku pada siang hari di tanggal selesaiMenjabat (inklusif)", () => {
    const akhir = new Date("2026-08-27T00:00:00Z");
    const siangHariItu = new Date("2026-08-27T12:00:00Z");
    expect(
      isBerlaku({ status: "aktif", selesaiMenjabat: akhir }, siangHariItu),
    ).toBe(true);
  });

  it("tidak berlaku lagi pada hari berikutnya setelah selesaiMenjabat", () => {
    const akhir = new Date("2026-08-27T00:00:00Z");
    const hariBerikutnya = new Date("2026-08-28T00:00:00Z");
    expect(
      isBerlaku({ status: "aktif", selesaiMenjabat: akhir }, hariBerikutnya),
    ).toBe(false);
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

describe("mergeSlots", () => {
  const labels = {
    ketua: { role: "Ketua", variant: "utama" as const },
    sekjen: { role: "Sekretaris Jenderal", variant: "utama" as const },
  };
  const baris = {
    id: 1,
    slot: "ketua",
    slug: "harun-prayitno",
    nomorAnggota: "LIPAN-2026-0001",
    nama: "Harun Prayitno, S.E., S.H., M.H.",
    jabatan: "Ketua",
    foto: "/ketua.png",
    deskripsi: "Memimpin organisasi.",
    email: null,
    telepon: null,
    status: "aktif",
    selesaiMenjabat: null,
  };

  it("mengisi slot dari baris DB", () => {
    const out = mergeSlots(labels, [baris], NOW);
    expect(out.ketua.nama).toBe("Harun Prayitno, S.E., S.H., M.H.");
    expect(out.ketua.deskripsi).toBe("Memimpin organisasi.");
    expect(out.ketua.kosong).toBeUndefined();
    expect(out.ketua.nomorAnggota).toBe("LIPAN-2026-0001");
  });

  it("tidak memberi nomor anggota pada slot kosong", () => {
    const out = mergeSlots(labels, [baris], NOW);
    expect(out.sekjen.nomorAnggota).toBeUndefined();
  });

  it("menandai slot tanpa baris sebagai kosong, bukan menghilangkannya", () => {
    const out = mergeSlots(labels, [baris], NOW);
    expect(out.sekjen.nama).toBe("—");
    expect(out.sekjen.role).toBe("Sekretaris Jenderal");
    expect(out.sekjen.kosong).toBe(true);
  });

  it("memperlakukan pengurus tidak berlaku sebagai slot kosong", () => {
    const out = mergeSlots(labels, [{ ...baris, status: "nonaktif" }], NOW);
    expect(out.ketua.kosong).toBe(true);
    expect(out.ketua.nama).toBe("—");
  });

  it("mengabaikan baris yang slot-nya tidak ada di bagan", () => {
    const out = mergeSlots(labels, [{ ...baris, slot: "perwakilan-jabar" }], NOW);
    expect(out.ketua.kosong).toBe(true);
    expect(Object.keys(out)).toEqual(["ketua", "sekjen"]);
  });

  it("memakai jabatan dari DB, bukan label, saat baris ada", () => {
    const out = mergeSlots(labels, [{ ...baris, jabatan: "Ketua Umum" }], NOW);
    expect(out.ketua.role).toBe("Ketua Umum");
  });
});

describe("formatMasaBerlaku", () => {
  const mulai = new Date("2026-01-01T00:00:00Z");

  it("menulis 's.d. sekarang' bila belum ada tanggal selesai", () => {
    expect(formatMasaBerlaku(mulai, null)).toBe("1 Januari 2026 s.d. sekarang");
  });

  it("menulis rentang bila ada tanggal selesai", () => {
    const selesai = new Date("2027-03-15T00:00:00Z");
    expect(formatMasaBerlaku(mulai, selesai)).toBe("1 Januari 2026 — 15 Maret 2027");
  });
});
