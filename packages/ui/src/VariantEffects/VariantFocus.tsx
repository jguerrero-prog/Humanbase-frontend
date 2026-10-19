import { Button } from '../Button/Button';
import './VariantEffects.css';

export interface VariantFocusProps {
  /** The selected variant, such as chr1:109,817,590 G>T. */
  label: string;
  detail: string;
  onPrevious?: (() => void) | undefined;
  onNext?: (() => void) | undefined;
  hasPrevious?: boolean | undefined;
  hasNext?: boolean | undefined;
}

export function VariantFocus({ label, detail, onPrevious, onNext, hasPrevious = true, hasNext = true }: VariantFocusProps) {
  return (
    <div className="variant-focus">
      <p className="variant-focus-text">
        <span className="variant-focus-eyebrow">Selected variant</span>
        <span className="variant-focus-label">{label}</span> <span className="variant-focus-detail">{detail}</span>
      </p>
      <div className="variant-focus-steps">
        <Button variant="ghost" size="small" icon="chevron-left" aria-disabled={!hasPrevious || undefined} onClick={hasPrevious ? onPrevious : undefined}>
          Previous
        </Button>
        <Button variant="ghost" size="small" icon="chevron-right" aria-disabled={!hasNext || undefined} onClick={hasNext ? onNext : undefined}>
          Next
        </Button>
      </div>
    </div>
  );
}
