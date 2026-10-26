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
  /** Round, on the page surface with a floating shadow, for a button fixed over the page. */
  floating?: boolean;
}

// The tooltip shows the same name screen readers hear, plus the shortcut when there is one.
export function IconButton({ label, icon, shortcut, placement = 'top', floating = false, className, type = 'button', ...rest }: IconButtonProps) {
  return (
    <Tooltip text={shortcut ? `${label} (${shortcut})` : label} placement={placement}>
      <button {...rest} type={type} className={['icon-button', floating && 'icon-button-floating', className].filter(Boolean).join(' ')} aria-label={label} aria-keyshortcuts={shortcut}>
        <Icon name={icon} size={20} />
      </button>
    </Tooltip>
  );
}
