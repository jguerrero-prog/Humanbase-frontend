import { useEffect, useState } from 'react';

/** How far from the top of the window a heading must pass before its section counts as the one being read: just under the top bar. */
const readingLine = 120;

/** The id of the section being read: the last heading above the reading line, updated as headings scroll past it. */
export function useCurrentSection(ids: readonly string[]): string | undefined {
  const [current, setCurrent] = useState<string | undefined>(undefined);
  const key = ids.join(' ');
  useEffect(() => {
    const headings = key
      .split(' ')
      .map((id) => document.getElementById(id))
      .filter((heading) => heading !== null);
    if (!headings.length || typeof IntersectionObserver === 'undefined') return;
    const update = () => {
      const passed = headings.filter((heading) => heading.isConnected && heading.getBoundingClientRect().top <= readingLine);
      setCurrent(passed.at(-1)?.id ?? headings[0]?.id);
    };
    // Watching a band from the top of the window to the reading line calls update whenever a heading crosses that line.
    const observer = new IntersectionObserver(update, { rootMargin: `0px 0px ${readingLine - window.innerHeight}px 0px`, threshold: 0 });
    for (const heading of headings) observer.observe(heading);
    // A jump, such as to an anchor, can carry a heading past the line without it ever crossing the band.
    window.addEventListener('scrollend', update);
    window.addEventListener('hashchange', update);
    const frame = requestAnimationFrame(update);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('scrollend', update);
      window.removeEventListener('hashchange', update);
    };
  }, [key]);
  return current ?? ids[0];
}
