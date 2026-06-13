# Session & persistence (v1)

No accounts. No server-side storage.

## What is stored

| Data                            | Storage          | Key                      |
| ------------------------------- | ---------------- | ------------------------ |
| Selected preset                 | `localStorage`   | `starter-kit-v1`         |
| Tweaks (color, font, radius)    | same blob        |                          |
| Project name (for ZIP filename) | same blob        |                          |
| Downloaded this session         | `sessionStorage` | `starter-kit-downloaded` |

## Default on first visit

- Preset: **Neutral** (closest to default shadcn)
- Tweaks: none
- Mode preview: **light**

## Leave warning

Show `beforeunload` when preset/tweaks differ from defaults **and** user has not downloaded this session.

**Copy:** “Download your starter kit before leaving — your look is only saved in this browser.”

## After download

Set `starter-kit-downloaded`. Offer **“Start over”** to reset `localStorage`.

## Privacy

All data stays on device. No analytics required in v1.
