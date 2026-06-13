import { describe, expect, it } from 'vitest';
import { PRESETS } from '@starter-kit/theme-presets';
import { buildTheme, extractPrimaryFromCss, findFigmaVariable } from './index.js';

describe('buildTheme', () => {
  it.each(PRESETS.map((preset) => [preset.id, preset.name] as const))(
    'produces valid CSS for preset %s (%s)',
    (presetId) => {
      const result = buildTheme({ preset: presetId, mode: 'light' });

      expect(result.css).toContain(':root {');
      expect(result.css).toContain('.dark {');
      expect(result.css).toMatch(/--primary:\s*#[0-9a-f]{6};/);
      expect(result.css).toMatch(/--radius:\s*.+;/);
      expect(result.css).toMatch(/--font-sans:\s*.+;/);
    },
  );

  it.each(PRESETS.map((preset) => preset.id))(
    'light and dark tokens differ for preset %s',
    (presetId) => {
      const result = buildTheme({ preset: presetId, mode: 'light' });
      const lightPrimary = findFigmaVariable(result.figmaVariables, 'primary', 'light');
      const darkPrimary = findFigmaVariable(result.figmaVariables, 'primary', 'dark');

      expect(lightPrimary).toBeTruthy();
      expect(darkPrimary).toBeTruthy();
      expect(lightPrimary).not.toBe(darkPrimary);
    },
  );

  it.each(PRESETS.map((preset) => preset.id))(
    'keeps CSS primary in sync with Figma variables for preset %s',
    (presetId) => {
      const result = buildTheme({ preset: presetId, mode: 'light' });
      const cssPrimary = extractPrimaryFromCss(result.css);
      const figmaPrimary = findFigmaVariable(result.figmaVariables, 'primary', 'light');

      expect(cssPrimary).toBe(figmaPrimary);
    },
  );

  it('applies brand color tweak to primary and ring', () => {
    const brandColor = '#ff00aa';
    const result = buildTheme({
      preset: 'neutral',
      tweaks: { brandColor },
      mode: 'light',
    });

    expect(result.resolvedTokens.primary).toBe('#ff00aa');
    expect(result.resolvedTokens.ring).toBe('#ff00aa');
    expect(findFigmaVariable(result.figmaVariables, 'primary', 'light')).toBe(
      '#ff00aa',
    );
  });

  it('returns make guideline stubs', () => {
    const result = buildTheme({ preset: 'saas', mode: 'dark' });

    expect(result.makeGuidelines.setup).toContain('SaaS');
    expect(result.makeGuidelines.tokens.colors).toContain('Colors');
    expect(Object.keys(result.makeGuidelines.components)).toHaveLength(12);
    expect(result.themeSummary).toContain('SaaS');
  });
});
