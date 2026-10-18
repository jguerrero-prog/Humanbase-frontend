import { RemoveButton } from '../Tag/Tag';
import './ContextLabel.css';

export interface ContextLabelProps {
  name: string;
  value: string;
  onRemove?: (() => void) | undefined;
}

export function ContextLabel({ name, value, onRemove }: ContextLabelProps) {
  return (
    <span className="context-label" data-removable={onRemove ? true : undefined}>
      <span className="context-label-name">
        {name}
        <span className="visually-hidden">:</span>
      </span>
      <span className="context-label-value">
        {value}
        {onRemove && <RemoveButton aria-label={`Remove ${name}: ${value}`} onClick={onRemove} />}
      </span>
    </span>
  );
}
