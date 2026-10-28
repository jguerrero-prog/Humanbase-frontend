import { useState, type ChangeEvent, type ClipboardEvent, type KeyboardEvent } from 'react';
import { Field } from '../Field/Field';
import { parseGeneList } from '../GeneList/GeneList';
import { Tag } from '../Tag/Tag';
import { listJoin } from '../utils/wording';
import './GeneTagInput.css';

const separators = new Set([',', ' ', 'Enter']);

export function unknownGenesMessage(genes: string[]): string | undefined {
  if (genes.length === 0) return undefined;
  if (genes.length === 1) return `${genes[0]} isn’t a known human gene. Check the spelling or remove it.`;
  return `${listJoin(genes)} aren’t known human genes. Check the spelling or remove them.`;
}

export interface GeneTagInputProps {
  label: string;
  hint?: string | undefined;
  genes?: string[] | undefined;
  defaultGenes?: string[] | undefined;
  onChange?: ((genes: string[]) => void) | undefined;
  isKnownGene?: ((gene: string) => boolean) | undefined;
  placeholder?: string | undefined;
  disabled?: boolean | undefined;
  'data-state'?: 'focus' | undefined;
}

export function GeneTagInput({
  label,
  hint,
  genes,
  defaultGenes = [],
  onChange,
  isKnownGene = () => true,
  placeholder = 'Add a gene',
  disabled,
  'data-state': dataState,
}: GeneTagInputProps) {
  const [ownGenes, setOwnGenes] = useState(defaultGenes);
  const [draft, setDraft] = useState('');
  const [selectedLast, setSelectedLast] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const current = genes ?? ownGenes;
  const unknown = current.filter((gene) => !isKnownGene(gene));

  const update = (next: string[], message: string) => {
    setOwnGenes(next);
    onChange?.(next);
    setAnnouncement(message);
    setSelectedLast(false);
  };

  const add = (text: string) => {
    const added = parseGeneList(text).filter((gene) => !current.includes(gene));
    setDraft('');
    if (added.length > 0) update([...current, ...added], added.length === 1 ? `${added[0]} added` : `${added.length} genes added`);
  };

  const remove = (gene: string) => update(current.filter((each) => each !== gene), `${gene} removed`);

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (separators.has(event.key) && draft.trim()) {
      event.preventDefault();
      add(draft);
    } else if (event.key === 'Backspace' && draft === '' && current.length > 0) {
      event.preventDefault();
      const last = current.at(-1) ?? '';
      if (selectedLast) remove(last);
      else {
        setSelectedLast(true);
        setAnnouncement(`${last} selected. Press Backspace again to remove it.`);
      }
    } else {
      setSelectedLast(false);
    }
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const text = event.target.value;
    if (/[\s,;]$/.test(text)) add(text);
    else setDraft(text);
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    add(draft + event.clipboardData.getData('text'));
  };

  return (
    <Field label={label} hint={hint} error={unknownGenesMessage(unknown)} disabled={disabled}>
      {(control) => (
        <div className="gene-tags" data-disabled={disabled || undefined} data-state={dataState}>
          {current.length > 0 && (
            <ul className="gene-tags-list" aria-label={`${label} added`}>
              {current.map((gene, index) => (
                <li key={gene}>
                  <Tag label={gene} invalid={!isKnownGene(gene)} disabled={disabled} selected={selectedLast && index === current.length - 1} onRemove={() => remove(gene)} />
                </li>
              ))}
            </ul>
          )}
          <input
            {...control}
            className="gene-tags-input"
            value={draft}
            placeholder={placeholder}
            disabled={disabled}
            spellCheck={false}
            autoComplete="off"
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            onBlur={() => draft.trim() && add(draft)}
          />
          <p className="visually-hidden" role="status">
            {announcement}
          </p>
        </div>
      )}
    </Field>
  );
}
