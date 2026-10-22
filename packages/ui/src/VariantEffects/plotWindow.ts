import type { Domain } from './ScorePlotLayout';

/** One wheel step or + or - zooms the window by a tenth. */
export const zoomStep = 0.9;

/** Keeps a window inside the whole axis, and no narrower than two overview pixels. */
export function clampWindow([start, end]: Domain, [min, max]: Domain, width: number): Domain {
  const full = max - min;
  const span = Math.min(full, Math.max(end - start, (2 * full) / Math.max(width, 1)));
  const from = Math.min(Math.max(start, min), max - span);
  return [from, from + span];
}

/** Zooms around a value, which stays where it is in the plot; a factor under 1 zooms in. */
export function zoomWindow(window: Domain, full: Domain, anchor: number, factor: number, width: number): Domain {
  const [start, end] = window;
  return clampWindow([anchor - (anchor - start) * factor, anchor + (end - anchor) * factor], full, width);
}

/** Centers the window on a value that is out of view; a value in view leaves it as it is. */
export function windowShowing(window: Domain, full: Domain, value: number, width: number): Domain {
  const [start, end] = window;
  if (value >= start && value <= end) return window;
  const half = (end - start) / 2;
  return clampWindow([value - half, value + half], full, width);
}
