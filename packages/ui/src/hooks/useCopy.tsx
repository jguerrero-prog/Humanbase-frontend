import { useEffect, useState } from 'react';

const shownFor = 2000;

type CopyState = 'idle' | 'copied' | 'failed';

/** Copies text to the clipboard, stays copied for 2 seconds, and gives the status that announces it, or that copying failed. */
export function useCopy(text: string, announcement: string) {
  const [state, setState] = useState<CopyState>('idle');
  useEffect(() => {
    if (state === 'idle') return;
    const timer = setTimeout(() => setState('idle'), shownFor);
    return () => clearTimeout(timer);
  }, [state]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setState('copied');
    } catch {
      setState('failed');
    }
  };

  const status = (
    <span role="status" className="visually-hidden">
      {state === 'copied' ? announcement : state === 'failed' ? 'Couldn’t copy to the clipboard. Select the text and copy it instead.' : ''}
    </span>
  );
  return { copied: state === 'copied', copy, status };
}
