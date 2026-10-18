import { useEffect, useId, useRef, type ComponentProps } from 'react';
import { FieldError } from '../Field/Field';
import { Icon } from '../Icon/Icon';
import './Checkbox.css';

export interface CheckboxProps extends Omit<ComponentProps<'input'>, 'type' | 'size' | 'children'> {
  label: string;
  indeterminate?: boolean;
  error?: string | undefined;
  'data-state'?: 'hover' | 'focus';
}

export function Checkbox({ label, indeterminate = false, error, className, disabled, 'data-state': dataState, ...input }: CheckboxProps) {
  const id = useId();
  const errorId = error ? `${id}-error` : undefined;
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <div className={['checkbox', className].filter(Boolean).join(' ')} data-disabled={disabled || undefined}>
      <span className="checkbox-control">
        <input
          {...input}
          ref={ref}
          id={id}
          type="checkbox"
          disabled={disabled}
          data-state={dataState}
          data-indeterminate={indeterminate || undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
        />
        <Icon name="check" size={16} className="checkbox-check" />
        <Icon name="minus" size={16} className="checkbox-minus" />
      </span>
      <label className="checkbox-label" htmlFor={id}>
        {label}
      </label>
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </div>
  );
}
