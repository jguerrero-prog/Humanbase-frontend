import type { InputHTMLAttributes } from 'react';
import { Field } from '../Field/Field';
import './FileField.css';

export interface FileFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label: string;
  prompt?: string;
  hint?: string;
  error?: string;
}

export function FileField({ label, id, prompt = 'Drop a file here, or choose one', hint, error, disabled, className, ...rest }: FileFieldProps) {
  return (
    <Field label={label} id={id} hint={hint} error={error} disabled={disabled}>
      {(control) => (
        <div className={['file-field', className].filter(Boolean).join(' ')}>
          <span className="file-field-prompt" aria-hidden="true">
            {prompt}
          </span>
          <input {...rest} {...control} type="file" disabled={disabled} className="file-field-input" />
        </div>
      )}
    </Field>
  );
}
