import type { ReactNode } from 'react';
import { MessageActionControl, MessageFrame, messageRole, type MessageAction } from './Message';

export interface BannerProps {
  tone?: 'info' | 'warning' | 'error';
  children: ReactNode;
  action?: MessageAction;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

export function Banner({ tone = 'info', children, action, dismissible = tone !== 'error', onDismiss, className }: BannerProps) {
  return (
    <MessageFrame kind="banner" tone={tone} role={messageRole(tone)} dismissible={dismissible} onDismiss={onDismiss} className={className}>
      <p className="message-text">{children}</p>
      {action && <MessageActionControl action={action} />}
    </MessageFrame>
  );
}
