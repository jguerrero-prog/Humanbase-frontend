import { ToastQueue, ToastRegion } from '@humanbase/ui';

/** The app's one toast queue. Any screen posts here, including code running in its own React root, such as a genome track menu. */
export const notifications = new ToastQueue();

/** Shows the app's toasts in one stack. Mount it once, in the app shell. */
export function Notifications() {
  return <ToastRegion queue={notifications} />;
}
