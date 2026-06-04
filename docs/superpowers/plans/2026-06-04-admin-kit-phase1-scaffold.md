# Admin Kit — Phase 1: Scaffold + Directive-Preservation Spike — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the `@blawness/admin-kit` package repo and prove that a `"use client"` React component plus shared utilities can be built, published-by-tag, and consumed by a Next.js 16 app with the directive intact.

**Architecture:** The package is built with `tsc` (no bundler — bundlers strip RSC directives). Consumers add `transpilePackages: ["@blawness/admin-kit"]` to `next.config`, so Next itself compiles the package source and preserves `"use client"`/`"use server"`. Distribution is a private Git dependency pinned to a tag. Phase 1 ships only leaf utilities + `ConfirmDelete` to de-risk the whole approach before moving the rest.

**Tech Stack:** TypeScript, React 19, Next.js 16, tsc, pnpm, lucide-react, base-ui (dialog primitive), Tailwind v4, GitHub (private repo), Vercel (consumer).

**Reference spec:** `docs/superpowers/specs/2026-06-04-admin-kit-extraction-design.md`

---

## Prerequisites (confirm before Task 1)

- `gh` CLI authenticated as the `Blawness` account (run `gh auth status`).
- pnpm v10 available (`pnpm -v`).
- The exact versions LIPAN uses for `react`, `react-dom`, `next`, `lucide-react`, and the base-ui dialog package — read them from `/home/blawness/projects/lipan-ri/package.json` so peer deps match. Record them; they are used in Task 2.

## File Structure (created in this phase)

New repo `admin-kit/` (separate working directory, e.g. `~/projects/admin-kit`):

```
admin-kit/
  package.json            # name @blawness/admin-kit, exports map, peer deps, build script
  tsconfig.json           # tsc build config, jsx preserve→react-jsx, declaration output
  .gitignore
  README.md
  src/
    lib/
      utils.ts            # cn() — copied from LIPAN src/lib/utils.ts
      slug.ts             # copied from LIPAN src/lib/slug.ts
      sanitize.ts         # copied from LIPAN src/lib/sanitize.ts
    components/
      confirm-delete.tsx  # "use client" component, dialog-based delete confirm
      ui/
        button.tsx        # copied from LIPAN src/components/ui/button.tsx
        dialog.tsx        # copied from LIPAN src/components/ui/dialog.tsx
    index.ts              # re-exports lib utils
    components.ts         # re-exports components (ConfirmDelete, Button, Dialog…)
  dist/                   # tsc output (gitignored; published via files or build-on-install)
```

> **Why `confirm-delete` is bundled with its `ui/` deps:** the package must be
> self-contained. It ships its own copies of `button.tsx` + `dialog.tsx` rather than
> expecting the consumer to provide them.

---

## Task 1: Create the package repo and base files

**Files:**
- Create: `~/projects/admin-kit/.gitignore`
- Create: `~/projects/admin-kit/README.md`

- [ ] **Step 1: Create the GitHub repo and clone it**

Run:
```bash
cd ~/projects
gh repo create Blawness/admin-kit --private --clone --description "Reusable CMS core for client projects"
cd admin-kit
```
Expected: a new empty repo cloned into `~/projects/admin-kit`.

- [ ] **Step 2: Add .gitignore**

Create `~/projects/admin-kit/.gitignore`:
```gitignore
node_modules/
dist/
*.tsbuildinfo
.DS_Store
```

- [ ] **Step 3: Add a minimal README**

Create `~/projects/admin-kit/README.md`:
```markdown
# @blawness/admin-kit

Reusable CMS core (auth, media, users, editor, admin shell, shared components)
extracted from the LIPAN RI site. Consumed as a private Git dependency.

## Consumer setup
1. `pnpm add github:Blawness/admin-kit#vX.Y.Z`
2. Add to `next.config`: `transpilePackages: ["@blawness/admin-kit"]`
3. Ensure Tailwind scans the package (see Tailwind section) and defines the
   `navy`/`brand`/`gold` tokens.
```

- [ ] **Step 4: Commit**

```bash
cd ~/projects/admin-kit
git add .gitignore README.md
git commit -m "chore: scaffold admin-kit repo"
```

---

## Task 2: package.json with exports map and peer deps

**Files:**
- Create: `~/projects/admin-kit/package.json`

- [ ] **Step 1: Write package.json**

Use the versions you recorded from LIPAN's package.json in the prereqs. Replace the
`PEER_*` placeholders with those exact version strings (e.g. `"^19.0.0"`).

Create `~/projects/admin-kit/package.json`:
```json
{
  "name": "@blawness/admin-kit",
  "version": "0.1.0",
  "private": false,
  "type": "module",
  "files": ["dist", "src"],
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    },
    "./components": {
      "types": "./dist/components.d.ts",
      "default": "./dist/components.js"
    }
  },
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "prepare": "tsc -p tsconfig.json"
  },
  "peerDependencies": {
    "react": "PEER_REACT",
    "react-dom": "PEER_REACT_DOM",
    "next": "PEER_NEXT"
  },
  "dependencies": {
    "lucide-react": "PEER_LUCIDE",
    "@base-ui/react": "PEER_BASE_UI"
  },
  "devDependencies": {
    "typescript": "^5",
    "@types/react": "PEER_TYPES_REACT",
    "@types/react-dom": "PEER_TYPES_REACT_DOM"
  }
}
```

> **Note on `prepare`:** because consumers install from Git, `prepare` runs `tsc`
> after install so `dist/` exists on the consumer. The `files` array also ships
> `src/` as a fallback for `transpilePackages`.

> **Note on base-ui:** confirm the exact dependency name LIPAN uses (the dialog
> import in `src/components/ui/dialog.tsx` is `@base-ui/react/dialog`). Use that
> package name and version for `PEER_BASE_UI`.

- [ ] **Step 2: Install deps**

Run:
```bash
cd ~/projects/admin-kit
pnpm install --ignore-workspace
```
Expected: lockfile created, `node_modules` populated, no errors.

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: package.json with exports map and peer deps"
```

---

## Task 3: tsconfig that preserves directives and emits declarations

**Files:**
- Create: `~/projects/admin-kit/tsconfig.json`

- [ ] **Step 1: Write tsconfig.json**

Create `~/projects/admin-kit/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "declaration": true,
    "declarationMap": true,
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "verbatimModuleSyntax": false,
    "baseUrl": "src",
    "paths": { "@/*": ["*"] }
  },
  "include": ["src"]
}
```

> **Why tsc, not tsup/esbuild:** `tsc` keeps top-of-file string-literal directives
> (`"use client"`) verbatim in its output. Bundlers commonly drop them. This is the
> core de-risking choice of Phase 1.

> **Path alias caveat:** `tsc` does NOT rewrite `@/` import paths in emitted JS.
> Therefore the package source must use **relative imports** (`../lib/utils`), not
> `@/`. Tasks 4–6 use relative imports for that reason.

- [ ] **Step 2: Commit**

```bash
git add tsconfig.json
git commit -m "chore: tsc build config (preserves directives, emits .d.ts)"
```

---

## Task 4: Port the leaf utilities

**Files:**
- Create: `~/projects/admin-kit/src/lib/utils.ts`
- Create: `~/projects/admin-kit/src/lib/slug.ts`
- Create: `~/projects/admin-kit/src/lib/sanitize.ts`
- Create: `~/projects/admin-kit/src/index.ts`

- [ ] **Step 1: Copy the three util files verbatim from LIPAN**

Run:
```bash
cd ~/projects/admin-kit
cp /home/blawness/projects/lipan-ri/src/lib/utils.ts src/lib/utils.ts
cp /home/blawness/projects/lipan-ri/src/lib/slug.ts src/lib/slug.ts
cp /home/blawness/projects/lipan-ri/src/lib/sanitize.ts src/lib/sanitize.ts
```

- [ ] **Step 2: Fix any `@/` imports inside the copied files to relative paths**

Open each copied file. If any imports use `@/...`, rewrite them to relative paths
(e.g. `@/lib/utils` → `./utils`). `utils.ts` (just `cn`) typically has none.
`sanitize.ts` may import a vendor lib (e.g. `isomorphic-dompurify`) — if so, add that
package to `dependencies` in package.json and run `pnpm install --ignore-workspace`.

- [ ] **Step 3: Write the barrel `src/index.ts`**

Create `~/projects/admin-kit/src/index.ts`:
```ts
export { cn } from "./lib/utils";
export { slugify } from "./lib/slug";
export { sanitizeHtml } from "./lib/sanitize";
```

> Adjust the named exports to match the actual exported symbols in each file
> (open them and confirm the function names; replace `slugify`/`sanitizeHtml` if the
> real names differ).

- [ ] **Step 4: Build and confirm output exists**

Run:
```bash
pnpm build
ls dist/lib/utils.js dist/index.js dist/index.d.ts
```
Expected: all three files exist, build exits 0.

- [ ] **Step 5: Commit**

```bash
git add src dist package.json pnpm-lock.yaml 2>/dev/null; git add src
git commit -m "feat: port leaf utilities (cn, slug, sanitize)"
```

---

## Task 5: Port Button + Dialog UI primitives

**Files:**
- Create: `~/projects/admin-kit/src/components/ui/button.tsx`
- Create: `~/projects/admin-kit/src/components/ui/dialog.tsx`

- [ ] **Step 1: Copy both primitives from LIPAN**

Run:
```bash
cd ~/projects/admin-kit
mkdir -p src/components/ui
cp /home/blawness/projects/lipan-ri/src/components/ui/button.tsx src/components/ui/button.tsx
cp /home/blawness/projects/lipan-ri/src/components/ui/dialog.tsx src/components/ui/dialog.tsx
```

- [ ] **Step 2: Rewrite their `@/` imports to relative paths**

In both files, change `@/lib/utils` → `../../lib/utils`. `dialog.tsx` imports
`@/components/ui/button` → change to `./button`. Confirm no other `@/` imports remain
(grep): `grep -n "@/" src/components/ui/*.tsx` should print nothing.

- [ ] **Step 3: Build**

Run:
```bash
pnpm build
```
Expected: exit 0.

- [ ] **Step 4: Verify the `"use client"` directive survived in the dialog output**

Run:
```bash
head -1 dist/components/ui/dialog.js
```
Expected: the first line is `"use client";` (or `'use client';`). **If it is NOT,
stop — the build strategy failed and the spec's primary risk has materialized;
report this immediately before continuing.**

- [ ] **Step 5: Commit**

```bash
git add src
git commit -m "feat: port Button + Dialog primitives"
```

---

## Task 6: Port ConfirmDelete and export it

**Files:**
- Create: `~/projects/admin-kit/src/components/confirm-delete.tsx`
- Create: `~/projects/admin-kit/src/components.ts`

- [ ] **Step 1: Copy ConfirmDelete from LIPAN**

Run:
```bash
cd ~/projects/admin-kit
cp /home/blawness/projects/lipan-ri/src/components/admin/confirm-delete.tsx src/components/confirm-delete.tsx
```

- [ ] **Step 2: Rewrite its imports to relative paths**

In `src/components/confirm-delete.tsx` change:
- `@/components/ui/button` → `./ui/button`
- `@/components/ui/dialog` → `./ui/dialog`

Confirm: `grep -n "@/" src/components/confirm-delete.tsx` prints nothing.

- [ ] **Step 3: Write the components barrel `src/components.ts`**

Create `~/projects/admin-kit/src/components.ts`:
```ts
export { ConfirmDelete } from "./components/confirm-delete";
export { Button } from "./components/ui/button";
export {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogFooter,
  DialogClose,
} from "./components/ui/dialog";
```

- [ ] **Step 4: Build and verify directive on ConfirmDelete output**

Run:
```bash
pnpm build
head -1 dist/components/confirm-delete.js
```
Expected: exit 0 and first line is `"use client";`.

- [ ] **Step 5: Commit and tag the first release**

```bash
git add src
git commit -m "feat: export ConfirmDelete (first shippable component)"
git tag v0.1.0
git push origin HEAD --tags
```
Expected: branch + tag `v0.1.0` pushed to GitHub.

---

## Task 7: Smoke-test consumption in a throwaway Next app

This proves a Next.js 16 app can install the Git dependency and render the
`"use client"` component without errors. Use a disposable directory; nothing here
touches LIPAN.

**Files:**
- Create: `~/tmp/admin-kit-smoke/` (throwaway Next app)

- [ ] **Step 1: Scaffold a throwaway Next 16 app**

Run:
```bash
cd ~/tmp 2>/dev/null || mkdir -p ~/tmp && cd ~/tmp
pnpm create next-app@latest admin-kit-smoke --ts --app --no-tailwind --no-src-dir --no-eslint --use-pnpm --yes
cd admin-kit-smoke
```
Expected: a runnable Next app. (If the create wizard differs, accept defaults; the
only requirement is a Next 16 App Router app.)

- [ ] **Step 2: Install admin-kit from the Git tag**

Run:
```bash
pnpm add github:Blawness/admin-kit#v0.1.0
```
Expected: install succeeds; `prepare` builds `dist/` inside node_modules.

- [ ] **Step 3: Enable transpilePackages**

Edit `next.config.ts` (or `.mjs`) to include:
```ts
const nextConfig = {
  transpilePackages: ["@blawness/admin-kit"],
};
export default nextConfig;
```

- [ ] **Step 4: Use the component on the home page**

Replace `app/page.tsx` with:
```tsx
import { ConfirmDelete } from "@blawness/admin-kit/components";

async function noop() {
  "use server";
}

export default function Home() {
  return (
    <main style={{ padding: 40 }}>
      <h1>admin-kit smoke test</h1>
      <ConfirmDelete action={noop} id={1} title="Hapus?" />
    </main>
  );
}
```

- [ ] **Step 5: Build the smoke app**

Run:
```bash
pnpm build
```
Expected: build exits 0 with no "use client"/"Server Actions" errors. **If the build
fails on directive/RSC errors, the strategy needs revision — report before
proceeding to Phase 2.**

- [ ] **Step 6: Run it and eyeball the component**

Run:
```bash
pnpm dev
```
Open `http://localhost:3000`. Expected: page renders; clicking the trash button opens
the confirm dialog (it will be unstyled — Tailwind tokens are intentionally out of
scope for Phase 1; styling integration is handled in Phase 3).

- [ ] **Step 7: Record the result**

In the `admin-kit` repo, append a short note to `README.md` under a new
`## Phase 1 result` heading stating: directive preservation confirmed (yes/no),
Next version tested, and any gotchas found. Commit:
```bash
cd ~/projects/admin-kit
git add README.md
git commit -m "docs: record Phase 1 spike result"
git push
```

---

## Definition of Done (Phase 1)

- `@blawness/admin-kit` repo exists, builds with `tsc`, tagged `v0.1.0`.
- `dist/components/confirm-delete.js` and `dist/components/ui/dialog.js` retain the
  `"use client";` directive on line 1.
- A throwaway Next 16 app installs the Git dependency, sets `transpilePackages`, and
  builds + renders `ConfirmDelete` with no RSC/directive errors.
- Phase 1 result recorded in the package README.

**Gate to Phase 2:** all of the above green. If directive preservation failed at any
verify step, do not start Phase 2 — revisit the build strategy first.

---

## Self-Review notes

- **Spec coverage (Phase 1 slice):** distribution via Git tag (Task 6), directive
  preservation as primary risk (Tasks 5–7 verify), self-contained UI primitives
  (Task 5), exports map (Task 2). Tailwind tokens, auth, media/users, schema, and the
  5 couplings are intentionally deferred to Phases 2–3 per the decomposition.
- **No placeholders** except the deliberate `PEER_*` version tokens in Task 2, which
  the engineer fills from LIPAN's package.json (instruction given in prereqs + Task 2
  Step 1) — these are data to look up, not undefined behavior.
- **Type/name consistency:** barrel exports in Tasks 4 & 6 instruct confirming actual
  exported symbol names against the source files before finalizing, avoiding
  guessed-name drift.
