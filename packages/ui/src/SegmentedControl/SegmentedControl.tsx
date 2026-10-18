import { useId } from 'react';
import { useControlled } from '../hooks/useControlled';
import { Icon, type IconName } from '../Icon/Icon';
import './SegmentedControl.css';

export interface Segment {
  value: string;
  label: string;
  icon?: IconName;
  disabled?: boolean;
  'data-state'?: 'hover' | 'focus';
}

export interface SegmentedControlProps {
  label: string;
  segments: readonly Segment[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  size?: 'medium' | 'small';
  hideLabel?: boolean;
  name?: string;
  className?: string;
}

export function SegmentedControl({ label, segments, value, defaultValue, onChange, size = 'medium', hideLabel = false, name, className }: SegmentedControlProps) {
  const id = useId();
  const [selected, setSelected] = useControlled(value, defaultValue ?? segments[0]?.value ?? '');

  const choose = (next: string) => {
    setSelected(next);
    onChange?.(next);
  };

  return (
    <div role="radiogroup" aria-labelledby={`${id}-label`} className={['segmented', `segmented-${size}`, className].filter(Boolean).join(' ')}>
      <span id={`${id}-label`} className={hideLabel ? 'visually-hidden' : 'segmented-label'}>
        {label}
      </span>
      <div className="segmented-track">
        {segments.map((segment) => (
          <label key={segment.value} className="segment" data-state={segment['data-state']}>
            <input
              type="radio"
              name={name ?? id}
              value={segment.value}
              checked={segment.value === selected}
              disabled={segment.disabled}
              onChange={() => choose(segment.value)}
            />
            {segment.icon && <Icon name={segment.icon} size={size === 'medium' ? 20 : 16} />}
            <span className="segment-label" data-label={segment.label}>
              {segment.label}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
