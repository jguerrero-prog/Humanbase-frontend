import type { KeyboardEvent, ReactNode } from 'react';
import { Icon, type IconName } from '../Icon/Icon';
import { Spinner } from '../Spinner/Spinner';
import './Message.css';
import { useLinkHref } from '../hooks/useLinkHref';

export type MessageTone = 'info' | 'success' | 'warning' | 'error';

export type MessageAction = { label: string; href: string } | { label: string; onSelect: () => void };

const tones: Record<MessageTone, { icon: IconName; label: string }> = {
  info: { icon: 'info', label: 'Information' },
  success: { icon: 'check-circle', label: 'Success' },
  warning: { icon: 'alert-triangle', label: 'Warning' },
  error: { icon: 'alert-circle', label: 'Error' },
};

interface MessageFrameProps {
  kind: 'alert' | 'toast' | 'banner';
  tone: MessageTone | 'loading';
  role?: 'status' | 'alert' | undefined;
  dismissible: boolean;
  onDismiss?: (() => void) | undefined;
  className?: string | undefined;
  children: ReactNode;
}

export function messageRole(tone: MessageTone): 'status' | 'alert' {
  return tone === 'error' ? 'alert' : 'status';
}

export function MessageFrame({ kind, tone, role, dismissible, onDismiss, className, children }: MessageFrameProps) {
  return (
    <div className={['message', kind, `message-${tone}`, className].filter(Boolean).join(' ')} role={role}>
      {tone === 'loading' ? <Spinner size={20} /> : <Icon name={tones[tone].icon} size={20} label={tones[tone].label} />}
      {children}
      {dismissible && (
        <button type="button" className="message-dismiss" aria-label="Dismiss" onClick={onDismiss} onKeyDown={escapeTo(onDismiss)}>
          <Icon name="x" size={20} />
        </button>
      )}
    </div>
  );
}

export function MessageActionControl({ action, onEscape }: { action: MessageAction; onEscape?: (() => void) | undefined }) {
  const linkHref = useLinkHref();
  if ('href' in action) {
    return (
      <a className="message-action" href={linkHref(action.href)} onKeyDown={escapeTo(onEscape)}>
        {action.label}
      </a>
    );
  }
  return (
    <button type="button" className="message-action" onClick={action.onSelect} onKeyDown={escapeTo(onEscape)}>
      {action.label}
    </button>
  );
}

function escapeTo(handler: (() => void) | undefined) {
  return handler && ((event: KeyboardEvent) => event.key === 'Escape' && handler());
}
