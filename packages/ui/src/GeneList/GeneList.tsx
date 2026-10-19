import { useState, type ChangeEvent, type TextareaHTMLAttributes } from 'react';
import { Field } from '../Field/Field';
import './GeneList.css';

export function parseGeneList(text: string): string[] {
  return text.split(/[\s,;]+/).filter(Boolean);
}

export interface GeneListProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id' | 'value' | 'defaultValue'> {
  label: string;
  hint?: string;
  error?: string;
  value?: string;
  defaultValue?: string;
}

export function GeneList({ label, hint, error, value, defaultValue = '', disabled, className, onChange, ...rest }: GeneListProps) {
  const [ownText, setOwnText] = useState(defaultValue);
  const text = value ?? ownText;
  const count = parseGeneList(text).length;

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setOwnText(event.target.value);
    onChange?.(event);
  };

  return (
    <Field label={label} hint={hint} error={error} disabled={disabled} count={`${count} ${count === 1 ? 'gene' : 'genes'}`}>
      {(control) => (
        <textarea
          {...rest}
          {...control}
          value={text}
          onChange={handleChange}
          disabled={disabled}
          spellCheck={false}
          className={['field-control', 'gene-list', className].filter(Boolean).join(' ')}
        />
      )}
    </Field>
  );
}
