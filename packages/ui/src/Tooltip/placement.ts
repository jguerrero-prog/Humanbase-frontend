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
