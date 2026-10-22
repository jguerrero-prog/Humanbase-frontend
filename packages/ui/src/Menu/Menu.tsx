import type { ComponentProps, CSSProperties, ReactNode } from 'react';
import { Divider } from '../Divider/Divider';
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
  image?: string | undefined;
  /** A color token shown as a dot in the icon's place. */
  swatch?: string | undefined;
  reserveIcon?: boolean | undefined;
  selected?: boolean | undefined;
  highlighted?: boolean | undefined;
  disabled?: boolean | undefined;
  destructive?: boolean | undefined;
}

export function MenuItem({ label, description, icon, image, swatch, reserveIcon, selected, highlighted, disabled, destructive, className, ...rest }: MenuItemProps) {
  const classes = ['menu-item', highlighted && 'menu-item-highlighted', selected && 'menu-item-selected', destructive && 'menu-item-destructive', className];
  return (
    <div {...rest} className={classes.filter(Boolean).join(' ')} aria-disabled={disabled || undefined}>
      {icon ? (
        <Icon name={icon} size={20} />
      ) : swatch ? (
        <span className="menu-item-swatch" style={{ '--swatch': `var(${swatch})` } as CSSProperties} aria-hidden="true" />
      ) : image ? (
        <img className="menu-item-image" src={image} alt="" width={20} height={20} />
      ) : (
        reserveIcon && <span className="menu-item-image" aria-hidden="true" />
      )}
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
  return <Divider className="menu-divider" />;
}
