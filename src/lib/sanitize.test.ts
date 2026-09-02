import { describe, it, expect } from "vitest";
import { sanitizeSuratHtml } from "@/lib/sanitize";

describe("sanitizeSuratHtml", () => {
  it("mempertahankan tag yang dirender ke PDF", () => {
    const html = "<p>Halo <strong>dunia</strong></p><ul><li>satu</li></ul>";
    expect(sanitizeSuratHtml(html)).toBe(html);
  });

  it("membuang gambar dan tautan karena tidak dirender ke PDF", () => {
    expect(sanitizeSuratHtml('<p>a<img src="https://x/y.png">b</p>')).toBe("<p>ab</p>");
    expect(sanitizeSuratHtml('<p><a href="https://x">taut</a></p>')).toBe("<p>taut</p>");
  });

  it("membuang script", () => {
    expect(sanitizeSuratHtml("<p>a</p><script>alert(1)</script>")).toBe("<p>a</p>");
  });
});
