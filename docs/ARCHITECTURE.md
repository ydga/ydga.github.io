# Starter Kit — Architecture & Technical Spec

**One-liner:** Pick a look → download a themed shadcn repo **and** a matching Figma library in one step — no design system expertise required.

**Status:** Planning (vision locked)  
**Hosting (now):** GitHub Pages (`ydga.github.io`)  
**Hosting (later):** Vercel optional

---

## Product definition

A **login-free**, browser-based **starter kit generator** for people who want a branded product foundation without learning design systems, tokens, or Figma setup.

### What the user gets (one download)

A single **`.zip`** bundle:

| Artifact        | Purpose                                                                                   |
| --------------- | ----------------------------------------------------------------------------------------- |
| **`code/`**     | Ready-to-run Next.js + shadcn (themed), core components, light + dark                     |
| **`figma/`**    | Matching Figma library access + variables aligned to the same theme                       |
| **`make-kit/`** | Figma Make guidelines + token docs so AI prototypes use _their_ system, not Make defaults |

### What the user does **not** need to know

- DTCG, semantic token layers, or shadcn CSS variable names
- How to build a Figma library from scratch
- Storybook configuration
- Code Connect setup
- How to wire Make kits by hand

They **pick a look**, optionally **tweak a few knobs**, **preview**, **download**, duplicate Figma, run `pnpm install`.

---

## Value proposition

**Problem:** Teams and solo builders want shadcn + Figma that already match. Today that means manual theming in two places, or design-system expertise.

**Solution:** One opinionated export where **code theme = Figma variables = Make guidelines**, generated together.

**Not competing on:** Flexible enterprise token algebra, full registry mirroring, live bidirectional sync.

**Competing on:** Speed, simplicity, **dual artifact**, beginner-friendly.

---

## User flow

```text
Landing
    │
    ▼
Choose a preset look (e.g. Minimal, SaaS, Warm, Bold, Neutral)
    │
    ▼
Optional simple tweaks
    • Brand color
    • Font (curated list)
    • Corner radius (soft / default / sharp)
    • Light / dark preview toggle
    │
    ▼
Live preview — core components in the app (not full Storybook platform)
    │
    ▼
Optional a11y nudge — contrast OK / warning (awareness only)
    │
    ▼
Download one ZIP
    ├── code/          → pnpm install && pnpm dev
    ├── figma/         → open link, duplicate library, theme already applied
    └── make-kit/      → import into Figma Make (guidelines + library ref)
    │
    ▼
User is on their own — README in bundle explains next steps
```

**Session:** `localStorage` for preset + tweaks. **“Download before leaving”** when customized. No accounts.

---

## Design principles

| Principle                  | Choice                                                                        |
| -------------------------- | ----------------------------------------------------------------------------- |
| Opinionated over flexible  | Presets + 3–4 tweak dimensions, not custom token groups                       |
| Dual export is the product | Code + Figma ship together; neither is “phase 2”                              |
| Small curated set          | ~12 core components in code **and** Figma — not full shadcn registry          |
| Same theme everywhere      | One theme engine drives CSS, Figma variables JSON, Make token guidelines      |
| Beginner-first copy        | No jargon in UI; DTCG optional inside `code/tokens/` for power users          |
| Lite hosting               | Static app; export runs in browser                                            |
| Make-ready                 | Every export includes a **Make kit folder** structured per Figma’s guidelines |

---

## Core components (v1)

Matched 1:1 in **code**, **Figma master**, and **Make guidelines**:

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

Expand registry **after** dual export works reliably.

**Stack (code template):**

- Next.js App Router
- Tailwind CSS v4
- shadcn/ui **new-york**
- Light + dark via CSS variables

---

## Theme model (simple)

### Presets

Fixed, designed bundles — each defines full light + dark:

- **Minimal** — neutral, tight radius
- **SaaS** — blue accent, default radius
- **Warm** — warm neutrals, soft radius
- **Bold** — high contrast accent, sharp radius
- **Neutral** — close to default shadcn

Stored as JSON in `packages/theme-presets/`.

### User tweaks (optional)

Applied on top of preset:

| Tweak       | Type                                  | Maps internally to |
| ----------- | ------------------------------------- | ------------------ |
| Brand color | Color picker (seeded from preset)     | `--primary` chain  |
| Font        | Select (5–8 Google/system pairs)      | `--font-sans`      |
| Radius      | 3-step slider: soft / default / sharp | `--radius` scale   |

Internal mapping stays hidden. Export includes plain-English `THEME.md` (“Your brand color is …”).

### Internal format

`packages/theme-engine/` converts **preset + tweaks →**:

- `globals.css` (shadcn variables)
- `figma/variables.json` (Figma Variables import format)
- `make-kit/guidelines/tokens/*.md` (Make-readable token rules)
- Optional `code/tokens/theme.tokens.json` (DTCG) for advanced users

---

## Export bundle structure

```text
{project-name}-starter-kit.zip
├── README.md                 # Start here — 5-minute setup
├── code/
│   ├── app/
│   ├── components/ui/        # 12 core components only
│   ├── app/globals.css       # Generated theme
│   ├── package.json
│   ├── tokens/               # optional DTCG + THEME.md
│   └── ...
├── figma/
│   ├── README.md             # Duplicate library + verify variables
│   ├── variables.json        # Same theme as code (import backup)
│   ├── manifest.json         # Component ↔ code paths, variant props
│   └── LINK.txt              # URL to themed duplicate (when API path used)
└── make-kit/
    ├── README.md             # How to attach kit in Figma Make
    └── guidelines/
        ├── setup.md          # “Use this system, not Make defaults”
        ├── tokens/
        │   ├── colors.md
        │   ├── typography.md
        │   └── radius.md
        └── components/
            ├── button.md
            ├── input.md
            └── ...           # one per core component
```

---

## Figma delivery strategy

Dual export requires a **golden Figma master** (12 components, props/variants aligned to shadcn) + **theme application** at export time.

### Tier 1 — Target UX (when you have Figma API / service token)

1. Duplicate golden master server-side (or pre-render per preset+tweak hash).
2. Apply `variables.json` to file modes (light/dark).
3. Put **Duplicate this file** link in `figma/LINK.txt`.
4. User duplicates to their drafts (free plan OK).

### Tier 2 — No API (launch fallback)

1. User duplicates **public Community master** (generic structure).
2. Run **Figma plugin** (bundled instructions) or **Variables import** from `figma/variables.json`.
3. `figma/README.md` — step-by-step with screenshots (beginner path).

### Tier 3 — Variables-only emergency path

Import `variables.json` manually; components already use variable bindings in master.

**Architecture rule:** Theme engine always emits **identical variable values** in `code/globals.css` and `figma/variables.json`. Figma delivery mechanism is swappable.

---

## Figma Make integration

[Figma Make kits](https://help.figma.com/hc/en-us/articles/39241689698839-Get-started-with-Make-kits) combine **code context**, **Figma library styles/variables**, and **guidelines** so Make generates prototypes with your system—not generic UI.

### What we ship in every export

**`make-kit/guidelines/`** per [Figma’s guidelines structure](https://developers.figma.com/docs/code/write-design-system-guidelines/):

- **`setup.md`** — instruct Make to use exported components/tokens; list `code/` layout and import paths.
- **`tokens/*.md`** — human-readable rules generated from the same preset+tweaks (colors, type, radius, light/dark).
- **`components/*.md`** — variant usage for each of the 12 components (when to use outline vs default, etc.).

### How the user connects Make (post-download)

Documented in `make-kit/README.md`:

1. **Figma library:** After duplicating themed Figma file, publish/use as library in Make kit.
2. **Code context (optional):** Publish `code/` as npm package **or** use Make’s support for public packages if we later ship `@ydga/shadcn-theme-*` presets. v1 emphasizes **Figma library + guidelines** (works without npm publish).
3. **Assemble Make kit** in Figma: add library variables/styles + paste/upload guidelines folder.
4. Make auto-generates extra guidelines; user reviews once.

### Future enhancement

- Pre-built **Make kit template file** per preset (Figma-hosted).
- Private npm theme packages for paid orgs.
- Tighter integration if Figma exposes kit export API.

**Why Make matters:** Extends “whole package” beyond static files — beginners can **prompt prototypes** that respect their starter kit without learning components.

---

## In-app preview (not Storybook-as-product)

v1 preview is a **lightweight component gallery** in `apps/web`:

- Renders the 12 components with current preset + tweaks
- Toggle light/dark
- Same CSS variable injection as export

**Optional later:** embed Storybook static build for power users. Not required for MVP.

---

## A11y

Lightweight contrast check on primary / background / destructive pairs. **Warning only** — never blocks download. One line in README: “Review contrast for your brand.”

---

## Monorepo layout

```text
ydga.github.io/
├── apps/
│   └── web/                      # Preset picker, tweaks, preview, download
├── packages/
│   ├── theme-presets/            # Minimal, SaaS, Warm, …
│   ├── theme-engine/             # preset + tweaks → CSS, Figma JSON, Make MD
│   ├── component-preview/        # 12 preview stories/components for web app
│   ├── repo-template/            # code/ skeleton merged into ZIP
│   ├── export/                   # Client-side ZIP builder
│   └── a11y-rules/               # Contrast nudges
├── figma-master/                 # Docs + MCP scripts to maintain golden file
├── make-kit-template/            # Base guidelines structure (merged per export)
└── docs/
    ├── ARCHITECTURE.md
    └── SESSION.md
```

---

## System diagram

```text
┌─────────────────────────────────────────────────────────────┐
│  apps/web (GitHub Pages)                                    │
│  Presets → Tweaks → Preview (12 components) → Download ZIP  │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
                   packages/theme-engine
                             │
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
    code/globals.css   figma/variables.json   make-kit/guidelines/
         │                   │                   │
         └───────────────────┴───────────────────┘
                             │
                   packages/export (JSZip)
                             │
                             ▼
              {name}-starter-kit.zip
```

---

## Explicitly out of scope (v1)

- User accounts / GitHub OAuth
- Custom semantic token groups
- Full shadcn registry
- Live sync (app ↔ Figma ↔ GitHub)
- Code Connect files
- Bidirectional editing
- Agent-first positioning (simple README suffices)
- Server-side export API

---

## Phased delivery (product-led)

| Phase  | Outcome                                                  | User-visible?          |
| ------ | -------------------------------------------------------- | ---------------------- |
| **P0** | Monorepo, theme-presets, theme-engine → CSS + Figma JSON | No                     |
| **P1** | Golden Figma master (12 components, variable-bound)      | No                     |
| **P2** | Export ZIP: `code/` + `figma/variables.json` + README    | Partial                |
| **P3** | Web app: pick preset → preview → download                | **Yes — MVP**          |
| **P4** | Figma link in bundle (API duplicate or plugin path)      | **Yes — full promise** |
| **P5** | `make-kit/` guidelines auto-generated per export         | **Yes — Make story**   |
| **P6** | Extra presets, npm option for Make code context          | Polish                 |

**Milestone that validates the idea:** P3 + P4 — user gets code **and** working Figma duplicate with same theme.

---

## Risks & mitigations

| Risk                                        | Mitigation                                             |
| ------------------------------------------- | ------------------------------------------------------ |
| Figma API cost/complexity                   | Tier 2 plugin + variables import at launch             |
| Golden Figma drift vs shadcn                | Lock to 12 components; version master (`v1.0`)         |
| “Just use tweakcn”                          | Message = **Figma + Make included**, not CSS only      |
| Client ZIP size                             | 12 components only; no full Storybook in ZIP           |
| Make kits need paid Figma for some features | Docs for free path: library + guidelines; npm optional |

---

## Success criteria

1. Non-expert completes **download → running app → Figma duplicate** in **< 15 minutes**.
2. Primary button in Figma and code is **visibly the same** (color, radius, font).
3. User can start a Make file with exported guidelines and get a prototype using **their** button/card patterns.
4. You can maintain golden Figma + template with **< 1 day/month** at 12-component scope.

---

## Alignment summary

> **Starter Kit** is a preset-first, login-free app on GitHub Pages. Users pick a look, lightly tweak it, preview 12 shadcn components, and download one ZIP containing themed code, Figma variable parity, and a Figma Make guidelines pack — so code, design, and AI prototyping share one theme without design system expertise.
