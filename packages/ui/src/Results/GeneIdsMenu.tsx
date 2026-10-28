import { Button } from '../Button/Button';
import { useDisclosureMenu } from '../hooks/useDisclosureMenu';
import { Icon } from '../Icon/Icon';
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
  onOpenChange?: (open: boolean) => void;
}

export function GeneIdsMenu({ gene, links, open, onOpenChange }: GeneIdsMenuProps) {
  const { root, button, panel, buttonProps, panelProps } = useDisclosureMenu({ open, onOpenChange });

  return (
    <div ref={root} className="gene-ids">
      <Button variant="ghost" size="small" ref={button} {...buttonProps}>
        Gene IDs
      </Button>
      <MenuPanel ref={panel} {...panelProps} className="gene-ids-panel">
        <ul aria-label={`${gene} in other databases`}>
          {links.map((link) => (
            <li key={link.source}>
              <a className="menu-item" href={link.href} target="_blank" rel="noreferrer">
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
