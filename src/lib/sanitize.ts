import DOMPurify from "isomorphic-dompurify";

const ALLOWED_TAGS = [
  "p", "br", "strong", "em", "u", "s", "h2", "h3", "h4",
  "ul", "ol", "li", "blockquote", "a", "img", "figure", "figcaption",
];

// No `target`: the editor never emits it, and allowing it invites tab-napping
// (target="_blank" without rel="noopener"). Links open in the same tab.
const ALLOWED_ATTR = ["href", "rel", "src", "alt", "title"];

/**
 * Sanitize editor HTML before persisting (content is rendered via
 * dangerouslySetInnerHTML on the public site). The URI regexp permits only
 * http(s)/mailto and root-relative paths — and explicitly rejects
 * protocol-relative `//host` URLs via the negative lookahead.
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|\/(?!\/))/i,
  });
}
