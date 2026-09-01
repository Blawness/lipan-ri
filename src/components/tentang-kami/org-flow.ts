export type OrgVariant = "utama" | "divisi" | "staf";

export interface OrgMember {
  /** id slot di POS. */
  id: string;
  role: string;
  nama: string;
  variant: OrgVariant;
  /** Nomor anggota (KTA) — hanya ada bila slot terisi. */
  nomorAnggota?: string;
  foto?: string;
  deskripsi?: string;
  email?: string;
  telepon?: string;
  /** true = slot belum terisi; kartu digambar tapi tidak bisa diklik. */
  kosong?: boolean;
}

// Label jabatan tiap slot. Ini metadata layout, bukan data orang: dipakai saat
// sebuah slot belum punya baris di DB, supaya bagan tetap utuh dan garis tetap
// tersambung alih-alih menyisakan kartu kosong tanpa keterangan.
export const SLOT_LABELS: Record<string, { role: string; variant: OrgVariant }> = {
  pembina: { role: "Dewan Pembina", variant: "utama" },
  penasehat: { role: "Dewan Penasehat/Kehormatan", variant: "utama" },
  ketua: { role: "Ketua", variant: "utama" },
  "staf-khusus": { role: "Staf Khusus Ketua", variant: "utama" },
  "koordinator-keamanan": { role: "Koordinator Keamanan", variant: "utama" },
  sekjen: { role: "Sekretaris Jenderal", variant: "utama" },
  bendahara: { role: "Bendahara Umum", variant: "utama" },
  sdm: { role: "SDM dan Umum", variant: "utama" },
  "div-hukum": { role: "Divisi Bantuan Hukum & HAM", variant: "divisi" },
  "div-pengawasan": { role: "Divisi Pengawasan", variant: "divisi" },
  "div-media": { role: "Divisi Media Infokom", variant: "divisi" },
  "div-investigasi": { role: "Divisi Investigasi", variant: "divisi" },
  "hukum-1": { role: "Staf Divisi", variant: "staf" },
  "hukum-2": { role: "Staf Divisi", variant: "staf" },
  "pengawasan-1": { role: "Staf Divisi", variant: "staf" },
  "media-1": { role: "Staf Divisi", variant: "staf" },
  "media-2": { role: "Staf Divisi", variant: "staf" },
  "media-3": { role: "Staf Divisi", variant: "staf" },
};

// Uniform node size — every card is identical width & height for consistency.
// Tinggi kartu dibatasi jarak vertikal terdekat antar-baris di POS (59 satuan,
// mis. media-1 → media-2) setelah dikalikan VSCALE 1.32 ≈ 78px; 68 menyisakan
// ~10px sela sehingga baris nomor anggota muat tanpa kartu saling menempel.
export const NODE_W = 210;
export const NODE_H = 68;

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
  // SDM hangs below Sekjen & Bendahara (as in struktur-lipanv2.svg): both converge
  // down into SDM via a shared bus just above it, not straight from Ketua. Order
  // matters — sekjen is listed last so PARENT[sdm] resolves to sekjen (the chain
  // of command that hover-highlighting walks up).
  { source: "bendahara", target: "sdm", sh: "sb", th: "tt", busY: 415 },
  { source: "sekjen", target: "sdm", sh: "sb", th: "tt", busY: 415 },
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

// parent id -> child ids. Derived from PARENT (not EDGES) so every node hangs
// under exactly one parent: `sdm` has two incoming edges (sekjen & bendahara)
// but only one chain of command, and the detail panel must not list it twice.
export const CHILDREN: Record<string, string[]> = (() => {
  const m: Record<string, string[]> = {};
  for (const [child, parent] of Object.entries(PARENT)) {
    (m[parent] ??= []).push(child);
  }
  return m;
})();

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

// Node data carries ONLY the member. Highlight state is read from context by the
// node itself (see OrgPathContext) so the `nodes` array can stay referentially
// stable across hovers — recreating node objects resets React Flow's measured
// dimensions and makes every edge unmount for a frame (visible flicker).
export interface OrgNodeData extends Record<string, unknown> {
  member: OrgMember;
}
