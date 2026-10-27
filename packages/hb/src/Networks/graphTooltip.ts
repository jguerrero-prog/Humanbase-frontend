import { placeNearPoint } from '@humanbase/ui';

const size = { width: 240, height: 120 };

/** Where a tooltip goes inside a graph area for something on screen, or undefined when the area isn't drawn. */
export function tooltipAt(area: HTMLElement | null, anchor: DOMRect): { x: number; y: number } | undefined {
  const box = area?.getBoundingClientRect();
  if (!box) return undefined;
  return placeNearPoint({ x: anchor.x + anchor.width / 2 - box.x, y: anchor.y + anchor.height / 2 - box.y }, size, { width: box.width, height: box.height });
}
