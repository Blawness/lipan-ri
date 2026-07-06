# Struktur Organisasi — Animated Web Component (1:1 with SVG)

**Date:** 2026-07-06
**Status:** Approved (design)

## Goal

Replace the embedded 1.4 MB SVG org chart (`public/struktur-lipanv2.svg`) on the
"Struktur Organisasi" page with a native HTML/CSS React component that is
**visually 1:1 with the SVG on desktop** but built from real, selectable text,
themeable via the `--brand` token, responsive on mobile, and animated.

"1:1" means: same white pill cards, navy bold role + regular name text, royal-blue
wavy background, and the same landscape hierarchy/layout on desktop. It is a
faithful visual reproduction, not a byte-for-byte SVG copy.

## Source of truth (org tree, read from the SVG)

```
DEWAN PEMBINA — Hengki Putra Juwita
  ├─ (side branch, left) DEWAN PENASEHAT/KEHORMATAN — Sri Hartono Sasongko
  └─ KETUA — Harun Prayitno, S.E.,S.H.,M.H.
       ├─ (right) STAF KHUSUS KETUA — Wiryanto, S.T.
       ├─ (right) KOORDINATOR KEAMANAN — Mulkan Lessy Tussen
       ├─ SEKRETARIS JENDERAL — Cahya Puspita Rini, S.E.   (flanks left)
       ├─ BENDAHARA UMUM — Velia Dwi Yulianti, S.E.        (flanks right)
       └─ SDM DAN UMUM — Ruswondo Awidjan, S.H.            (center)
            ├─ DIVISI BANTUAN HUKUM & HAM — Annisa Novianty, S.H., M.H.
            │     ├─ STAF DIVISI — Adam Maulana Hafiz, S.H.
            │     └─ STAF DIVISI — Firdausi Aglis Akbar, S.H.
            ├─ DIVISI PENGAWASAN — Najib Payudin
            │     └─ STAF DIVISI — Ardi Erfindo Wael
            ├─ DIVISI MEDIA INFOKOM — Yandi Nurarifiandi, S.Sos
            │     ├─ STAF DIVISI — Yudha Hafiz, S.BNS.
            │     ├─ STAF DIVISI — Ahmada Aliftano Nugroho, S.H.
            │     └─ STAF DIVISI — Muhammad Ihsan Naufal
            └─ DIVISI INVESTIGASI — Muhammad Faizal Amri
```

Roles use uppercase display; names are Title Case. This tree is hardcoded as typed
data (the DB `StrukturContent` flat `{level, nama}[]` cannot express the branches).

## Architecture

Three small, focused units under `src/components/tentang-kami/`:

- **`org-data.ts`** — typed org tree constant.
  ```ts
  type OrgVariant = "utama" | "divisi" | "staf";
  interface OrgNode { id: string; role: string; nama: string; variant: OrgVariant }
  ```
  Plus the exported tree/structure the layout consumes.

- **`org-card.tsx`** — one pill card. Props: node + hover callbacks + `highlighted`
  state. Renders role (bold, uppercase, navy) + name. Size/emphasis by `variant`.
  White rounded-full-ish pill, ring/shadow. `"use client"` not required on its own;
  it is used inside the client parent.

- **`struktur-org.tsx`** (`"use client"`) — the chart. Owns:
  - the bespoke desktop layout (matches SVG placement),
  - the CSS connectors,
  - reveal + hover state and animation orchestration,
  - keeps the existing page chrome (gradient header + `Card`/`CardContent` wrapper).
  - Accepts `data: StrukturContent` for interface compatibility (unused for layout).

## Layout

- **Desktop (≥ md):** bespoke sections reproducing the SVG:
  Pembina (top center) → left branch to Penasehat → Ketua (with Staf Khusus +
  Koordinator Keamanan to the right) → Sekjen & Bendahara flanking → SDM center →
  4 division columns, each with a vertical staff chain.
- **Mobile (< md):** everything reflows into a single readable vertical stack in
  hierarchy order; connectors become simple vertical links.

## Connectors

Drawn with **CSS pseudo-elements** (lines that grow via `scaleX` / `scaleY` with a
fixed `transform-origin`). No SVG coordinate computation — this stays responsive and
is directly animatable ("drawn" effect) and highlightable on hover.

## Animation

Chosen behaviors:
1. **Cascade reveal (top-down):** an `IntersectionObserver` on the chart sets a
   `revealed` flag; each card fades + slides up (`translateY`) with a staggered delay
   derived from its depth/order via a `--delay` CSS custom property.
2. **Connector draw:** connector lines animate scale `0 → 1`, synced with the cascade
   so lines appear to be drawn as each level reveals.
3. **Hover interaction:** hovering a card lifts/glows it and highlights the connector
   path up to its parent (hovered-node id in state → ancestor connectors get a
   `highlighted` class).

Not chosen: continuously animated background wave (background stays static).

## Background

The royal-blue wavy pattern is reproduced as a lightweight **inline SVG background**
tinted from the `--brand` token (so site recolor still works) — not the 1.4 MB raster.
Static.

## Accessibility & fidelity

- Respect `prefers-reduced-motion: reduce` → render fully revealed, no animation.
- Real, selectable text; meaningful heading/structure.
- Cards keyboard-focusable where hover highlight applies (focus mirrors hover).

## Scope / non-goals

- Only the contents of `StrukturOrg` change; wiring in `[slug]/page.tsx` is untouched.
- `public/struktur-lipanv2.svg` / `struktur-lipan.svg` are no longer loaded by this
  page (files may remain in repo).
- No DB schema/content changes; the flat `StrukturContent` stays for compatibility.

## Verification

- `pnpm lint` and `pnpm build` pass.
- Visual check (render the page) confirms 1:1 desktop match, mobile reflow, and the
  three animations; reduced-motion renders static.
