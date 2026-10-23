import type { InputHTMLAttributes, Ref } from 'react';
import { Field, type FieldSize } from '../Field/Field';
import './TextInput.css';

export interface TextInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string;
  hint?: string;
  error?: string | undefined;
  size?: FieldSize;
  ref?: Ref<HTMLInputElement>;
}

export function TextInput({ label, id, hint, error, size = 'medium', disabled, className, type = 'text', ...rest }: TextInputProps) {
  return (
    <Field label={label} id={id} hint={hint} error={error} size={size} disabled={disabled}>
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
