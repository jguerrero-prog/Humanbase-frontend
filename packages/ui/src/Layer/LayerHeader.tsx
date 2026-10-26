import type { ReactNode } from 'react';
import { Icon } from '../Icon/Icon';
import './Layer.css';

export interface LayerHeaderProps {
  titleId: string;
  title: string;
  subtitle?: string | undefined;
  onClose?: (() => void) | undefined;
  className: string;
  /** Sits above the title, such as a drawer's Back button. */
  above?: ReactNode;
  /** Sits under the subtitle, such as a link to the subject elsewhere on the site. */
  below?: ReactNode;
}

export function LayerHeader({ titleId, title, subtitle, onClose, className, above, below }: LayerHeaderProps) {
  return (
    <header className={`layer-header ${className}`}>
      <div className="layer-titles">
        {above}
        <h2 id={titleId} className="layer-title" tabIndex={-1}>
          {title}
        </h2>
        {subtitle && <p className="layer-subtitle">{subtitle}</p>}
        {below}
      </div>
      {onClose && (
        <button type="button" className="layer-close" aria-label="Close" onClick={onClose}>
          <Icon name="x" size={20} />
        </button>
      )}
    </header>
  );
}
