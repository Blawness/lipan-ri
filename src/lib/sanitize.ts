import DOMPurify from "isomorphic-dompurify";

const ALLOWED_TAGS = [
  "p", "br", "strong", "em", "u", "s", "h2", "h3", "h4",
  "ul", "ol", "li", "blockquote", "a", "img", "figure", "figcaption",
];

const ALLOWED_ATTR = ["href", "target", "rel", "src", "alt", "title"];

/** Sanitize editor HTML before persisting (content is rendered via dangerouslySetInnerHTML). */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|\/)/i,
  });
}
