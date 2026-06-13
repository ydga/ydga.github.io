# Starter Kit — Implementation Plan (Agent Brief)

**Vault (personal project):** `~/Documents/margarita/05 Projects/Starter Kit/` — hub [[Starter Kit]] in Obsidian.

**Read this file first.** It contains the full product intent, locked decisions, architecture, and phased tasks. No prior chat context required.

---

## 1. Product summary

**Name:** Starter Kit (working title)

**One-liner:** Pick a look → download a themed shadcn repo **and** a matching Figma library in one step — no design system expertise required.

**Repo:** `ydga.github.io` (GitHub Pages now; Vercel optional later)

**User:** Anyone who wants a branded product foundation quickly — designers, devs, or non-experts. They do **not** need to understand design tokens, Storybook, or Figma library setup.

### What the user gets (single download)

One **`.zip`** named `{project-name}-starter-kit.zip`:

| Folder          | Contents                                                                           |
| --------------- | ---------------------------------------------------------------------------------- |
| **`code/`**     | Runnable Next.js + shadcn, 12 core components, light + dark theme applied          |
| **`figma/`**    | Themed variables JSON, component manifest, README, duplicate link (when available) |
| **`make-kit/`** | Figma Make guidelines (setup + tokens + per-component docs)                        |

### User journey

1. Open app on GitHub Pages
2. Pick a **preset look** (Minimal, SaaS, Warm, Bold, Neutral)
3. Optionally tweak: **brand color**, **font** (curated list), **radius** (soft / default / sharp)
4. Preview **12 components** in light/dark
5. Enter project name → **Download ZIP**
6. Follow root `README.md`: `pnpm install`, duplicate Figma file, optional Make kit setup

**No login.** Theme draft in `localStorage`. Warn on leave if not downloaded.

---

## 2. Locked decisions (do not re-litigate)

| Topic                | Decision                                                                      |
| -------------------- | ----------------------------------------------------------------------------- |
| Auth                 | None in v1                                                                    |
| Persistence          | `localStorage` only; see `docs/SESSION.md`                                    |
| Export               | Client-side ZIP (JSZip) in browser                                            |
| GitHub upload        | Manual by user after download                                                 |
| Theme model          | **Presets + 3 tweak dimensions** — NOT custom semantic token groups           |
| Components           | **12 core only** — same set in code, Figma, Make docs                         |
| shadcn stack         | Next.js App Router, Tailwind v4, new-york style                               |
| Preview              | In-app component gallery — NOT Storybook-as-product for MVP                   |
| Figma                | Dual export is **required** for product promise; delivery mechanism swappable |
| Figma Make           | Include `make-kit/guidelines/` in every export                                |
| A11y                 | Contrast warnings in UI only; never block download                            |
| Sync                 | None after download — user owns artifacts                                     |
| Code Connect         | Out of scope v1                                                               |
| Full shadcn registry | Out of scope v1                                                               |

---

## 3. Core component set (v1)

Implement identically in **code template**, **Figma master**, and **Make guidelines**:

1. Button
2. Input
3. Textarea
4. Select
5. Checkbox
6. Card
7. Dialog
8. Alert
9. Badge
10. Tabs
11. Table
12. Dropdown Menu

---

## 4. Presets & tweaks

### Presets (`packages/theme-presets/`)

Each preset is JSON defining complete **light + dark** shadcn CSS variable sets:

| Preset      | Character                                    |
| ----------- | -------------------------------------------- |
| **Neutral** | Default-ish shadcn; use as initial selection |
| **Minimal** | Muted neutrals, smaller radius               |
| **SaaS**    | Blue primary, default radius                 |
| **Warm**    | Warm neutrals, soft radius                   |
| **Bold**    | Strong contrast accent, sharp radius         |

### User tweaks (applied on preset)

| Tweak       | UI control                                | Internal effect                                            |
| ----------- | ----------------------------------------- | ---------------------------------------------------------- |
| Brand color | Color picker (seeded from preset primary) | Regenerate primary + primary-foreground (+ ring if needed) |
| Font        | Select (~5–8 safe pairs)                  | `--font-sans` and imports in layout                        |
| Radius      | 3 options: soft / default / sharp         | `--radius` scale                                           |

### Theme engine output (`packages/theme-engine/`)

Single function: `buildTheme({ preset, tweaks, mode })` →

```typescript
{
  css: string;                    // globals.css theme block
  figmaVariables: object;         // Figma Variables import JSON
  makeGuidelines: {
    setup: string;
    tokens: { colors: string; typography: string; radius: string };
    components: Record<string, string>;  // 12 files
  };
  dtcg?: object;                  // optional, under code/tokens/
  themeSummary: string;           // plain English for THEME.md
}
```

**Rule:** Same numeric/color values in CSS and Figma JSON always.

---

## 5. Export ZIP structure

```
{project-name}-starter-kit.zip
├── README.md
├── code/
│   ├── README.md
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx              # simple demo page
│   │   └── globals.css           # GENERATED
│   ├── components/ui/            # 12 components
│   ├── lib/utils.ts
│   ├── tokens/
│   │   ├── THEME.md              # plain English summary
│   │   └── theme.tokens.json     # optional DTCG
│   ├── package.json
│   ├── tsconfig.json
│   ├── postcss.config.mjs
│   └── components.json
├── figma/
│   ├── README.md
│   ├── variables.json            # GENERATED
│   ├── manifest.json             # component ↔ code mapping, variants
│   └── LINK.txt                  # duplicate URL (empty until P4)
└── make-kit/
    ├── README.md
    └── guidelines/
        ├── setup.md                # GENERATED
        ├── tokens/
        │   ├── colors.md           # GENERATED
        │   ├── typography.md       # GENERATED
        │   └── radius.md           # GENERATED
        └── components/
            ├── button.md           # GENERATED (+ 11 more)
            └── ...
```

Root `README.md` must get a non-expert from ZIP → running app → Figma duplicate in **< 15 minutes**.

---

## 6. Figma strategy

### Golden master (maintained in `figma-master/`)

- One Figma file: 12 components, props/variants aligned to shadcn
- All fills/text bound to **Figma Variables** (light/dark modes)
- Document file key in `figma-master/MANIFEST.md`
- Update via Figma MCP in dev — not runtime

### Delivery tiers (implement in order)

| Tier    | Method                                                             | When                                 |
| ------- | ------------------------------------------------------------------ | ------------------------------------ |
| **T2**  | User duplicates public Community master + imports `variables.json` | P2 launch fallback                   |
| **T2b** | Bundled Figma plugin instructions to apply variables               | P4 if no API                         |
| **T1**  | Service duplicates master, applies variables, writes `LINK.txt`    | P4 if `FIGMA_ACCESS_TOKEN` available |

Do not block P3 MVP on T1. Ship T2 first; add T1 when token exists.

### `figma/manifest.json` shape

```json
{
  "version": "1.0.0",
  "components": [
    {
      "name": "Button",
      "codePath": "components/ui/button.tsx",
      "figmaComponentName": "Button",
      "variants": ["default", "destructive", "outline", "secondary", "ghost", "link"],
      "sizes": ["default", "sm", "lg", "icon"]
    }
  ]
}
```

---

## 7. Figma Make kit

Follow Figma’s guidelines structure: https://developers.figma.com/docs/code/write-design-system-guidelines/

**Base templates** live in `make-kit-template/`. Theme engine **fills** token values and preset-specific copy at export.

**`make-kit/README.md`** (static template) explains:

1. Duplicate themed Figma library from `figma/`
2. In Figma Make, create/assemble kit with library variables/styles
3. Upload `make-kit/guidelines/` folder
4. Optional: publish `code/` to npm for code context (advanced)

Free Figma users: library + guidelines path is sufficient for v1.

---

## 8. Monorepo layout

```
ydga.github.io/
├── apps/
│   └── web/                      # Vite or Next static export — GitHub Pages
├── packages/
│   ├── theme-presets/
│   ├── theme-engine/
│   ├── component-preview/        # 12 components for in-app gallery
│   ├── repo-template/            # Static files merged into code/
│   ├── export/                   # buildZip({ projectName, theme })
│   └── a11y-rules/
├── figma-master/                 # MANIFEST.md, docs, MCP refresh notes
├── make-kit-template/            # Static guideline templates
├── docs/
│   ├── ARCHITECTURE.md           # Product + technical overview
│   ├── SESSION.md
│   └── IMPLEMENTATION_PLAN.md    # This file
├── .github/workflows/
│   └── deploy-pages.yml          # Build apps/web → GitHub Pages
├── package.json                  # pnpm workspaces root
├── pnpm-workspace.yaml
└── turbo.json                    # optional
```

### Tooling

- **pnpm** workspaces
- **TypeScript** everywhere
- **Zod** for preset/tweak validation
- **JSZip** for client export
- **Vitest** for theme-engine unit tests (CSS ↔ Figma value parity)
- **apps/web:** Vite + React recommended (simpler static export for Pages than Next)

### GitHub Pages

- Base path: `/` if custom domain `ydga.github.io`, else `/ydga.github.io/` — configure in Vite `base`
- Deploy on push to `main`

---

## 9. Web app (`apps/web`) — MVP screens

No visual design spec yet. Implement functional UI:

1. **Landing** — one sentence value prop + “Get started”
2. **Builder** (single page or steps)
   - Preset cards (5)
   - Tweak panel (color, font, radius)
   - Light/dark toggle
   - Project name input
   - Component preview grid (12)
   - Contrast warning banner (conditional)
   - Download button
3. **beforeunload** warning per `docs/SESSION.md`

State: read/write `localStorage` key `starter-kit-v1`.

---

## 10. Implementation phases

### P0 — Monorepo scaffold

**Goal:** Empty structure builds and deploys.

- [ ] Init pnpm monorepo, TS, shared eslint/prettier
- [ ] `packages/theme-presets` — 5 preset JSON files + types
- [ ] `packages/theme-engine` — `buildTheme()` returns CSS + figmaVariables (Make stubs OK)
- [ ] Unit tests: each preset produces valid CSS; light/dark differ
- [ ] `apps/web` — hello world, GitHub Actions → Pages
- [ ] Root scripts: `pnpm dev`, `pnpm build`, `pnpm test`

**Done when:** CI green, site live on GitHub Pages.

---

### P1 — Golden Figma master (parallel / manual)

**Goal:** Source Figma file for 12 components.

- [ ] Create Figma file with variable collections (light/dark)
- [ ] Build 12 components with shadcn-matching variants
- [ ] Bind all colors to variables
- [ ] Document in `figma-master/MANIFEST.md` (file key, page names, component names)
- [ ] Export baseline `variables.json` for Neutral preset — verify import works

**Done when:** Neutral preset variables import into master and components update correctly.

_Can be done manually with Figma MCP; not blocking P0._

---

### P2 — Export pipeline (no UI polish)

**Goal:** `buildZip()` produces valid artifact.

- [ ] `packages/repo-template` — minimal Next + 12 shadcn components (Neutral theme placeholder)
- [ ] `packages/export` — merge template + generated theme files + make-kit templates
- [ ] `make-kit-template` — static README + guideline skeletons
- [ ] CLI script: `pnpm --filter export run build-sample` writes sample ZIP to `dist/`
- [ ] Verify: extract ZIP, `pnpm install && pnpm dev` runs
- [ ] Verify: `figma/variables.json` imports into golden master

**Done when:** Sample ZIP runs locally; Figma variables import confirmed.

---

### P3 — Web app MVP (product visible)

**Goal:** User can pick look, preview, download.

- [ ] `packages/component-preview` — 12 components themed via CSS variable injection
- [ ] Wire preset/tweak UI → `buildTheme()` → preview
- [ ] Wire download → `buildZip()` → browser download
- [ ] localStorage persist + beforeunload
- [ ] `packages/a11y-rules` — contrast warning on primary/background

**Done when:** Non-dev can download ZIP from live Pages site and run `code/`.

---

### P4 — Figma duplicate path

**Goal:** `figma/LINK.txt` or clear duplicate flow in README.

- [ ] **Path A:** Vercel/serverless function with `FIGMA_ACCESS_TOKEN` duplicates file + sets variables → writes link into ZIP (requires moving export partially server-side OR post-download link fetch)
- [ ] **Path B (fallback):** Community file link in `figma/README.md` + step-by-step import of generated `variables.json`
- [ ] Optional: Figma plugin repo in `figma-plugin/` to apply variables JSON

**Done when:** User achieves visual match between code primary button and Figma primary button in < 15 min.

---

### P5 — Make kit generation

**Goal:** Full generated guidelines in every export.

- [ ] Theme engine emits all `make-kit/guidelines/**/*.md` content from preset+tweaks
- [ ] Per-component guidelines: variants, when to use, token references
- [ ] `make-kit/README.md` tested against Figma Help Center flow

**Done when:** User can attach kit in Make and prompt a screen using their button/card language.

---

### P6 — Polish

- [ ] Extra preset QA
- [ ] Mobile-friendly builder UI
- [ ] `THEME.md` / root README copy edit for non-experts
- [ ] Optional Vercel mirror deploy

---

## 11. Testing checklist

| Test                    | Command / action                                        |
| ----------------------- | ------------------------------------------------------- |
| Theme engine unit tests | `pnpm test`                                             |
| CSS/Figma parity        | Assert primary hex in CSS === Figma JSON for same build |
| ZIP smoke test          | Extract → `cd code && pnpm i && pnpm build`             |
| Preview matches export  | Same preset+tweaks → preview primary === code primary   |
| Figma import            | Manual: import `variables.json` into master             |
| localStorage            | Refresh page → state restored                           |
| Pages deploy            | Push main → site updates                                |

---

## 12. Environment variables (future P4 only)

| Variable                | Purpose                            |
| ----------------------- | ---------------------------------- |
| `FIGMA_ACCESS_TOKEN`    | Duplicate master + apply variables |
| `FIGMA_MASTER_FILE_KEY` | Source file to duplicate           |

Not required for P0–P3.

---

## 13. Out of scope (v1)

- User accounts, GitHub OAuth, server-side project save
- Custom semantic token groups
- Full shadcn registry (40+ components)
- Storybook bundled in app or ZIP
- Code Connect
- Live bidirectional sync
- npm publish of theme packages (document as advanced only)
- Analytics (optional later)

---

## 14. Success criteria

1. Download → running `code/` in **< 10 minutes** for a beginner following README
2. Figma primary color **matches** code primary after duplicate/import flow
3. **12 components** in preview reflect theme changes immediately
4. Make guidelines folder is **coherent** without hand-editing
5. Maintainer can update shadcn components **without** rewriting theme engine

---

## 15. Reference docs in repo

| File                          | Purpose                              |
| ----------------------------- | ------------------------------------ |
| `docs/ARCHITECTURE.md`        | Product vision, diagrams, risks      |
| `docs/SESSION.md`             | localStorage + beforeunload behavior |
| `docs/IMPLEMENTATION_PLAN.md` | This file — execution plan           |
| `README.md`                   | Public repo overview                 |

---

## 16. Agent execution notes

1. **Start at P0.** Do not build UI before theme-engine tests pass.
2. **Do not expand** to full shadcn registry without explicit user request.
3. **Do not add** login, database, or Figma OAuth in v1.
4. **Prefer Vite** for `apps/web` unless Next is required for repo template consistency.
5. **Run Prettier** on changed files before commit (`yarn prettier --write` or project equivalent).
6. **Figma master (P1)** can proceed in parallel; document file key even if API link comes later.
7. When stuck on Figma API cost, ship **P4 Path B** (Community duplicate + variables import) — product promise still holds.
8. Keep copy **jargon-free** in all user-facing READMEs inside exports.

---

## 17. Open items (non-blocking)

- Final project name (“Starter Kit” vs branded name)
- Exact font list for tweak select
- Vite vs Next for `apps/web` (recommend Vite)
- Custom domain on GitHub Pages

---

_Last updated: aligned with dual-export vision (code + Figma + Make kit), preset-first model, 12-component scope._
