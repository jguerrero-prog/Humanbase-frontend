import type { InputHTMLAttributes } from 'react';
import { Field } from '../Field/Field';

export interface FileFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label: string;
  hint?: string;
  error?: string | undefined;
}

export function FileField({ label, id, hint, error, disabled, ...rest }: FileFieldProps) {
  return (
    <Field label={label} id={id} hint={hint} error={error} disabled={disabled}>
      {(control) => <input {...rest} {...control} type="file" disabled={disabled} />}
    </Field>
  );
}
