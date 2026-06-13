import type { PresetId, ThemeTweaks } from '@starter-kit/theme-presets';
import { buildCss, buildModeCss } from './css.js';
import { buildFigmaVariables } from './figma.js';
import { resolveBothModes, resolveTheme } from './resolve.js';
import type { BuildThemeInput, BuildThemeResult, MakeGuidelines } from './types.js';

const COMPONENT_STUBS = [
  'button',
  'input',
  'textarea',
  'select',
  'checkbox',
  'card',
  'dialog',
  'alert',
  'badge',
  'tabs',
  'table',
  'dropdown-menu',
] as const;

function buildMakeGuidelines(presetName: string): MakeGuidelines {
  const components = Object.fromEntries(
    COMPONENT_STUBS.map((name) => [
      name,
      `# ${name}\n\nGuidelines for ${name} will be generated at export time.`,
    ]),
  ) as Record<string, string>;

  return {
    setup: `# Setup\n\nUse the ${presetName} preset in Figma Make. Guidelines will be filled at export time.`,
    tokens: {
      colors: '# Colors\n\nToken color guidelines will be generated at export time.',
      typography:
        '# Typography\n\nFont token guidelines will be generated at export time.',
      radius: '# Radius\n\nRadius token guidelines will be generated at export time.',
    },
    components,
  };
}

function buildThemeSummary(
  presetName: string,
  brandColor: string,
  radius: string,
): string {
  return `This theme uses the ${presetName} preset with brand color ${brandColor} and corner radius ${radius}.`;
}

export function buildTheme(input: BuildThemeInput): BuildThemeResult {
  const tweaks: ThemeTweaks = input.tweaks ?? {};
  const activeTheme = resolveTheme(input.preset, tweaks, input.mode);
  const bothModes = resolveBothModes(input.preset, tweaks);

  return {
    css: buildCss(bothModes),
    figmaVariables: buildFigmaVariables(bothModes),
    makeGuidelines: buildMakeGuidelines(activeTheme.presetName),
    themeSummary: buildThemeSummary(
      activeTheme.presetName,
      activeTheme.tokens.primary,
      activeTheme.radius,
    ),
    resolvedTokens: {
      ...activeTheme.tokens,
      radius: activeTheme.radius,
      fontFamily: activeTheme.fontFamily,
    },
  };
}

export function buildThemeCssForMode(input: BuildThemeInput): string {
  const theme = resolveTheme(input.preset, input.tweaks ?? {}, input.mode);
  return buildModeCss(theme, input.mode);
}
