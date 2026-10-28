import { useId, useRef, useState, type CSSProperties, type FocusEvent } from 'react';
import { Checkbox } from '../Checkbox/Checkbox';
import { Field, type FieldSize } from '../Field/Field';
import { Icon } from '../Icon/Icon';
import { MenuPanel } from '../Menu/Menu';
import { anchorSupported, placeUnder } from '../Tooltip/placement';
import './Select.css';

export interface MultiSelectOption {
  value: string;
  label: string;
}

export interface MultiSelectProps {
  label: string;
  /** Plural noun for the summary, such as "types" in "3 of 5 types". */
  noun: string;
  options: readonly MultiSelectOption[];
  /** Chosen values; empty means every option. */
  value: readonly string[];
  /** Called once when the menu closes, only if the choice changed. */
  onChange: (values: string[]) => void;
  /** Read by screen readers as the group's name inside the menu. */
  legend?: string;
  size?: FieldSize;
  /** Draws the menu open in place, for documentation. */
  preview?: boolean;
}

export function multiSelectSummary(options: readonly MultiSelectOption[], chosen: ReadonlySet<string>, noun: string): string {
  if (chosen.size === options.length) return `All ${options.length} ${noun}`;
  if (chosen.size === 1) return options.find((option) => chosen.has(option.value))?.label ?? `1 of ${options.length} ${noun}`;
  return `${chosen.size} of ${options.length} ${noun}`;
}

export function MultiSelect({ label, noun, options, value, onChange, legend = label, size = 'small', preview = false }: MultiSelectProps) {
  const id = useId();
  const panelId = `${id}-panel`;
  const anchor = `--multi-${id.replace(/[^\w-]/g, '')}`;
  const button = useRef<HTMLButtonElement>(null);
  const applied = value.length ? value : options.map((option) => option.value);
  const [draft, setDraft] = useState<ReadonlySet<string> | null>(null);
  const chosen = draft ?? new Set(applied);

  const toggle = (option: string) => {
    const next = new Set(chosen);
    if (next.has(option)) next.delete(option);
    else next.add(option);
    if (next.size > 0) setDraft(next);
  };

  const apply = () => {
    if (!draft) return;
    setDraft(null);
    const same = draft.size === applied.length && applied.every((option) => draft.has(option));
    if (!same) onChange(draft.size === options.length ? [] : options.map((option) => option.value).filter((option) => draft.has(option)));
  };

  // Tabbing out of the menu closes it, which applies the choice.
  const closeOnLeave = (event: FocusEvent<HTMLDivElement>) => {
    const next = event.relatedTarget as Node | null;
    if (next && !event.currentTarget.contains(next) && next !== button.current && event.currentTarget.hasAttribute('popover')) event.currentTarget.hidePopover();
  };

  return (
    <Field label={label} size={size}>
      {(control) => (
        <div className={`select select-${size} multi-select`}>
          <button {...control} ref={button} type="button" className="field-control select-trigger" popoverTarget={preview ? undefined : panelId} aria-expanded={preview || undefined} style={{ anchorName: anchor } as CSSProperties}>
            <span className="select-value">{multiSelectSummary(options, chosen, noun)}</span>
            <Icon name="chevron-down" size={16} />
          </button>
          <MenuPanel
            id={panelId}
            popover={preview ? undefined : 'auto'}
            className={preview ? 'multi-select-panel is-static' : 'multi-select-panel'}
            style={{ positionAnchor: anchor } as CSSProperties}
            onBlur={closeOnLeave}
            onToggle={(event) => {
              const state = (event as unknown as ToggleEvent).newState;
              if (state === 'open' && !anchorSupported && button.current) placeUnder(event.currentTarget, button.current, 'start');
              if (state === 'closed') apply();
            }}
          >
            <fieldset>
              <legend className="visually-hidden">{legend}</legend>
              {options.map((option) => (
                <Checkbox key={option.value} label={option.label} checked={chosen.has(option.value)} onChange={() => toggle(option.value)} />
              ))}
            </fieldset>
            <p className="multi-select-note">Applies when the menu closes</p>
          </MenuPanel>
        </div>
      )}
    </Field>
  );
}
