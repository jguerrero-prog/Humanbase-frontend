export type Placement = 'top' | 'bottom' | 'left' | 'right';

interface Size {
  width: number;
  height: number;
}

const opposite: Record<Placement, Placement> = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };

export function fitPlacement(preferred: Placement, trigger: DOMRect, bubble: Size, offset: number, view: Size = { width: window.innerWidth, height: window.innerHeight }): Placement {
  const room: Record<Placement, number> = {
    top: trigger.top,
    bottom: view.height - trigger.bottom,
    left: trigger.left,
    right: view.width - trigger.right,
  };
  const needed = (preferred === 'top' || preferred === 'bottom' ? bubble.height : bubble.width) + offset;
  return room[preferred] >= needed || room[opposite[preferred]] < needed ? preferred : opposite[preferred];
}

// Below and to the right of the point, flipped to the other side when it would leave its container.
export function placeNearPoint(point: { x: number; y: number }, size: Size, bounds: Size, offset = 12) {
  const x = point.x + offset + size.width > bounds.width ? point.x - offset - size.width : point.x + offset;
  const y = point.y + offset + size.height > bounds.height ? point.y - offset - size.height : point.y + offset;
  return { x: Math.max(0, x), y: Math.max(0, y) };
}

interface Box {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/** Centered under a box, with where its arrow points; above the box when only that fits, and always inside the bounds. */
export function placeUnderBox(box: Box, size: Size, bounds: Size, offset = 8) {
  const under = box.bottom + offset + size.height <= bounds.height || box.top - offset - size.height < 0;
  const center = (Math.max(0, box.left) + Math.min(bounds.width, box.right)) / 2;
  const x = Math.max(0, Math.min(bounds.width - size.width, center - size.width / 2));
  const y = under ? Math.min(box.bottom + offset, Math.max(0, bounds.height - size.height)) : box.top - offset - size.height;
  return { x, y, side: under ? ('bottom' as const) : ('top' as const), arrow: Math.max(offset + 4, Math.min(size.width - offset - 4, center - x)) };
}

export const anchorSupported = typeof CSS !== 'undefined' && CSS.supports('anchor-name: --anchor');

// Without CSS anchor positioning, a popover is placed under its button once, when it opens.
export function placeUnder(panel: HTMLElement, button: HTMLElement, align: 'start' | 'end' = 'end') {
  const box = button.getBoundingClientRect();
  panel.style.insetBlockStart = `${box.bottom + 8}px`;
  panel.style.insetInlineStart = `${Math.max(8, align === 'end' ? box.right - panel.offsetWidth : box.left)}px`;
}
