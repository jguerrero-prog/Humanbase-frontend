import type { Module } from '@humanbase/data';

// The categorical scale in the order Figma gives the first modules; past six, modules are grey and told apart by their M label.
const order = [1, 6, 2, 3, 4, 5];

/** A color custom property for each shown module, by position. */
export function moduleColors(modules: readonly Module[]): Map<number, string> {
  return new Map(modules.map((module, index) => [module.id, index < order.length ? `--viz-cat-${order[index]}` : '--viz-cat-other']));
}
