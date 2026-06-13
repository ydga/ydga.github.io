import type { ColorTokens } from '@starter-kit/theme-presets';

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.replace('#', '');
  const value = Number.parseInt(normalized, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

export function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const toLinear = (channel: number) => {
    const normalized = channel / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  };

  const red = toLinear(r);
  const green = toLinear(g);
  const blue = toLinear(b);
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

export function contrastForeground(background: string): string {
  return relativeLuminance(background) > 0.5 ? '#0a0a0a' : '#fafafa';
}

export function normalizeHex(hex: string): string {
  const value = hex.trim();
  if (!/^#[0-9A-Fa-f]{6}$/.test(value)) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  return value.toLowerCase();
}

export function extractPrimaryFromCss(css: string): string | null {
  const match = css.match(/--primary:\s*(#[0-9a-fA-F]{6});/);
  return match?.[1]?.toLowerCase() ?? null;
}

export function tokensDiffer(light: ColorTokens, dark: ColorTokens): boolean {
  return (Object.keys(light) as Array<keyof ColorTokens>).some(
    (key) => light[key] !== dark[key],
  );
}
