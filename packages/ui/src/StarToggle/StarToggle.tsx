import type { CSSProperties } from 'react';
import { Icon } from '../Icon/Icon';
import { Tooltip } from '../Tooltip/Tooltip';
import './StarToggle.css';

export interface StarToggleProps {
  /** What the star highlights, such as "peripheral blood". */
  name: string;
  pressed: boolean;
  /** The set's color token, such as `--viz-cat-1`, filled in while pressed. */
  color?: string | undefined;
  onToggle: () => void;
}

export function StarToggle({ name, pressed, color, onToggle }: StarToggleProps) {
  return (
    <Tooltip text="Highlight genes in the network">
      <button
        type="button"
        className="star-toggle"
        aria-pressed={pressed}
        aria-label={`Highlight ${name} genes in the network`}
        style={color ? ({ '--star-color': `var(${color})` } as CSSProperties) : undefined}
        onClick={onToggle}
      >
        <Icon name="star" size={16} />
      </button>
    </Tooltip>
  );
}
