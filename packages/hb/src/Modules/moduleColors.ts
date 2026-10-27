import type { Module } from '@humanbase/data';

export interface ModuleColor {
  /** A color custom property, such as `--viz-module-1`. */
  color: string;
  /** Drawn as a ring in the color, telling a module apart from the one that shares its color. */
  ring: boolean;
}

const palette = 8;
const other: ModuleColor = { color: '--viz-cat-other', ring: false };

/**
 * A color for each module of a result, by its place among all of them, so a filter never repaints the modules it keeps.
 * The first eight are filled, the next eight reuse those colors as rings, and the rest are gray.
 */
export function moduleColors(modules: readonly Module[]): Map<number, ModuleColor> {
  return new Map(modules.map((module, index) => [module.id, index < palette * 2 ? { color: `--viz-module-${(index % palette) + 1}`, ring: index >= palette } : other]));
}

export const colorOf = (colors: ReadonlyMap<number, ModuleColor>, id: number): ModuleColor => colors.get(id) ?? other;
