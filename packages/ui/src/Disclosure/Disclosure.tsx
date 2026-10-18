import { useState } from 'react';
import { Icon } from '../Icon/Icon';
import './Disclosure.css';

export interface DisclosureProps {
  label: string;
  expandedLabel: string;
  controls: string;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function Disclosure({ label, expandedLabel, controls, open, defaultOpen = false, onOpenChange }: DisclosureProps) {
  const [ownOpen, setOwnOpen] = useState(defaultOpen);
  const isOpen = open ?? ownOpen;
  const toggle = () => {
    setOwnOpen(!isOpen);
    onOpenChange?.(!isOpen);
  };

  return (
    <button type="button" className="disclosure" aria-expanded={isOpen} aria-controls={controls} onClick={toggle}>
      {isOpen ? expandedLabel : label}
      <Icon name={isOpen ? 'chevron-up' : 'chevron-down'} size={16} />
    </button>
  );
}
