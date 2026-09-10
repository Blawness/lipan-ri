import { describe, it, expect } from "vitest";
import { jalurUnggahan } from "@/lib/admin/media-url";

describe("jalurUnggahan", () => {
  it("membuang skema & host dari URL unggahan", () => {
    expect(jalurUnggahan("https://cdn.lipan-ri.com/uploads/1788270122642-ip00wp.jpg")).toBe(
      "/uploads/1788270122642-ip00wp.jpg"
    );
  });

  it("menyamakan objek yang sama walau host-nya berbeda", () => {
    // Inilah yang dulu bikin 9 PDF dokumen hilang: baris media sudah memakai
    // host baru sementara dokumen masih menyimpan host lama, jadi pemeriksaan
    // rujukan menganggapnya berkas yang berbeda.
    const lama = "https://pub-abc123.r2.dev/uploads/1782464848098-bnvptu";
    const baru = "https://cdn.lipan-ri.com/uploads/1782464848098-bnvptu";
    expect(jalurUnggahan(lama)).toBe(jalurUnggahan(baru));
  });

  it("membiarkan URL relatif apa adanya", () => {
    expect(jalurUnggahan("/logo.png")).toBe("/logo.png");
  });

  it("tidak tertukar antara host dan jalur pada URL tanpa jalur", () => {
    expect(jalurUnggahan("https://cdn.lipan-ri.com")).toBe("https://cdn.lipan-ri.com");
  });
});
