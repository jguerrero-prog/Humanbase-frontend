import type { DataType } from '@humanbase/data';
import { anchorSupported, Checkbox, Field, Icon, MenuPanel, placeUnder } from '@humanbase/ui';
import { useId, useRef, type CSSProperties } from 'react';

export interface DataTypesFilterProps {
  types: readonly DataType[];
  /** Chosen slugs; empty means every type. */
  value: readonly string[];
  onChange: (slugs: string[]) => void;
}

export function DataTypesFilter({ types, value, onChange }: DataTypesFilterProps) {
  const id = useId();
  const panelId = `${id}-types`;
  const anchor = `--types-${id.replace(/[^\w-]/g, '')}`;
  const button = useRef<HTMLButtonElement>(null);
  const chosen = new Set(value.length ? value : types.map((type) => type.slug));
  const summary = chosen.size === types.length ? `All ${types.length} types` : chosen.size === 1 ? (types.find((type) => chosen.has(type.slug))?.title ?? '1 type') : `${chosen.size} of ${types.length} types`;

  const toggle = (slug: string) => {
    const next = new Set(chosen);
    if (next.has(slug)) next.delete(slug);
    else next.add(slug);
    if (next.size === 0) return;
    onChange(next.size === types.length ? [] : types.map((type) => type.slug).filter((s) => next.has(s)));
  };

  return (
    <Field label="Data types" size="small">
      {(control) => (
        <div className="select select-small data-types">
          <button
            {...control}
            ref={button}
            type="button"
            className="field-control select-trigger"
            popoverTarget={panelId}
            style={{ anchorName: anchor } as CSSProperties}
          >
            <span className="select-value">{summary}</span>
            <Icon name="chevron-down" size={16} />
          </button>
          <MenuPanel
            id={panelId}
            popover="auto"
            className="data-types-panel"
            style={{ positionAnchor: anchor } as CSSProperties}
            onToggle={(event) => {
              if ((event as unknown as ToggleEvent).newState === 'open' && !anchorSupported && button.current) placeUnder(event.currentTarget, button.current, 'start');
            }}
          >
            <fieldset>
              <legend className="visually-hidden">Data types to integrate</legend>
              {types.map((type) => (
                <Checkbox key={type.slug} label={type.title} checked={chosen.has(type.slug)} onChange={() => toggle(type.slug)} />
              ))}
            </fieldset>
          </MenuPanel>
        </div>
      )}
    </Field>
  );
}
