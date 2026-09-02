import sanitizeHtmlLib from "sanitize-html";

/**
 * Sanitize editor HTML before persisting (content is rendered via
 * dangerouslySetInnerHTML on the public site).
 *
 * Uses `sanitize-html` (pure JS, htmlparser2 — no jsdom) so it loads in the
 * Vercel serverless runtime; `isomorphic-dompurify`/jsdom failed to load there
 * ("Failed to load external module" → /admin/posts 500).
 *
 * Security posture (unchanged): strict tag allowlist, no `target` (avoids
 * tab-napping), only http(s)/mailto + root-relative URLs, and protocol-relative
 * `//host` URLs are rejected.
 */
export function sanitizeHtml(dirty: string): string {
  return sanitizeHtmlLib(dirty, {
    allowedTags: [
      "p", "br", "strong", "em", "u", "s", "h2", "h3", "h4",
      "ul", "ol", "li", "blockquote", "a", "img", "figure", "figcaption",
    ],
    allowedAttributes: {
      a: ["href", "rel", "title"],
      img: ["src", "alt", "title"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: { img: ["http", "https"] },
    allowProtocolRelative: false,
  });
}

/**
 * Tag yang boleh ada di badan surat. Daftar ini adalah kontrak tunggal antara
 * editor admin dan pemeta HTML→PDF (`src/lib/surat/html-to-pdf.ts`): apa pun
 * yang lolos ke sini harus punya padanan node react-pdf.
 */
export const SURAT_ALLOWED_TAGS = [
  "p", "br", "strong", "em", "u",
  "h2", "h3", "h4",
  "ul", "ol", "li", "blockquote",
];

/**
 * Sanitasi badan surat. Lebih sempit dari `sanitizeHtml`: tautan, gambar, dan
 * figure dibuang karena mesin PDF tidak merendernya — lebih baik hilang saat
 * disimpan (kelihatan di editor) daripada hilang diam-diam di PDF final.
 */
export function sanitizeSuratHtml(dirty: string): string {
  return sanitizeHtmlLib(dirty, {
    allowedTags: SURAT_ALLOWED_TAGS,
    allowedAttributes: {},
    allowProtocolRelative: false,
  });
}
