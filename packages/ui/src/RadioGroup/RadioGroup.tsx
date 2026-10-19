import { useId } from 'react';
import { FieldError } from '../Field/Field';
import { useControlled } from '../hooks/useControlled';
import './RadioGroup.css';

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
  'data-state'?: 'hover' | 'focus' | 'error';
}

export interface RadioGroupProps {
  legend: string;
  options: readonly RadioOption[];
  hint?: string;
  error?: string | undefined;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  direction?: 'column' | 'row';
  disabled?: boolean;
  hideLegend?: boolean;
  name?: string;
  className?: string;
}

export function RadioGroup({ legend, options, hint, error, value, defaultValue, onChange, direction = 'column', disabled, hideLegend = false, name, className }: RadioGroupProps) {
  const id = useId();
  const [selected, setSelected] = useControlled(value, defaultValue ?? '');
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <fieldset
      className={['radio-group', `radio-group-${direction}`, className].filter(Boolean).join(' ')}
      disabled={disabled}
      data-invalid={error ? true : undefined}
      aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
    >
      <legend className={hideLegend ? 'visually-hidden' : 'radio-group-legend'}>{legend}</legend>
      {hint && (
        <p id={hintId} className="radio-group-hint">
          {hint}
        </p>
      )}
      <div className="radio-group-options">
        {options.map((option) => (
          <label key={option.value} className="radio" data-state={option['data-state']}>
            <input
              type="radio"
              name={name ?? id}
              value={option.value}
              checked={option.value === selected}
              disabled={option.disabled}
              onChange={() => {
                setSelected(option.value);
                onChange?.(option.value);
              }}
            />
            <span className="radio-text">
              <span className="radio-label">{option.label}</span>
              {option.description && <span className="radio-description">{option.description}</span>}
            </span>
          </label>
        ))}
      </div>
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </fieldset>
  );
}
