import { useId, useRef, useState, type ChangeEvent, type InputHTMLAttributes, type KeyboardEvent } from 'react';
import { Icon } from '../Icon/Icon';
import { Spinner } from '../Spinner/Spinner';
import './SearchField.css';

export type SearchFieldSize = 'large' | 'medium';

export interface SearchFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'id' | 'type' | 'value' | 'defaultValue'> {
  label: string;
  size?: SearchFieldSize;
  loading?: boolean;
  value?: string;
  defaultValue?: string;
  onClear?: () => void;
}

export function SearchField({ label, size = 'large', loading = false, value, defaultValue = '', disabled, className, onChange, onClear, onKeyDown, ...rest }: SearchFieldProps) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [ownText, setOwnText] = useState(defaultValue);
  const text = value ?? ownText;
  const iconSize = size === 'large' ? 24 : 20;

  const clear = () => {
    setOwnText('');
    onClear?.();
    input.current?.focus();
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setOwnText(event.target.value);
    onChange?.(event);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape' && text) {
      event.preventDefault();
      clear();
    }
    onKeyDown?.(event);
  };

  return (
    <div className={['search-field', `search-field-${size}`, className].filter(Boolean).join(' ')} data-disabled={disabled || undefined}>
      <label className="visually-hidden" htmlFor={id}>
        {label}
      </label>
      <Icon name="search" size={iconSize} />
      <input
        {...rest}
        ref={input}
        id={id}
        type="search"
        value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-busy={loading || undefined}
        className="search-field-input"
      />
      {loading ? (
        <Spinner size={20} />
      ) : (
        text &&
        !disabled && (
          <button type="button" className="search-field-clear" onClick={clear} aria-label="Clear search">
            <Icon name="x" size={iconSize} />
          </button>
        )
      )}
    </div>
  );
}
