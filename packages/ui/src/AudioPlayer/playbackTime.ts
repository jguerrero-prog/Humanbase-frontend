const wholeSeconds = (seconds: number) => (Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0);
const count = (n: number, unit: string) => `${n} ${unit}${n === 1 ? '' : 's'}`;

/** Minutes and seconds as the player shows them, such as 8:07. */
export function clockTime(seconds: number): string {
  const whole = wholeSeconds(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}

/** The same time in words for screen readers, such as 8 minutes 7 seconds. */
export function spokenTime(seconds: number): string {
  const whole = wholeSeconds(seconds);
  const minutes = Math.floor(whole / 60);
  const rest = whole % 60;
  if (minutes === 0) return count(rest, 'second');
  return rest === 0 ? count(minutes, 'minute') : `${count(minutes, 'minute')} ${count(rest, 'second')}`;
}
