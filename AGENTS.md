## Learned User Preferences

- Often ships code first and handles images or other assets in a later pass.
- When career or case-study copy changes, prefers updating the live portfolio and exportable resume or PDF together so they stay consistent.
- Prefers emphasizing recent roles and keeping older history lighter in both web and PDF presentations.
- For the in-repo image and designer flows, prefers a compact floating toolbar on the canvas, collapsible side settings that scroll on their own, and the main stage reserved for the primary asset.
- Stores prompts and plans for personal side projects in an Obsidian vault under a projects area, not only in chat threads.
- When working in this repo, expects assistants to read `AGENTS.md` when it is present for learned preferences and workspace facts.
- For designer canvas text, prefers bounding-box modes: **Auto width** (width and height follow content; line breaks only on explicit newlines), **Auto height** (fixed width, height follows wrapped text), and **Fixed size** (explicit width and height with wrap-to-width). Tap-to-add defaults to Auto width; drag-to-place uses Fixed size. Avoid inner scrollbars on the field and sizing that clips glyphs.
- Prefers wheel or trackpad over an active text layer to zoom or pan the canvas, not to scroll the text field.
- After drawing a new text box on the canvas, prefers immediate edit mode with focus and purple selection chrome staying visible while typing.
- For designer text line height, prefers `auto` (CSS `normal`) as the default for new text, with optional explicit `em` or `px`; persisted legacy `unitless` still reads as `em`. In typography settings, prefers a visible `Line height` label above the row, then the value control and a compact `select` for the unit using **`Auto`**, **`em`**, and **`px`** (lowercase unit abbreviations, not title case like “Pixels”).
- For designer typography, prefers a single **`Font`** label grouping family, weight, and size without separate **Weight** / **Font size** row labels; horizontal scrub on the font size field; no trailing **`px`** label on that control; live font previews only while the font picker is open; and a curated short list of popular Google Fonts alongside system presets with webfonts loaded so the canvas and editor match.
- In the designer, prefers that nav tools (Frame/Layers/Export and similar) only switch panel mode and open the properties panel—they must not collapse it; only the sidebar control toggles pinning/collapsing the panel.

## Learned Workspace Facts

- This monorepo is developed from `/Users/yadira/Documents/GitHub/ydga.github.io` on the primary machine.
- Portfolio and case-study surfaces live in `apps/web` alongside the designer feature work.
