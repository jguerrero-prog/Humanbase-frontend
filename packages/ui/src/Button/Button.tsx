import type { ButtonHTMLAttributes, MouseEvent, Ref } from 'react';
import { Icon, type IconName } from '../Icon/Icon';
import { Spinner } from '../Spinner/Spinner';
import './Button.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
export type ButtonSize = 'medium' | 'small';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  loading?: boolean;
  ref?: Ref<HTMLButtonElement>;
}

export function Button({ variant = 'primary', size = 'medium', icon, loading = false, type = 'button', className, onClick, children, ...rest }: ButtonProps) {
  const blockWhileLoading = (event: MouseEvent<HTMLButtonElement>) => {
    if (loading) event.preventDefault();
    else onClick?.(event);
  };

  return (
    <button
      {...rest}
      type={type}
      className={['button', `button-${variant}`, `button-${size}`, className].filter(Boolean).join(' ')}
      aria-busy={loading || undefined}
      onClick={blockWhileLoading}
    >
      {loading ? <Spinner size={size === 'small' ? 14 : 16} /> : icon && <Icon name={icon} size={size === 'small' ? 16 : 20} />}
      {children}
    </button>
  );
}
