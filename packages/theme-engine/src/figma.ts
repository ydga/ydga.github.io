import type { ColorTokens, ThemeMode } from '@starter-kit/theme-presets';
import type { FigmaVariablesExport, ResolvedTheme } from './types.js';

function toFigmaVariables(
  lightTokens: ColorTokens,
  darkTokens: ColorTokens,
): FigmaVariablesExport['variables'] {
  const keys = Object.keys(lightTokens) as Array<keyof ColorTokens>;
  return keys.map((key) => ({
    name: key,
    type: 'COLOR' as const,
    values: {
      light: lightTokens[key],
      dark: darkTokens[key],
    },
  }));
}

export function buildFigmaVariables(
  themes: Record<ThemeMode, ResolvedTheme>,
): FigmaVariablesExport {
  return {
    version: '1.0.0',
    collection: 'Starter Kit',
    modes: ['light', 'dark'],
    variables: toFigmaVariables(themes.light.tokens, themes.dark.tokens),
  };
}

export function findFigmaVariable(
  figmaVariables: FigmaVariablesExport,
  name: keyof ColorTokens,
  mode: ThemeMode,
): string | undefined {
  return figmaVariables.variables.find((variable) => variable.name === name)?.values[
    mode
  ];
}
