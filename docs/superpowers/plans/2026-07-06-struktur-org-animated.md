# Struktur Organisasi Animated Component Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the embedded 1.4 MB SVG org chart with a native, themeable, responsive, animated React component that is visually 1:1 with the SVG on desktop.

**Architecture:** Three focused units under `src/components/tentang-kami/`: a typed org-tree data constant (`org-data.ts`), a single pill card (`org-card.tsx`), and a `"use client"` chart (`struktur-org.tsx`) that owns the bespoke desktop layout, CSS pseudo-element connectors, and animation orchestration (IntersectionObserver reveal + connector draw + hover highlight). Existing page chrome (gradient header + Card wrapper) is preserved. The chart consumes hardcoded tree data, not the DB flat list.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind v4 (`@import "tailwindcss"`, `hsl(var(--brand))` token), shadcn base-nova (`Card`/`CardContent`).

## Global Constraints

- Path alias `@/` → `./src/*`.
- Tailwind v4: brand color via `bg-brand-500` / `hsl(var(--brand))`; navy scale `navy-50..950` exists; do NOT introduce new hardcoded royal-blue hexes — use the brand token so site recolor works.
- All Tentang Kami page pieces are Server Components by default; anything with hooks/state/IntersectionObserver/hover MUST start with `"use client"`.
- No shadcn `asChild`; use `render` prop if a Button is ever needed (not needed here).
- Locale Indonesian (id_ID) for all UI text; role labels UPPERCASE, names Title Case.
- No unit-test framework configured. Verification per task = `pnpm lint` + `pnpm build` (+ visual render on the final task). Never claim done without lint+build passing.
- Respect `prefers-reduced-motion: reduce` (render fully revealed, no motion).
- Keep the existing `StrukturOrg` export signature `({ data }: { data: StrukturContent })` so `[slug]/page.tsx:60` keeps working.

---

### Task 1: Org tree data constant

**Files:**
- Create: `src/components/tentang-kami/org-data.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `type OrgVariant = "utama" | "divisi" | "staf"`
  - `interface OrgMember { id: string; role: string; nama: string; variant: OrgVariant }`
  - `interface Divisi { head: OrgMember; staf: OrgMember[] }`
  - `interface OrgStruktur { pembina: OrgMember; penasehat: OrgMember; ketua: OrgMember; stafKhusus: OrgMember[]; sekjen: OrgMember; bendahara: OrgMember; sdm: OrgMember; divisi: Divisi[] }`
  - `const ORG: OrgStruktur` (default-ish named export) with the exact data below.

- [ ] **Step 1: Create the data file**

```ts
// src/components/tentang-kami/org-data.ts
export type OrgVariant = "utama" | "divisi" | "staf";

export interface OrgMember {
  id: string;
  role: string;
  nama: string;
  variant: OrgVariant;
}

export interface Divisi {
  head: OrgMember;
  staf: OrgMember[];
}

export interface OrgStruktur {
  pembina: OrgMember;
  penasehat: OrgMember;
  ketua: OrgMember;
  stafKhusus: OrgMember[];
  sekjen: OrgMember;
  bendahara: OrgMember;
  sdm: OrgMember;
  divisi: Divisi[];
}

export const ORG: OrgStruktur = {
  pembina: { id: "pembina", role: "Dewan Pembina", nama: "Hengki Putra Juwita", variant: "utama" },
  penasehat: { id: "penasehat", role: "Dewan Penasehat/Kehormatan", nama: "Sri Hartono Sasongko", variant: "utama" },
  ketua: { id: "ketua", role: "Ketua", nama: "Harun Prayitno, S.E., S.H., M.H.", variant: "utama" },
  stafKhusus: [
    { id: "staf-khusus", role: "Staf Khusus Ketua", nama: "Wiryanto, S.T.", variant: "utama" },
    { id: "koordinator-keamanan", role: "Koordinator Keamanan", nama: "Mulkan Lessy Tussen", variant: "utama" },
  ],
  sekjen: { id: "sekjen", role: "Sekretaris Jenderal", nama: "Cahya Puspita Rini, S.E.", variant: "utama" },
  bendahara: { id: "bendahara", role: "Bendahara Umum", nama: "Velia Dwi Yulianti, S.E.", variant: "utama" },
  sdm: { id: "sdm", role: "SDM dan Umum", nama: "Ruswondo Awidjan, S.H.", variant: "utama" },
  divisi: [
    {
      head: { id: "div-hukum", role: "Divisi Bantuan Hukum & HAM", nama: "Annisa Novianty, S.H., M.H.", variant: "divisi" },
      staf: [
        { id: "hukum-1", role: "Staf Divisi", nama: "Adam Maulana Hafiz, S.H.", variant: "staf" },
        { id: "hukum-2", role: "Staf Divisi", nama: "Firdausi Aglis Akbar, S.H.", variant: "staf" },
      ],
    },
    {
      head: { id: "div-pengawasan", role: "Divisi Pengawasan", nama: "Najib Payudin", variant: "divisi" },
      staf: [
        { id: "pengawasan-1", role: "Staf Divisi", nama: "Ardi Erfindo Wael", variant: "staf" },
      ],
    },
    {
      head: { id: "div-media", role: "Divisi Media Infokom", nama: "Yandi Nurarifiandi, S.Sos", variant: "divisi" },
      staf: [
        { id: "media-1", role: "Staf Divisi", nama: "Yudha Hafiz, S.BNS.", variant: "staf" },
        { id: "media-2", role: "Staf Divisi", nama: "Ahmada Aliftano Nugroho, S.H.", variant: "staf" },
        { id: "media-3", role: "Staf Divisi", nama: "Muhammad Ihsan Naufal", variant: "staf" },
      ],
    },
    {
      head: { id: "div-investigasi", role: "Divisi Investigasi", nama: "Muhammad Faizal Amri", variant: "divisi" },
      staf: [],
    },
  ],
};
```

- [ ] **Step 2: Typecheck**

Run: `pnpm lint`
Expected: PASS (no unused/type errors for the new file).

- [ ] **Step 3: Commit**

```bash
git add src/components/tentang-kami/org-data.ts
git commit -m "feat(struktur): typed org tree data constant"
```

---

### Task 2: Org card component

**Files:**
- Create: `src/components/tentang-kami/org-card.tsx`

**Interfaces:**
- Consumes: `OrgMember`, `OrgVariant` from `./org-data`.
- Produces:
  ```ts
  interface OrgCardProps {
    member: OrgMember;
    highlighted?: boolean;      // connector/hover path highlight
    onActivate?: (id: string) => void;   // hover-in / focus
    onDeactivate?: () => void;            // hover-out / blur
  }
  export function OrgCard(props: OrgCardProps): JSX.Element
  ```
  Renders a white pill: role (uppercase, bold, `text-navy-800`) + name (`text-navy-500`). Variant controls padding/min-width/font-size. Focusable (`tabIndex={0}`). Reveal is driven by the parent via a `data-reveal` mechanism / CSS var `--delay` set on the wrapping element by the parent, so the card itself just needs a `.org-card` class and reveal styles that the parent's CSS targets. Hover/focus call `onActivate(member.id)` / `onDeactivate()`.

- [ ] **Step 1: Create the card**

```tsx
// src/components/tentang-kami/org-card.tsx
import type { OrgMember } from "./org-data";

interface OrgCardProps {
  member: OrgMember;
  highlighted?: boolean;
  onActivate?: (id: string) => void;
  onDeactivate?: () => void;
}

const variantClass: Record<OrgMember["variant"], string> = {
  utama: "px-6 py-3 min-w-[200px] max-w-[260px]",
  divisi: "px-5 py-2.5 min-w-[180px] max-w-[220px]",
  staf: "px-5 py-2.5 min-w-[180px] max-w-[220px]",
};

export function OrgCard({ member, highlighted, onActivate, onDeactivate }: OrgCardProps) {
  return (
    <div
      tabIndex={0}
      onMouseEnter={() => onActivate?.(member.id)}
      onMouseLeave={() => onDeactivate?.()}
      onFocus={() => onActivate?.(member.id)}
      onBlur={() => onDeactivate?.()}
      data-highlighted={highlighted ? "" : undefined}
      className={[
        "org-card group relative z-10 rounded-2xl bg-white text-center shadow-sm ring-1 ring-navy-100/70",
        "outline-none transition duration-300 will-change-transform",
        "hover:-translate-y-1 hover:shadow-lg hover:ring-brand-400",
        "focus-visible:-translate-y-1 focus-visible:shadow-lg focus-visible:ring-brand-500",
        "data-[highlighted]:ring-brand-400 data-[highlighted]:shadow-lg",
        variantClass[member.variant],
      ].join(" ")}
    >
      <p className="text-[11px] font-bold uppercase leading-tight tracking-wide text-navy-800">
        {member.role}
      </p>
      <p className="mt-0.5 text-xs leading-tight text-navy-500">{member.nama}</p>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm lint`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/tentang-kami/org-card.tsx
git commit -m "feat(struktur): org pill card component"
```

---

### Task 3: Reveal + hover animation CSS

**Files:**
- Modify: `src/app/globals.css` (append a scoped block near the other `@layer`/utility blocks, e.g. after the `.gradient-hero`/`.gold-line` utilities around line 204)

**Interfaces:**
- Consumes: nothing (pure CSS).
- Produces CSS the chart markup relies on:
  - `.struktur-chart` — root; when it has class `is-revealed`, descendants animate in.
  - `.org-card` — starts `opacity:0; translateY(12px)`; revealed → visible, with `transition-delay: var(--delay, 0ms)`.
  - `.org-connector` — a line; `--dir: x | y`; starts `scaleX(0)`/`scaleY(0)` from a fixed origin; revealed → `scale(1)` with `transition-delay: var(--delay, 0ms)`.
  - `.org-connector[data-highlighted]` — brand-tinted, thicker.
  - `.struktur-bg` — inline-SVG wavy background utility (used in Task 5; defined here).
  - `@media (prefers-reduced-motion: reduce)` — everything final state, no transition.

- [ ] **Step 1: Append the CSS**

```css
/* ── Struktur organisasi (animated org chart) ───────────────────────── */
@layer components {
  .struktur-chart .org-card {
    opacity: 0;
    transform: translateY(12px);
    transition: opacity 0.5s ease, transform 0.5s ease, box-shadow 0.3s ease, --tw-ring-color 0.3s ease;
    transition-delay: var(--delay, 0ms);
  }
  .struktur-chart.is-revealed .org-card {
    opacity: 1;
    transform: translateY(0);
  }

  .org-connector {
    background: rgba(255, 255, 255, 0.85);
    transition: transform 0.4s ease, background 0.3s ease, box-shadow 0.3s ease;
    transition-delay: var(--delay, 0ms);
  }
  .struktur-chart .org-connector[data-dir="x"] { transform: scaleX(0); transform-origin: left center; }
  .struktur-chart .org-connector[data-dir="x-right"] { transform: scaleX(0); transform-origin: right center; }
  .struktur-chart .org-connector[data-dir="y"] { transform: scaleY(0); transform-origin: top center; }
  .struktur-chart.is-revealed .org-connector { transform: scale(1); }

  .org-connector[data-highlighted] {
    background: hsl(var(--brand));
    box-shadow: 0 0 8px hsl(var(--brand) / 0.7);
  }

  .struktur-bg {
    background-color: hsl(var(--brand));
    background-image: var(--struktur-wave);
    background-size: 320px 180px;
  }

  @media (prefers-reduced-motion: reduce) {
    .struktur-chart .org-card,
    .struktur-chart .org-connector {
      opacity: 1 !important;
      transform: none !important;
      transition: none !important;
    }
  }
}
```

- [ ] **Step 2: Verify build still compiles CSS**

Run: `pnpm lint`
Expected: PASS (CSS is not linted by ESLint, but ensures no import breakage).

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "feat(struktur): reveal + connector-draw + hover CSS"
```

---

### Task 4: Chart layout + connectors + animation (desktop & mobile)

**Files:**
- Rewrite: `src/components/tentang-kami/struktur-org.tsx`

**Interfaces:**
- Consumes: `ORG`, types from `./org-data`; `OrgCard` from `./org-card`; `Card`, `CardContent` from `@/components/ui/card`; `StrukturContent` from `@/lib/page-content`.
- Produces: `export function StrukturOrg({ data }: { data: StrukturContent })` (unchanged signature; `data` unused for layout).

Notes for the implementer:
- Component is `"use client"` (IntersectionObserver + hover state).
- Reveal: `useRef` on the `.struktur-chart` root; `useEffect` sets up an `IntersectionObserver` (threshold 0.15) that adds `is-revealed` (via a `revealed` state class) once, then disconnects.
- Stagger: pass an incrementing `--delay` inline style per row so cards cascade top→bottom. Use a small helper `delay(n) => ({ ["--delay" as string]: \`${n * 90}ms\` })`.
- Hover highlight: `useState<string | null>(activeId)`; compute the set of ancestor ids for the active node (`ancestors(activeId)`), pass `highlighted` to cards and `data-highlighted` to connectors on that path. Keep a static `PARENT` map for ancestry.
- Connectors are `<span className="org-connector" data-dir=... />` positioned with flex/absolute inside each layout section. Do NOT compute pixel coordinates; rely on flin the JSX below.
- Desktop layout is `hidden md:flex`; mobile layout is `md:hidden` and renders the same data as a simple vertical stack with short vertical connectors.

- [ ] **Step 1: Write the component**

```tsx
// src/components/tentang-kami/struktur-org.tsx
"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { StrukturContent } from "@/lib/page-content";
import { ORG, type OrgMember } from "./org-data";
import { OrgCard } from "./org-card";

// Ancestry for hover-path highlight (child id -> parent id).
const PARENT: Record<string, string> = {
  ketua: "pembina",
  penasehat: "pembina",
  "staf-khusus": "ketua",
  "koordinator-keamanan": "ketua",
  sekjen: "ketua",
  bendahara: "ketua",
  sdm: "ketua",
  ...Object.fromEntries(ORG.divisi.map((d) => [d.head.id, "sdm"])),
  ...Object.fromEntries(
    ORG.divisi.flatMap((d) => d.staf.map((s) => [s.id, d.head.id])),
  ),
};

function ancestors(id: string | null): Set<string> {
  const set = new Set<string>();
  let cur = id;
  while (cur) {
    set.add(cur);
    cur = PARENT[cur] ?? null;
  }
  return set;
}

const delay = (n: number): CSSProperties => ({ ["--delay" as string]: `${n * 90}ms` });

export function StrukturOrg({}: { data: StrukturContent }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const path = ancestors(active);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setRevealed(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const cardProps = (m: OrgMember) => ({
    member: m,
    highlighted: path.has(m.id),
    onActivate: setActive,
    onDeactivate: () => setActive(null),
  });

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="gradient-hero relative mb-8 overflow-hidden rounded-2xl border-l-4 border-brand-500 p-8 text-white ring-1 ring-navy-100">
        <h1 className="text-2xl font-bold md:text-3xl">Struktur Organisasi</h1>
        <p className="mt-1 text-sm text-navy-100">Susunan kepengurusan LIPAN RI</p>
      </div>

      <Card className="overflow-hidden border-navy-100 py-0">
        <CardContent className="p-0">
          <div
            ref={rootRef}
            className={`struktur-bg struktur-chart ${revealed ? "is-revealed" : ""} p-6 md:p-10`}
          >
            {/* ── Desktop ─────────────────────────────────────────── */}
            <div className="hidden flex-col items-center md:flex">
              {/* Pembina */}
              <div style={delay(0)}>
                <OrgCard {...cardProps(ORG.pembina)} />
              </div>

              {/* trunk + penasehat side-branch */}
              <span className="org-connector" data-dir="y" data-highlighted={path.has("ketua") ? "" : undefined} style={{ ...delay(1), width: 3, height: 28 }} />
              <div className="relative flex w-full items-start justify-center">
                <div className="absolute left-1/2 top-6 hidden -translate-x-full items-center lg:flex" style={{ width: "22%" }}>
                  <span className="org-connector" data-dir="x-right" data-highlighted={path.has("penasehat") ? "" : undefined} style={{ ...delay(1), height: 3, flex: 1 }} />
                  <div style={delay(1)}>
                    <OrgCard {...cardProps(ORG.penasehat)} />
                  </div>
                </div>
                <div style={delay(1)}>
                  <OrgCard {...cardProps(ORG.ketua)} />
                </div>
                {/* Ketua right-side children */}
                <div className="absolute left-1/2 top-3 flex translate-x-[120px] items-center gap-4">
                  <span className="org-connector" data-dir="x" data-highlighted={path.has("staf-khusus") || path.has("koordinator-keamanan") ? "" : undefined} style={{ ...delay(2), height: 3, width: 40 }} />
                  <div className="flex gap-4">
                    {ORG.stafKhusus.map((m) => (
                      <div key={m.id} style={delay(2)}>
                        <OrgCard {...cardProps(m)} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Ketua -> Sekjen/Bendahara/SDM */}
              <span className="org-connector" data-dir="y" data-highlighted={path.has("sdm") ? "" : undefined} style={{ ...delay(2), width: 3, height: 28 }} />
              <div className="flex w-full items-center justify-center gap-6">
                <div style={delay(3)}>
                  <OrgCard {...cardProps(ORG.sekjen)} />
                </div>
                <div style={delay(3)}>
                  <OrgCard {...cardProps(ORG.sdm)} />
                </div>
                <div style={delay(3)}>
                  <OrgCard {...cardProps(ORG.bendahara)} />
                </div>
              </div>

              {/* SDM -> divisi row */}
              <span className="org-connector" data-dir="y" style={{ ...delay(4), width: 3, height: 28 }} />
              <div className="grid w-full grid-cols-4 gap-4">
                {ORG.divisi.map((d, i) => (
                  <div key={d.head.id} className="flex flex-col items-center gap-3" style={delay(4 + i * 0.25)}>
                    <OrgCard {...cardProps(d.head)} />
                    {d.staf.map((s, j) => (
                      <div key={s.id} className="flex flex-col items-center" style={delay(5 + i * 0.25 + j * 0.25)}>
                        <span className="org-connector" data-dir="y" data-highlighted={path.has(s.id) ? "" : undefined} style={{ width: 3, height: 16 }} />
                        <OrgCard {...cardProps(s)} />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* ── Mobile: vertical stack ──────────────────────────── */}
            <div className="flex flex-col items-center gap-2 md:hidden">
              {[
                ORG.pembina,
                ORG.penasehat,
                ORG.ketua,
                ...ORG.stafKhusus,
                ORG.sekjen,
                ORG.bendahara,
                ORG.sdm,
                ...ORG.divisi.flatMap((d) => [d.head, ...d.staf]),
              ].map((m, i) => (
                <div key={m.id} className="flex flex-col items-center" style={delay(i)}>
                  {i > 0 && <span className="org-connector" data-dir="y" style={{ width: 3, height: 14 }} />}
                  <OrgCard {...cardProps(m)} />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Lint**

Run: `pnpm lint`
Expected: PASS. If ESLint flags the empty-object destructure `({}: {...})`, keep it — it mirrors the original file's signature; adjust only if the rule errors, by using `(_props: { data: StrukturContent })`.

- [ ] **Step 3: Commit**

```bash
git add src/components/tentang-kami/struktur-org.tsx
git commit -m "feat(struktur): animated 1:1 org chart component"
```

---

### Task 5: Wavy background token + final verification

**Files:**
- Modify: `src/app/globals.css` (add the `--struktur-wave` custom property to `:root`, near the other `:root` tokens around line 90)

**Interfaces:**
- Consumes: the `.struktur-bg` rule from Task 3 (`background-image: var(--struktur-wave)`).
- Produces: `--struktur-wave` — an inline data-URI SVG of subtle white wavy lines at low opacity, tiling over `hsl(var(--brand))`.

- [ ] **Step 1: Add the wave token to `:root`**

```css
  /* Subtle wavy pattern for struktur background (white lines over --brand) */
  --struktur-wave: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='180' viewBox='0 0 320 180'%3E%3Cg fill='none' stroke='%23ffffff' stroke-opacity='0.06' stroke-width='2'%3E%3Cpath d='M-20 30 C 60 0 100 60 160 30 S 260 0 340 30'/%3E%3Cpath d='M-20 75 C 60 45 100 105 160 75 S 260 45 340 75'/%3E%3Cpath d='M-20 120 C 60 90 100 150 160 120 S 260 90 340 120'/%3E%3Cpath d='M-20 165 C 60 135 100 195 160 165 S 260 135 340 165'/%3E%3C/g%3E%3C/svg%3E");
```

- [ ] **Step 2: Lint + build**

Run: `pnpm lint && pnpm build`
Expected: both PASS.

- [ ] **Step 3: Visual verification (render the page)**

Start the dev server and open the struktur page (the slug that maps to the `struktur` content type — check the `pages` table / `[slug]` route). Confirm:
- Desktop ≥ md: layout matches the SVG (Pembina top, Penasehat left branch, Ketua with two right-side cards, Sekjen/SDM/Bendahara row, 4 divisi columns with staff chains), white pills on brand-blue wavy background.
- On scroll into view: cards cascade top→bottom and connectors draw in.
- Hover a staff/division card: it lifts and the connector path up to its ancestor highlights in brand color.
- Resize to < md: everything stacks vertically and stays readable.
- With OS "reduce motion" on: chart renders fully, no animation.

Use `pnpm e2e` infra or a manual browser pass (Playwright is available per project setup). Capture one desktop screenshot to compare against `public/struktur-lipanv2.svg`.

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css
git commit -m "feat(struktur): wavy brand-tinted background token"
```

---

## Self-Review Notes

- **Spec coverage:** data tree (T1), pill cards (T2), reveal+connector-draw+hover CSS (T3), bespoke desktop layout + mobile reflow + IntersectionObserver + hover-path state (T4), brand-tinted wavy bg + reduced-motion + verification (T3/T5). Interface signature preserved (T4). All spec sections mapped.
- **Placeholder scan:** no TBD/TODO; every code step contains full code.
- **Type consistency:** `OrgMember`/`OrgVariant`/`ORG` names consistent across T1→T2→T4; `--delay`/`.org-card`/`.org-connector`/`.struktur-chart`/`.struktur-bg`/`--struktur-wave` class/var names consistent across T3→T4→T5.
- **Known refinement risk:** the absolute-positioned Ketua right-side cards and Penasehat branch use approximate offsets (`translate-x-[120px]`, `22%`); Step 3 of Task 5 is where these get nudged to match the SVG. This is expected polish, not a placeholder.
