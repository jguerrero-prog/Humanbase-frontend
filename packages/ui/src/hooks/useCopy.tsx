import { useEffect, useState } from 'react';

const copiedFor = 2000;

/** Copies text to the clipboard, stays copied for 2 seconds, and gives the status that announces it. */
export function useCopy(text: string, announcement: string) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), copiedFor);
    return () => clearTimeout(timer);
  }, [copied]);

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
  };

  const status = (
    <span role="status" className="visually-hidden">
      {copied ? announcement : ''}
    </span>
  );
  return { copied, copy, status };
}
