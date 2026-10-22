import { useLayoutEffect, useRef, useState } from 'react';

/** An element's width in CSS pixels, kept current as it resizes; 0 until it is measured. */
export function useWidth<T extends HTMLElement = HTMLDivElement>() {
  const box = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const element = box.current;
    if (!element) return;
    const fit = () => setWidth(element.clientWidth);
    fit();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(fit);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return [box, width] as const;
}
