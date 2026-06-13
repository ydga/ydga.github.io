import { presets } from './presets.js';
import {
  presetDefinitionSchema,
  presetIdSchema,
  type PresetDefinition,
  type PresetId,
} from './types.js';

const presetList = Object.values(presets).map((preset) =>
  presetDefinitionSchema.parse(preset),
);

export const PRESETS: PresetDefinition[] = presetList;

export const PRESET_MAP: Record<PresetId, PresetDefinition> = Object.fromEntries(
  presetList.map((preset) => [preset.id, preset]),
) as Record<PresetId, PresetDefinition>;

export function getPreset(id: PresetId): PresetDefinition {
  const parsedId = presetIdSchema.parse(id);
  return PRESET_MAP[parsedId];
}

export function listPresets(): PresetDefinition[] {
  return PRESETS;
}

export * from './types.js';
