import { describe, it, expect } from "vitest";
import { keteranganFoto } from "./caption";

describe("keteranganFoto", () => {
  it("meneruskan keterangan sungguhan", () => {
    expect(keteranganFoto("Ketua Umum LIPAN-RI di Kantor Penasihat Khusus.")).toBe(
      "Ketua Umum LIPAN-RI di Kantor Penasihat Khusus."
    );
  });

  it("menyaring nama berkas bawaan unggahan admin", () => {
    for (const nama of [
      "WhatsApp Image 2026-09-01 at 20.31.19.jpeg",
      "foto.JPG",
      "banner-utama.png",
      "logo.svg",
      "animasi.gif",
      "potret.webp",
    ]) {
      expect(keteranganFoto(nama)).toBeNull();
    }
  });

  it("menganggap kosong, spasi, dan null sebagai tanpa keterangan", () => {
    expect(keteranganFoto(null)).toBeNull();
    expect(keteranganFoto(undefined)).toBeNull();
    expect(keteranganFoto("")).toBeNull();
    expect(keteranganFoto("   ")).toBeNull();
  });

  it("merapikan spasi di ujung", () => {
    expect(keteranganFoto("  Kunjungan kerja  ")).toBe("Kunjungan kerja");
  });

  it("tidak tertipu titik di tengah kalimat", () => {
    expect(keteranganFoto("Rapat di Jl. Proklamasi No. 44")).toBe(
      "Rapat di Jl. Proklamasi No. 44"
    );
  });
});
