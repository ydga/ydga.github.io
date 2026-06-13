import type { ColorTokens, ThemeMode } from '@starter-kit/theme-presets';
import type { ResolvedTheme } from './types.js';

function formatTokenBlock(
  tokens: ColorTokens,
  radius: string,
  fontFamily: string,
): string {
  const entries = Object.entries(tokens).map(([key, value]) => `  --${key}: ${value};`);
  return [...entries, `  --radius: ${radius};`, `  --font-sans: ${fontFamily};`].join(
    '\n',
  );
}

export function buildCssBlock(
  theme: ResolvedTheme,
  selector: ':root' | '.dark',
): string {
  return `${selector} {\n${formatTokenBlock(theme.tokens, theme.radius, theme.fontFamily)}\n}`;
}

export function buildCss(themes: Record<ThemeMode, ResolvedTheme>): string {
  return [
    buildCssBlock(themes.light, ':root'),
    buildCssBlock(themes.dark, '.dark'),
  ].join('\n\n');
}

export function buildModeCss(theme: ResolvedTheme, mode: ThemeMode): string {
  return buildCssBlock(theme, mode === 'light' ? ':root' : '.dark');
}
