import { describe, it, expect } from "vitest";
import { parseSuratHtml } from "@/lib/surat/html-to-pdf";

const plain = (text: string) => ({
  text,
  bold: false,
  italic: false,
  underline: false,
});

describe("parseSuratHtml", () => {
  it("memetakan paragraf biasa", () => {
    expect(parseSuratHtml("<p>Halo</p>")).toEqual([
      { kind: "paragraph", level: 0, quote: false, inlines: [plain("Halo")] },
    ]);
  });

  it("mempertahankan tebal, miring, dan garis bawah", () => {
    expect(
      parseSuratHtml("<p>a<strong>b</strong><em>c</em><u>d</u></p>")
    ).toEqual([
      {
        kind: "paragraph",
        level: 0,
        quote: false,
        inlines: [
          plain("a"),
          { text: "b", bold: true, italic: false, underline: false },
          { text: "c", bold: false, italic: true, underline: false },
          { text: "d", bold: false, italic: false, underline: true },
        ],
      },
    ]);
  });

  it("menandai heading dengan level", () => {
    const [block] = parseSuratHtml("<h3>Judul</h3>");
    expect(block).toMatchObject({ kind: "paragraph", level: 3 });
  });

  it("menandai blockquote", () => {
    const [block] = parseSuratHtml("<blockquote><p>kutip</p></blockquote>");
    expect(block).toMatchObject({ quote: true });
  });

  it("memetakan daftar tak berurut", () => {
    expect(parseSuratHtml("<ul><li>satu</li><li>dua</li></ul>")).toEqual([
      {
        kind: "list",
        ordered: false,
        items: [[plain("satu")], [plain("dua")]],
      },
    ]);
  });

  it("memetakan daftar berurut", () => {
    const [block] = parseSuratHtml("<ol><li>satu</li></ol>");
    expect(block).toMatchObject({ kind: "list", ordered: true });
  });

  it("memecah paragraf pada <br>", () => {
    const [block] = parseSuratHtml("<p>a<br>b</p>");
    expect(block).toMatchObject({
      inlines: [plain("a"), plain("\n"), plain("b")],
    });
  });

  it("merender tag tak dikenal sebagai teks polos, bukan membuangnya", () => {
    expect(parseSuratHtml("<div>terlantar</div>")).toEqual([
      {
        kind: "paragraph",
        level: 0,
        quote: false,
        inlines: [plain("terlantar")],
      },
    ]);
  });

  it("tidak melempar pada HTML rusak", () => {
    expect(() => parseSuratHtml("<p>a<strong>b</p>")).not.toThrow();
  });

  it("mengabaikan teks kosong antar-tag", () => {
    expect(parseSuratHtml("<p>a</p>\n  \n<p>b</p>")).toHaveLength(2);
  });

  it("meratakan daftar tak berurut bersarang menjadi satu daftar", () => {
    const blocks = parseSuratHtml("<ul><li>a<ul><li>b</li></ul></li></ul>");
    expect(blocks).toEqual([
      { kind: "list", ordered: false, items: [[plain("a")], [plain("b")]] },
    ]);
  });

  it("daftar bersarang tidak menghasilkan paragraf nyasar", () => {
    const blocks = parseSuratHtml("<ul><li>a<ul><li>b</li></ul></li></ul>");
    expect(blocks.some((b) => b.kind === "paragraph")).toBe(false);
  });

  it("daftar berurut dengan anak tak berurut tetap ordered: true", () => {
    const [block] = parseSuratHtml(
      "<ol><li>a<ul><li>b</li></ul></li></ol>"
    );
    expect(block).toMatchObject({ kind: "list", ordered: true });
  });

  it("daftar setelah daftar bersarang tetap terurai dengan benar", () => {
    const blocks = parseSuratHtml(
      "<ul><li>a<ul><li>b</li></ul></li></ul><ol><li>c</li></ol>"
    );
    expect(blocks).toHaveLength(2);
    expect(blocks[1]).toMatchObject({
      kind: "list",
      ordered: true,
      items: [[plain("c")]],
    });
  });
});
