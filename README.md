# Design System

Vite monorepo with shadcn/ui components, theme preset, and Storybook.

## Structure

```text
apps/web/          Demo app
packages/ui/       Components, tokens, Storybook
```

## Commands

```bash
npm install
npm run dev              # Demo app (Vite)
npm run storybook        # Component docs (port 6006)
npm run test-storybook   # Story interaction tests
npm run build            # Production build
npm run typecheck
npm run lint
```

## Add components

From the repo root:

```bash
npx shadcn@latest add button -c packages/ui
```

## Use components

```tsx
import { Button } from "@workspace/ui/components/button"
```
