import { z } from 'zod';

export const presetIdSchema = z.enum(['neutral', 'minimal', 'saas', 'warm', 'bold']);
export type PresetId = z.infer<typeof presetIdSchema>;

export const radiusTweakSchema = z.enum(['soft', 'default', 'sharp']);
export type RadiusTweak = z.infer<typeof radiusTweakSchema>;

export const themeTweaksSchema = z.object({
  brandColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  font: z.string().min(1).optional(),
  radius: radiusTweakSchema.optional(),
});
export type ThemeTweaks = z.infer<typeof themeTweaksSchema>;

export const themeModeSchema = z.enum(['light', 'dark']);
export type ThemeMode = z.infer<typeof themeModeSchema>;

export const colorTokenSchema = z.object({
  background: z.string(),
  foreground: z.string(),
  card: z.string(),
  'card-foreground': z.string(),
  popover: z.string(),
  'popover-foreground': z.string(),
  primary: z.string(),
  'primary-foreground': z.string(),
  secondary: z.string(),
  'secondary-foreground': z.string(),
  muted: z.string(),
  'muted-foreground': z.string(),
  accent: z.string(),
  'accent-foreground': z.string(),
  destructive: z.string(),
  'destructive-foreground': z.string(),
  border: z.string(),
  input: z.string(),
  ring: z.string(),
  'chart-1': z.string(),
  'chart-2': z.string(),
  'chart-3': z.string(),
  'chart-4': z.string(),
  'chart-5': z.string(),
});
export type ColorTokens = z.infer<typeof colorTokenSchema>;

export const presetDefinitionSchema = z.object({
  id: presetIdSchema,
  name: z.string(),
  description: z.string(),
  defaultBrandColor: z.string(),
  defaultFont: z.string(),
  defaultRadius: radiusTweakSchema,
  light: colorTokenSchema,
  dark: colorTokenSchema,
});
export type PresetDefinition = z.infer<typeof presetDefinitionSchema>;

export const FONT_OPTIONS = [
  { id: 'inter', label: 'Inter', cssValue: 'Inter, system-ui, sans-serif' },
  { id: 'geist', label: 'Geist', cssValue: 'Geist, system-ui, sans-serif' },
  { id: 'dm-sans', label: 'DM Sans', cssValue: '"DM Sans", system-ui, sans-serif' },
  {
    id: 'source-sans',
    label: 'Source Sans 3',
    cssValue: '"Source Sans 3", system-ui, sans-serif',
  },
  {
    id: 'nunito',
    label: 'Nunito',
    cssValue: 'Nunito, system-ui, sans-serif',
  },
] as const;

export type FontId = (typeof FONT_OPTIONS)[number]['id'];

export const RADIUS_VALUES: Record<RadiusTweak, string> = {
  soft: '0.75rem',
  default: '0.5rem',
  sharp: '0.25rem',
};
