import { useId, type ReactNode } from 'react';
import { LayerHeader } from '../Layer/LayerHeader';
import { useLayer } from '../Layer/useLayer';
import './Dialog.css';

export type DialogSize = 'small' | 'medium' | 'large';
export type DialogKind = 'confirm' | 'destructive' | 'form';

export interface DialogProps {
  title: string;
  open?: boolean;
  onClose?: () => void;
  size?: DialogSize;
  kind?: DialogKind;
  actions?: ReactNode;
  showClose?: boolean;
  inline?: boolean;
  className?: string;
  children: ReactNode;
}

const firstField = '.dialog-body :is(input, select, textarea)';
const leastDestructiveAction = '.dialog-actions button';

export function Dialog({ title, open = false, onClose = () => {}, size = 'small', kind = 'confirm', actions, showClose = true, inline = false, className, children }: DialogProps) {
  const titleId = useId();
  const layer = useLayer({
    open,
    inline,
    modal: true,
    onClose,
    closeOnBackdrop: kind === 'confirm',
    initialFocus: (element) => element.querySelector<HTMLElement>(kind === 'form' ? firstField : leastDestructiveAction),
  });

  return (
    <dialog {...layer} aria-labelledby={titleId} className={['layer', 'dialog', `dialog-${size}`, inline && 'layer-inline', className].filter(Boolean).join(' ')}>
      <div className="dialog-frame">
        <LayerHeader titleId={titleId} title={title} onClose={showClose ? onClose : undefined} className="dialog-header" />
        <div className="dialog-body">{children}</div>
        {actions && <div className="dialog-actions">{actions}</div>}
      </div>
    </dialog>
  );
}
