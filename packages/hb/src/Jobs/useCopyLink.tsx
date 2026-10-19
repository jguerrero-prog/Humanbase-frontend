import { Button, ToastQueue, ToastRegion } from '@humanbase/ui';
import { useState } from 'react';

/** Copy link for any page whose URL holds what it shows, with the toast that confirms it. */
export function useCopyLink() {
  const [toasts] = useState(() => new ToastQueue());
  const copyLink = async () => {
    await navigator.clipboard?.writeText(window.location.href);
    toasts.show({ tone: 'info', message: 'Link copied' });
  };
  const copyButton = (
    <Button variant="ghost" size="small" icon="link" onClick={() => void copyLink()}>
      Copy link
    </Button>
  );
  return { copyButton, toastRegion: <ToastRegion queue={toasts} /> };
}
