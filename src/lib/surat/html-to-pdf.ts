import { Parser } from "htmlparser2";

export type SuratInline = {
  text: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
};

export type SuratBlock =
  | {
      kind: "paragraph";
      level: 0 | 2 | 3 | 4;
      quote: boolean;
      inlines: SuratInline[];
    }
  | { kind: "list"; ordered: boolean; items: SuratInline[][] };

const HEADING_LEVEL: Record<string, 2 | 3 | 4> = { h2: 2, h3: 3, h4: 4 };

type SuratList = { ordered: boolean; items: SuratInline[][] };

/**
 * HTML badan surat → blok datar yang siap dirender react-pdf.
 *
 * Dipisah dari komponen PDF supaya bisa diuji tanpa mesin PDF. Tag di luar
 * daftar yang didukung tidak dibuang: isinya tetap keluar sebagai paragraf
 * polos, agar kesalahan tempel tidak menghilangkan isi surat diam-diam.
 */
export function parseSuratHtml(html: string): SuratBlock[] {
  const blocks: SuratBlock[] = [];

  let bold = 0;
  let italic = 0;
  let underline = 0;
  let quoteDepth = 0;
  let level: 0 | 2 | 3 | 4 = 0;

  // Buffer paragraf berjalan; list punya buffer sendiri saat aktif.
  let inlines: SuratInline[] = [];
  let list: SuratList | null = null;
  let inListItem = false;

  function flushParagraph() {
    if (inlines.length === 0) return;
    blocks.push({
      kind: "paragraph",
      level,
      quote: quoteDepth > 0,
      inlines,
    });
    inlines = [];
  }

  function push(text: string) {
    if (text.length === 0) return;
    inlines.push({
      text,
      bold: bold > 0,
      italic: italic > 0,
      underline: underline > 0,
    });
  }

  const parser = new Parser(
    {
      onopentag(name) {
        switch (name) {
          case "strong":
          case "b":
            bold++;
            break;
          case "em":
          case "i":
            italic++;
            break;
          case "u":
            underline++;
            break;
          case "blockquote":
            flushParagraph();
            quoteDepth++;
            break;
          case "h2":
          case "h3":
          case "h4":
            flushParagraph();
            level = HEADING_LEVEL[name];
            break;
          case "p":
            flushParagraph();
            break;
          case "br":
            push("\n");
            break;
          case "ul":
          case "ol":
            flushParagraph();
            list = { ordered: name === "ol", items: [] };
            break;
          case "li":
            inlines = [];
            inListItem = true;
            break;
          default:
            // Tag tak dikenal: isinya tetap ikut paragraf berjalan.
            break;
        }
      },
      ontext(text) {
        // Runtuhkan spasi berlebih, tapi jangan buang spasi antar-kata.
        const normalized = text.replace(/\s+/g, " ");
        if (normalized.trim() === "" && inlines.length === 0) return;
        push(normalized);
      },
      onclosetag(name) {
        switch (name) {
          case "strong":
          case "b":
            bold = Math.max(0, bold - 1);
            break;
          case "em":
          case "i":
            italic = Math.max(0, italic - 1);
            break;
          case "u":
            underline = Math.max(0, underline - 1);
            break;
          case "blockquote":
            flushParagraph();
            quoteDepth = Math.max(0, quoteDepth - 1);
            break;
          case "h2":
          case "h3":
          case "h4":
            flushParagraph();
            level = 0;
            break;
          case "p":
            flushParagraph();
            break;
          case "li":
            if (list && inlines.length > 0) list.items.push(inlines);
            inlines = [];
            inListItem = false;
            break;
          case "ul":
          case "ol":
            if (list && list.items.length > 0) {
              blocks.push({ kind: "list", ...list });
            }
            list = null;
            break;
          default:
            break;
        }
      },
    },
    { decodeEntities: true }
  );

  parser.write(html);
  parser.end();

  // Sisa teks di luar tag mana pun (mis. `<div>` telanjang) tetap diselamatkan.
  if (!inListItem) flushParagraph();

  return blocks;
}
