import {
  FONT_OPTIONS,
  RADIUS_VALUES,
  getPreset,
  type ColorTokens,
  type PresetId,
  type RadiusTweak,
  type ThemeMode,
  type ThemeTweaks,
} from '@starter-kit/theme-presets';
import { contrastForeground, normalizeHex } from './utils.js';
import type { ResolvedTheme } from './types.js';

function resolveFont(fontId?: string, fallback = 'inter'): string {
  const match = FONT_OPTIONS.find((font) => font.id === (fontId ?? fallback));
  return match?.cssValue ?? FONT_OPTIONS[0].cssValue;
}

function resolveRadius(
  radius?: RadiusTweak,
  fallback: RadiusTweak = 'default',
): string {
  return RADIUS_VALUES[radius ?? fallback];
}

function applyBrandColor(tokens: ColorTokens, brandColor: string): ColorTokens {
  const primary = normalizeHex(brandColor);
  const primaryForeground = contrastForeground(primary);
  return {
    ...tokens,
    primary,
    'primary-foreground': primaryForeground,
    ring: primary,
  };
}

export function resolveTheme(
  presetId: PresetId,
  tweaks: ThemeTweaks = {},
  mode: ThemeMode,
): ResolvedTheme {
  const preset = getPreset(presetId);
  const baseTokens = mode === 'light' ? preset.light : preset.dark;
  const tokens = tweaks.brandColor
    ? applyBrandColor(baseTokens, tweaks.brandColor)
    : baseTokens;

  return {
    tokens,
    radius: resolveRadius(tweaks.radius, preset.defaultRadius),
    fontFamily: resolveFont(tweaks.font, preset.defaultFont),
    presetName: preset.name,
  };
}

export function resolveBothModes(
  presetId: PresetId,
  tweaks: ThemeTweaks = {},
): Record<ThemeMode, ResolvedTheme> {
  return {
    light: resolveTheme(presetId, tweaks, 'light'),
    dark: resolveTheme(presetId, tweaks, 'dark'),
  };
}
