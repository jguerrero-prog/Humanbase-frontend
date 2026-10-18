import type { ReactNode } from 'react';
import { MessageActionControl, MessageFrame, messageRole, type MessageAction, type MessageTone } from './Message';

export interface AlertProps {
  tone?: MessageTone;
  title?: string;
  children?: ReactNode;
  action?: MessageAction;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

export function Alert({ tone = 'info', title, children, action, dismissible = false, onDismiss, className }: AlertProps) {
  return (
    <MessageFrame kind="alert" tone={tone} role={messageRole(tone)} dismissible={dismissible} onDismiss={onDismiss} className={className}>
      <div className="alert-content">
        {title && <p className="alert-title">{title}</p>}
        {children && <div className="alert-body">{children}</div>}
        {action && (
          <p className="alert-actions">
            <MessageActionControl action={action} />
          </p>
        )}
      </div>
    </MessageFrame>
  );
}
