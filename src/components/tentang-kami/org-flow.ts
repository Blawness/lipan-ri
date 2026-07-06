import { ORG, type OrgMember } from "./org-data";

// Uniform node size — every card is identical width & height for consistency.
export const NODE_W = 210;
export const NODE_H = 56;

// Exact top-left card positions lifted from the source SVG (viewBox 1440x810).
export const POS: Record<string, { x: number; y: number }> = {
  // pembina shares ketua/sdm's x so the central spine is dead-straight (was 615).
  pembina: { x: 612, y: 30 },
  penasehat: { x: 320, y: 107 },
  ketua: { x: 612, y: 174 },
  "staf-khusus": { x: 810, y: 246 },
  "koordinator-keamanan": { x: 1042, y: 247 },
  sekjen: { x: 321, y: 353 },
  bendahara: { x: 903, y: 353 },
  sdm: { x: 612, y: 431 },
  "div-hukum": { x: 178, y: 536 },
  "div-pengawasan": { x: 469, y: 536 },
  "div-media": { x: 760, y: 536 },
  "div-investigasi": { x: 1051, y: 536 },
  "hukum-1": { x: 178, y: 599 },
  "hukum-2": { x: 178, y: 662 },
  "pengawasan-1": { x: 469, y: 599 },
  "media-1": { x: 760, y: 599 },
  "media-2": { x: 760, y: 658 },
  "media-3": { x: 760, y: 725 },
};

// Edge definitions with source/target handle ids (see org-node.tsx).
// `busY` = shared horizontal bus line (SVG y-coord) so siblings route cleanly;
// `toTargetY` routes straight into a side handle (Penasehat branch).
export interface FlowEdgeDef {
  source: string;
  target: string;
  sh: string; // source handle id
  th: string; // target handle id
  busY?: number;
  toTargetY?: boolean;
}

export const EDGES: FlowEdgeDef[] = [
  { source: "pembina", target: "ketua", sh: "sb", th: "tt" },
  { source: "pembina", target: "penasehat", sh: "sb", th: "tr", toTargetY: true },
  { source: "ketua", target: "staf-khusus", sh: "sb", th: "tt", busY: 236 },
  { source: "ketua", target: "koordinator-keamanan", sh: "sb", th: "tt", busY: 236 },
  { source: "ketua", target: "sekjen", sh: "sb", th: "tt", busY: 300 },
  { source: "ketua", target: "bendahara", sh: "sb", th: "tt", busY: 300 },
  { source: "ketua", target: "sdm", sh: "sb", th: "tt", busY: 300 },
  { source: "sdm", target: "div-hukum", sh: "sb", th: "tt", busY: 512 },
  { source: "sdm", target: "div-pengawasan", sh: "sb", th: "tt", busY: 512 },
  { source: "sdm", target: "div-media", sh: "sb", th: "tt", busY: 512 },
  { source: "sdm", target: "div-investigasi", sh: "sb", th: "tt", busY: 512 },
  { source: "div-hukum", target: "hukum-1", sh: "sb", th: "tt" },
  { source: "hukum-1", target: "hukum-2", sh: "sb", th: "tt" },
  { source: "div-pengawasan", target: "pengawasan-1", sh: "sb", th: "tt" },
  { source: "div-media", target: "media-1", sh: "sb", th: "tt" },
  { source: "media-1", target: "media-2", sh: "sb", th: "tt" },
  { source: "media-2", target: "media-3", sh: "sb", th: "tt" },
];

// child id -> parent id (derived from edges)
export const PARENT: Record<string, string> = Object.fromEntries(
  EDGES.map((e) => [e.target, e.source]),
);

// The chain of ancestors of `id` (inclusive), for hover-path highlighting.
export function ancestors(id: string | null): Set<string> {
  const set = new Set<string>();
  let cur = id;
  while (cur) {
    set.add(cur);
    cur = PARENT[cur] ?? null;
  }
  return set;
}

// id -> OrgMember lookup, flattened from the org tree.
export const MEMBERS: Record<string, OrgMember> = (() => {
  const m: Record<string, OrgMember> = {};
  const add = (x: OrgMember) => {
    m[x.id] = x;
  };
  add(ORG.pembina);
  add(ORG.penasehat);
  add(ORG.ketua);
  ORG.stafKhusus.forEach(add);
  add(ORG.sekjen);
  add(ORG.bendahara);
  add(ORG.sdm);
  ORG.divisi.forEach((d) => {
    add(d.head);
    d.staf.forEach(add);
  });
  return m;
})();

export interface OrgNodeData extends Record<string, unknown> {
  member: OrgMember;
  highlighted: boolean;
}
