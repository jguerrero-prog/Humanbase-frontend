import type { ComponentProps } from 'react';
import { Icon } from '../Icon/Icon';
import './Tag.css';

type TagState = 'hover' | 'focus';

export function RemoveButton({ className, ...rest }: Omit<ComponentProps<'button'>, 'type' | 'children'> & { 'aria-label': string }) {
  return (
    <button {...rest} type="button" className={['remove-button', className].filter(Boolean).join(' ')}>
      <Icon name="x" size={14} />
    </button>
  );
}

export interface TagProps {
  label: string;
  invalid?: boolean | undefined;
  disabled?: boolean | undefined;
  selected?: boolean | undefined;
  onRemove?: (() => void) | undefined;
  'data-state'?: TagState | undefined;
}

export function Tag({ label, invalid, disabled, selected, onRemove, 'data-state': dataState }: TagProps) {
  return (
    <span className="tag" data-invalid={invalid || undefined} data-disabled={disabled || undefined} data-selected={selected || undefined} data-state={dataState}>
      {invalid && <Icon name="alert-circle" size={14} label="Not a known gene:" />}
      <span className="tag-label">{label}</span>
      {onRemove && !disabled && <RemoveButton aria-label={`Remove ${label}`} onClick={onRemove} />}
    </span>
  );
}
