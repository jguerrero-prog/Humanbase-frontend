import { useEffect, useEffectEvent, useRef, type KeyboardEvent, type SyntheticEvent } from 'react';

export interface LayerOptions {
  open: boolean;
  inline: boolean;
  modal: boolean;
  onClose: () => void;
  initialFocus: (layer: HTMLDialogElement) => HTMLElement | null;
  closeOnBackdrop?: boolean;
}

/** Opens a native dialog element when `open` turns true, and hands focus back to whatever opened it on close. */
export function useLayer({ open, inline, modal, onClose, initialFocus, closeOnBackdrop = false }: LayerOptions) {
  const ref = useRef<HTMLDialogElement>(null);

  const show = useEffectEvent((layer: HTMLDialogElement) => {
    if (modal) layer.showModal();
    else layer.show();
    initialFocus(layer)?.focus();
  });
  // A click lands on the dialog element itself only outside its frame, which is the backdrop.
  const clickBackdrop = useEffectEvent((event: MouseEvent) => {
    if (closeOnBackdrop && event.target === ref.current) onClose();
  });

  useEffect(() => {
    const layer = ref.current;
    if (!open || inline || !layer) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const onClick = (event: MouseEvent) => clickBackdrop(event);
    show(layer);
    layer.addEventListener('click', onClick);
    return () => {
      layer.removeEventListener('click', onClick);
      layer.close();
      opener?.focus();
    };
  }, [open, inline]);

  return {
    ref,
    open: inline || undefined,
    onKeyDown: (event: KeyboardEvent<HTMLDialogElement>) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      event.preventDefault();
      onClose();
    },
    onCancel: (event: SyntheticEvent<HTMLDialogElement>) => event.preventDefault(),
  };
}
