import type { ButtonHTMLAttributes, MouseEvent, ReactNode } from 'react';
import './Button.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
export type ButtonSize = 'medium' | 'small';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  loading?: boolean;
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
      {loading ? <Spinner /> : icon && <span className="button-icon" aria-hidden="true">{icon}</span>}
      {children}
    </button>
  );
}

function Spinner() {
  return (
    <svg className="button-spinner" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M8 1.12a6.88 6.88 0 1 1-6.88 6.88" />
    </svg>
  );
}
