import { useId, useRef, type KeyboardEvent } from 'react';
import { Button } from '../Button/Button';
import { useControlled } from '../hooks/useControlled';
import { Icon } from '../Icon/Icon';
import { useDismiss } from '../List/useDismiss';
import { MenuPanel } from '../Menu/Menu';
import './Results.css';

export interface GeneIdLink {
  source: string;
  id: string;
  href: string;
  site: string;
}

export interface GeneIdsMenuProps {
  gene: string;
  links: readonly GeneIdLink[];
  open?: boolean;
}

export function GeneIdsMenu({ gene, links, open }: GeneIdsMenuProps) {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const [isOpen, setOpen] = useControlled(open, false);
  useDismiss(root, isOpen, () => setOpen(false));

  const closeOnEscape = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || !isOpen) return;
    event.preventDefault();
    setOpen(false);
    root.current?.querySelector('button')?.focus();
  };

  return (
    <div ref={root} className="gene-ids">
      <Button variant="ghost" size="small" aria-expanded={isOpen} aria-controls={id} onKeyDown={closeOnEscape} onClick={() => setOpen(!isOpen)}>
        Gene IDs
      </Button>
      <MenuPanel id={id} className="gene-ids-panel" hidden={!isOpen}>
        <ul aria-label={`${gene} in other databases`}>
          {links.map((link) => (
            <li key={link.source}>
              <a className="menu-item" href={link.href} target="_blank" rel="noreferrer" onKeyDown={closeOnEscape}>
                <span className="menu-item-text">
                  <span className="menu-item-label">
                    {link.source} <span className="gene-ids-value">{link.id}</span>
                  </span>
                  <span className="menu-item-description">Opens {link.site} in a new tab</span>
                </span>
                <Icon name="external-link" size={16} />
              </a>
            </li>
          ))}
        </ul>
      </MenuPanel>
    </div>
  );
}
