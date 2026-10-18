import { createContext, useContext, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Icon } from '../Icon/Icon';
import './Accordion.css';

export type AccordionSize = 'default' | 'compact';

const SizeContext = createContext<AccordionSize>('default');

export interface AccordionProps {
  size?: AccordionSize;
  className?: string;
  children: ReactNode;
}

export function Accordion({ size = 'default', className, children }: AccordionProps) {
  return (
    <SizeContext value={size}>
      <div className={['accordion', `accordion-${size}`, className].filter(Boolean).join(' ')}>{children}</div>
    </SizeContext>
  );
}

export interface AccordionItemProps {
  title: string;
  summary?: string | undefined;
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  'data-state'?: 'hover' | 'focus';
  children: ReactNode;
}

export function AccordionItem({ title, summary, headingLevel = 3, open, defaultOpen = false, onOpenChange, disabled = false, 'data-state': dataState, children }: AccordionItemProps) {
  const id = useId();
  const size = useContext(SizeContext);
  const [ownOpen, setOwnOpen] = useState(defaultOpen);
  const isOpen = open ?? ownOpen;
  const setOpen = (next: boolean) => {
    setOwnOpen(next);
    onOpenChange?.(next);
  };
  const Heading = `h${headingLevel}` as const;

  return (
    <div className="accordion-item">
      <Heading className="accordion-heading">
        <button
          type="button"
          className="accordion-header"
          id={`${id}-header`}
          aria-expanded={isOpen}
          aria-controls={`${id}-content`}
          aria-disabled={disabled || undefined}
          data-state={dataState}
          onClick={() => !disabled && setOpen(!isOpen)}
        >
          <span className="accordion-title">{title}</span>
          {summary && (
            <span className="accordion-summary">
              <span className="visually-hidden">,</span> {summary}
            </span>
          )}
          <Icon name={isOpen ? 'chevron-up' : 'chevron-down'} size={size === 'compact' ? 16 : 20} />
        </button>
      </Heading>
      <UntilFound id={`${id}-content`} open={isOpen} onFound={() => setOpen(true)}>
        <div className="accordion-content">{children}</div>
      </UntilFound>
    </div>
  );
}

interface UntilFoundProps {
  id: string;
  open: boolean;
  onFound: () => void;
  children: ReactNode;
}

export function UntilFound({ id, open, onFound, children }: UntilFoundProps) {
  const ref = useRef<HTMLDivElement>(null);

  // React only writes hidden="" so the page's find can't reach closed content; upgrade it after render.
  useEffect(() => {
    const region = ref.current;
    if (!region || open) return;
    region.setAttribute('hidden', 'until-found');
    region.addEventListener('beforematch', onFound);
    return () => region.removeEventListener('beforematch', onFound);
  }, [open, onFound]);

  return (
    <div ref={ref} id={id} className="until-found" hidden={!open}>
      {children}
    </div>
  );
}
