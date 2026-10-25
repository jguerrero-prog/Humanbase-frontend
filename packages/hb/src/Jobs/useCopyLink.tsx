import { Button } from '@humanbase/ui';
import { notifications } from '../Notifications/Notifications';

/** Copy link for any page whose URL holds what it shows, with the app toast that confirms it. */
export function useCopyLink() {
  const copyLink = async () => {
    await navigator.clipboard?.writeText(window.location.href);
    notifications.show({ tone: 'info', message: 'Link copied' });
  };
  const copyButton = (
    <Button variant="ghost" size="small" icon="link" onClick={() => void copyLink()}>
      Copy link
    </Button>
  );
  return { copyButton };
}
