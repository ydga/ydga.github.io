# Agent instructions — Starter Kit repo

**Start here:** read [`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md) for full context.

## What we're building

A GitHub Pages app: **pick a preset look → tweak lightly → download one ZIP** with themed shadcn **code**, matching **Figma variables**, and **Figma Make guidelines**. No login. 12 core components only.

## Current phase

Begin at **P0** (monorepo scaffold) unless `IMPLEMENTATION_PLAN.md` checkboxes show later phases complete.

## Hard constraints

- No auth/DB in v1
- Presets + tweaks only — no custom semantic token UI
- 12 components max in v1
- Client-side ZIP export for P0–P3
- Dual export (code + Figma) is the product — do not defer Figma to a distant phase without shipping variables JSON + import docs

## Key paths

| Path                      | Role                                       |
| ------------------------- | ------------------------------------------ |
| `apps/web/`               | Builder UI + preview                       |
| `packages/theme-engine/`  | preset + tweaks → CSS, Figma JSON, Make MD |
| `packages/theme-presets/` | 5 preset definitions                       |
| `packages/export/`        | ZIP builder                                |
| `packages/repo-template/` | `code/` skeleton                           |
| `figma-master/`           | Golden Figma docs                          |
| `make-kit-template/`      | Make guideline templates                   |

## Before commit

```bash
yarn prettier --write <changed files>
```

## Do not

- Expand to full shadcn registry without explicit request
- Add Storybook-as-product for MVP
- Reintroduce flexible semantic token groups from old architecture
- Block MVP on Figma REST API — ship variables import fallback first
