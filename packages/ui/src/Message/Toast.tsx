import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { modalStack } from '../Layer/ModalStack';
import { MessageActionControl, MessageFrame } from './Message';
import { PausableTimer } from './PausableTimer';
import { toastDuration, type ToastContent, type ToastQueue } from './ToastQueue';

// Matches the fade-out in Message.css.
const leaveDuration = 150;

export interface ToastProps extends ToastContent {
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

export function Toast({ tone, message, action, dismissible = tone !== 'loading', onDismiss, className }: ToastProps) {
  const [leaving, setLeaving] = useState(false);
  const frame = useRef<HTMLDivElement>(null);
  const duration = toastDuration({ tone, message, action });
  const canDismiss = onDismiss !== undefined;
  const leave = canDismiss ? () => setLeaving(true) : undefined;

  useEffect(() => {
    if (duration === undefined || !canDismiss || !frame.current) return;
    const timer = new PausableTimer(() => setLeaving(true), duration);
    const release = timer.holdWhileInside(frame.current);
    timer.start();
    return () => {
      release();
      timer.stop();
    };
  }, [duration, canDismiss]);

  useEffect(() => {
    if (!leaving) return;
    const handle = setTimeout(() => onDismiss?.(), leaveDuration);
    return () => clearTimeout(handle);
  }, [leaving, onDismiss]);

  return (
    <div ref={frame} className="toast-frame" data-leaving={leaving || undefined}>
      <MessageFrame kind="toast" tone={tone} dismissible={dismissible} onDismiss={leave} className={className}>
        <p className="message-text">{message}</p>
        {action && <MessageActionControl action={action} onEscape={leave} />}
      </MessageFrame>
    </div>
  );
}

export function ToastRegion({ queue, label = 'Notifications' }: { queue: ToastQueue; label?: string }) {
  const { toasts, announcement } = useSyncExternalStore(queue.subscribe, queue.getState, queue.getState);
  const modal = useSyncExternalStore(modalStack.subscribe, modalStack.top, () => null);
  const region = useRef<HTMLElement>(null);

  // A modal dialog makes the rest of the page inert, so the region moves inside it and opens in the top layer above it.
  useLayoutEffect(() => {
    region.current?.showPopover();
  }, [modal]);

  const content = (
    <section ref={region} className="toast-region" aria-label={label} popover="manual">
      <ol className="toast-list">
        {toasts.map((toast) => (
          <li key={toast.id}>
            <Toast tone={toast.tone} message={toast.message} action={toast.action} onDismiss={() => queue.dismiss(toast.id)} />
          </li>
        ))}
      </ol>
      <p className="visually-hidden" role="status">
        {announcement && !announcement.urgent ? announcement.text : ''}
      </p>
      <p className="visually-hidden" role="alert">
        {announcement?.urgent ? announcement.text : ''}
      </p>
    </section>
  );
  return modal ? createPortal(content, modal) : content;
}
