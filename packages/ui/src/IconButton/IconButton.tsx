import type { ButtonHTMLAttributes } from 'react';
import { Icon, type IconName } from '../Icon/Icon';
import { Tooltip } from '../Tooltip/Tooltip';
import type { Placement } from '../Tooltip/placement';
import './IconButton.css';

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  label: string;
  icon: IconName;
  shortcut?: string | undefined;
  placement?: Placement;
}

// The tooltip shows the same name screen readers hear, plus the shortcut when there is one.
export function IconButton({ label, icon, shortcut, placement = 'top', className, type = 'button', ...rest }: IconButtonProps) {
  return (
    <Tooltip text={shortcut ? `${label} (${shortcut})` : label} placement={placement}>
      <button {...rest} type={type} className={['icon-button', className].filter(Boolean).join(' ')} aria-label={label} aria-keyshortcuts={shortcut}>
        <Icon name={icon} size={20} />
      </button>
    </Tooltip>
  );
}
