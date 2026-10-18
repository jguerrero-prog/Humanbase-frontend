import { useEffect, useState, type RefObject } from 'react';

export function useOverflow(ref: RefObject<HTMLElement | null>) {
  const [overflows, setOverflows] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === 'undefined') return;
    const measure = () => setOverflows(element.scrollWidth > element.clientWidth || element.scrollHeight > element.clientHeight);
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);
  return overflows;
}
