import type { ComponentProps, ReactNode } from 'react';
import { Icon, type IconName } from '../Icon/Icon';
import './Menu.css';

export function MenuPanel({ className, children, ...rest }: ComponentProps<'div'>) {
  return (
    <div {...rest} className={['menu-panel', className].filter(Boolean).join(' ')}>
      {children}
    </div>
  );
}

export interface MenuItemProps extends Omit<ComponentProps<'div'>, 'children'> {
  label: ReactNode;
  description?: ReactNode;
  icon?: IconName | undefined;
  selected?: boolean | undefined;
  highlighted?: boolean | undefined;
  disabled?: boolean | undefined;
  destructive?: boolean | undefined;
}

export function MenuItem({ label, description, icon, selected, highlighted, disabled, destructive, className, ...rest }: MenuItemProps) {
  const classes = ['menu-item', highlighted && 'menu-item-highlighted', selected && 'menu-item-selected', destructive && 'menu-item-destructive', className];
  return (
    <div {...rest} className={classes.filter(Boolean).join(' ')} aria-disabled={disabled || undefined}>
      {icon && <Icon name={icon} size={20} />}
      <span className="menu-item-text">
        <span className="menu-item-label">{label}</span>
        {description && <span className="menu-item-description">{description}</span>}
      </span>
      {selected && <Icon name="check" size={20} className="menu-item-check" />}
    </div>
  );
}

export function MenuGroupLabel({ id, children }: { id: string; children: ReactNode }) {
  return (
    <div id={id} className="menu-group-label">
      {children}
    </div>
  );
}

export function MenuDivider() {
  return <div className="menu-divider" role="separator" />;
}
