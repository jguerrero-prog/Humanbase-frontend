import type { InputHTMLAttributes } from 'react';
import { Field, type FieldSize } from '../Field/Field';
import './TextInput.css';

export interface TextInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'id'> {
  label: string;
  hint?: string;
  error?: string;
  size?: FieldSize;
}

export function TextInput({ label, hint, error, size = 'medium', disabled, className, type = 'text', ...rest }: TextInputProps) {
  return (
    <Field label={label} hint={hint} error={error} size={size} disabled={disabled}>
      {(control) => (
        <input
          {...rest}
          {...control}
          type={type}
          disabled={disabled}
          className={['field-control', 'text-input', `text-input-${size}`, className].filter(Boolean).join(' ')}
        />
      )}
    </Field>
  );
}
