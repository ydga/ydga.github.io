---
title: Designer — Image tool
date: 2026-06-30
status: planned
repo: ydga.github.io
area: apps/web/src/features/designer
tags:
  - designer
  - image-tool
  - plan
---

# Designer — Image tool

## Goal

Add an **Image** toolbar tool. Users upload an image from their computer. An image layer is a **positioned rectangle with a background image** — configure size, fill/fit, opacity, and visibility like other layers.

## Mental model

```
ImageLayer = bounds (x, y, width, height) + BackgroundSettings (image) + opacity/visible
```

Do **not** model this as `shape` + image fill. Shapes carry stroke, geometry, and clip paths that image layers do not need.

## v1 scope

### In v1

- Image toolbar tool
- Upload from computer (file picker)
- Drag-to-place box (same interaction as shape)
- Fit modes: cover / contain / fit / tile
- Width & height in sidebar
- Opacity, visibility
- Move, resize, smart snap
- Canvas preview + PNG/PDF export
- Layers list + reorder

### Later

- Crop UI
- Drag-and-drop onto canvas
- Tap-to-place with intrinsic image size
- Focal point / object-position
- Corner radius, border
- Filters, masks
- Persist images beyond session (blob URLs today)
- Duplicate frame copies image refs correctly

## Placement & upload (v1)

**Recommended:** drag on canvas to place the box → sidebar **Image** panel with upload CTA.

**Later:** pick file first → place with aspect from `naturalWidth` / `naturalHeight`.

After place: select element + return to pointer tool (same as text/shape).

## Data model

Add to `model/layers.ts`:

```ts
export type ImageLayer = {
  id: string
  frameId: string
  kind: "image"
  name: string
  x: number
  y: number
  width: number
  height: number
  fill: BackgroundSettings // type "image" | "transparent" until uploaded
  opacity?: number           // 0–100, default 100
  visible?: boolean
  maintainBoundsAspect?: boolean
}

export type Layer = TextLayer | ShapeLayer | ImageLayer
```

New `model/image-layer-style.ts`:

- `resolveImageLayerFill(layer)` — transparent until upload
- `resolveImageLayerOpacity` / `resolveImageLayerVisible`
- `imageLayerDisplayName()` — `"Image"` or filename stem

**URL lifecycle** in `use-designer-layers.ts` (mirror `setShapeFillImage`):

- `imageLayerUrlRefs: Map<layerId, string>`
- `setImageLayerFile(layerId, file | null)` → revoke → `createObjectURL` → reducer
- Revoke on `removeLayer` / frame delete

## Reuse map

| Piece | Reuse |
|-------|--------|
| `BackgroundSettings`, `backgroundSettingsReducer` | Image payload + fit |
| `renderBackground` / `renderBackgroundInRect` | Export |
| `backgroundSettingsToStyle` | Canvas preview |
| `FillBackgroundField` (image modes) | Sidebar upload/fit |
| Placement session in `canvas-stage.tsx` | Extend for `image` |
| `ShapeLayerSettingsPanel` dimensions block | Pattern for image panel |
| `ShapeLayerBox` move/resize/snap | Basis for `ImageLayerBox` |
| `draw-shape-layers` pattern | New `draw-image-layers.ts` |
| `export-canvas.ts` | Branch on `kind === "image"` |
| `guide-snap.ts` | Include image layers in snap targets |

## Implementation phases

### Phase 1 — Model + state

- `ImageLayer` types, guards, patches
- `addImageLayer`, `updateImageLayer`, `setImageLayerFile`
- Default box: 200×150 trim px (or 80×80 to match shapes — pick at build time)

### Phase 2 — Export

- `drawImageLayersOnContext` via `renderBackgroundInRect`
- Wire `drawFrameLayersOnContext`
- Smoke test: export PNG with test image

### Phase 3 — Canvas

- `ImageLayerBox` (square fill preview, no stroke)
- `canvas-stage`: placement + layer map branch
- `designer-shell`: `handlePlaceImage`
- `use-designer-ui`: `CanvasTool` / `ToolbarTool` += `"image"`
- `canvas-toolbar`: Image button

### Phase 4 — Settings + shell

- `ImageLayerSettingsPanel` — dimensions, fill/fit, opacity
- `context-panel` routing, layers list icon
- Placeholder when no image uploaded (dashed rect)

### Phase 5 — Polish

- Shift = square aspect on place; optional maintain aspect in panel
- `duplicateFrame` object URL handling
- `image/*` validation, size limits if needed

## File checklist

| File | Change |
|------|--------|
| `model/layers.ts` | `ImageLayer`, union, patches |
| `model/image-layer-style.ts` | Resolvers (new) |
| `model/ui-types.ts` | `"image"` tool types |
| `state/use-designer-layers.ts` | CRUD + URL refs |
| `state/use-designer-ui.ts` | Image tool selection |
| `components/layout/canvas-toolbar.tsx` | Image tool button |
| `components/layout/canvas-stage.tsx` | Placement + render |
| `components/layout/image-layer-box.tsx` | New |
| `components/settings/image-layer-settings-panel.tsx` | New |
| `components/layout/context-panel.tsx` | Panel routing |
| `components/layers/layer-list.tsx` | Icon |
| `lib/draw-image-layers.ts` | New |
| `lib/export-canvas.ts` | Dispatch image layers |
| `lib/guide-snap.ts` | Snap targets |
| `components/designer-shell.tsx` | `handlePlaceImage` |

## Open decisions

1. **Place then upload vs pick file first?** → v1: place then upload.
2. **Default box size** without a file? → 200×150 or resize after first upload.
3. **Stroke on image layers?** → No in v1.
4. **Persistence** → Session blob URLs only (same as frame/shape fill today).

## Risks

- Object URLs do not survive refresh — document for v1.
- Duplicate frame must not share revoked URLs.
- Use `suppressFrameClickAfterPlaceRef` so place → select is not cleared by click-out.

## First PR suggestion

Phases 1–3: model, export, canvas box, toolbar, drag-place with transparent placeholder. Sidebar upload in same PR or immediate follow-up.

## Related prefs ([[AGENTS]])

- Ship code first; images/assets can follow in a later pass.
- Compact floating toolbar; sidebar scrolls on its own; stage reserved for primary asset.
