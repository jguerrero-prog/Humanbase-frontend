import { useId, type ReactNode } from 'react';
import { Icon } from '../Icon/Icon';
import './Field.css';

export type FieldSize = 'medium' | 'small';

export interface ControlProps {
  id: string;
  'aria-describedby'?: string | undefined;
  'aria-invalid'?: true | undefined;
}

export interface FieldProps {
  label: string;
  id?: string | undefined;
  hint?: string | undefined;
  error?: string | undefined;
  size?: FieldSize;
  disabled?: boolean | undefined;
  count?: string | undefined;
  hideLabel?: boolean | undefined;
  children: (control: ControlProps) => ReactNode;
}

export function FieldError({ id, children }: { id: string | undefined; children: ReactNode }) {
  return (
    <p id={id} className="field-error">
      <Icon name="alert-circle" size={16} />
      <span>
        <span className="visually-hidden">Error:</span> {children}
      </span>
    </p>
  );
}

export function Field({ label, id: givenId, hint, error, size = 'medium', disabled = false, count, hideLabel = false, children }: FieldProps) {
  const generatedId = useId();
  const id = givenId ?? generatedId;
  const messageId = error || hint ? `${id}-message` : undefined;
  const countId = count ? `${id}-count` : undefined;
  const describedBy = [messageId, countId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={`field field-${size}`} data-disabled={disabled || undefined}>
      <label className={hideLabel ? 'visually-hidden' : 'field-label'} htmlFor={id}>
        {label}
      </label>
      {children({ id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined })}
      {(messageId || countId) && (
        <div className="field-messages">
          {error ? (
            <FieldError id={messageId}>{error}</FieldError>
          ) : (
            hint && (
              <p id={messageId} className="field-hint">
                {hint}
              </p>
            )
          )}
          {count && (
            <span id={countId} className="field-count">
              {count}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
