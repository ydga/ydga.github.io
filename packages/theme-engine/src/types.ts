import type {
  ColorTokens,
  PresetId,
  RadiusTweak,
  ThemeMode,
  ThemeTweaks,
} from '@starter-kit/theme-presets';

export interface BuildThemeInput {
  preset: PresetId;
  tweaks?: ThemeTweaks;
  mode: ThemeMode;
}

export interface FigmaVariable {
  name: string;
  type: 'COLOR';
  values: Record<ThemeMode, string>;
}

export interface FigmaVariablesExport {
  version: '1.0.0';
  collection: string;
  modes: ThemeMode[];
  variables: FigmaVariable[];
}

export interface MakeGuidelines {
  setup: string;
  tokens: {
    colors: string;
    typography: string;
    radius: string;
  };
  components: Record<string, string>;
}

export interface BuildThemeResult {
  css: string;
  figmaVariables: FigmaVariablesExport;
  makeGuidelines: MakeGuidelines;
  themeSummary: string;
  resolvedTokens: ColorTokens & { radius: string; fontFamily: string };
}

export interface ResolvedTheme {
  tokens: ColorTokens;
  radius: string;
  fontFamily: string;
  presetName: string;
}
