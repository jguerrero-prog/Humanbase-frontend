import type { ReactNode } from 'react';
import { Icon, type IconName } from '../Icon/Icon';
import './EmptyState.css';

export interface EmptyStateProps {
  title: string;
  text?: string | undefined;
  icon?: IconName | undefined;
  actions?: ReactNode;
  className?: string | undefined;
}

export function EmptyState({ title, text, icon, actions, className }: EmptyStateProps) {
  return (
    <div className={['empty-state', className].filter(Boolean).join(' ')}>
      <p className="empty-state-title">
        {icon && <Icon name={icon} size={20} />}
        {title}
      </p>
      {text && <p className="empty-state-text">{text}</p>}
      {actions && <div className="empty-state-actions">{actions}</div>}
    </div>
  );
}
