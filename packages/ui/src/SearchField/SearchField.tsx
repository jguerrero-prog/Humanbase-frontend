import { useId, useMemo, useRef, useState, type ChangeEvent, type InputHTMLAttributes, type KeyboardEvent } from 'react';
import { Badge } from '../Badge/Badge';
import { Icon } from '../Icon/Icon';
import { ListNavigator } from '../List/ListNavigator';
import { useDismiss } from '../List/useDismiss';
import { MenuPanel } from '../Menu/Menu';
import { Spinner } from '../Spinner/Spinner';
import './SearchField.css';

export type SearchFieldSize = 'large' | 'medium';

export interface SearchSuggestion {
  id: string;
  label: string;
  description?: string;
  meta?: string;
  badges?: readonly string[];
  details?: string;
}

export interface SearchFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'id' | 'type' | 'value' | 'defaultValue'> {
  label: string;
  size?: SearchFieldSize;
  loading?: boolean;
  value?: string;
  defaultValue?: string;
  onClear?: () => void;
  suggestions?: readonly SearchSuggestion[];
  suggestionsLoading?: boolean;
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void;
  noMatchesText?: string;
  open?: boolean;
  defaultHighlight?: number;
  heading?: string;
  note?: string;
  inlineSuggestions?: boolean;
  /** What the suggestions are, for “No genes match”. */
  matchNoun?: string;
  /** What Enter does with a highlighted suggestion. */
  enterHint?: string;
}

export function SearchField({
  label, size = 'large', loading = false, value, defaultValue = '', disabled, className, onChange, onClear, onKeyDown,
  suggestions, suggestionsLoading = false, onSuggestionSelect, noMatchesText = 'Check the symbol, or search by Entrez ID or gene name.', open: openProp, defaultHighlight = -1, heading, note, inlineSuggestions = false, matchNoun = 'genes', enterHint = 'open gene', ...rest
}: SearchFieldProps) {
  const id = useId();
  const listboxId = `${id}-suggestions`;
  const wrapper = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [ownText, setOwnText] = useState(defaultValue);
  const [ownOpen, setOwnOpen] = useState(false);
  const [highlight, setHighlight] = useState(defaultHighlight);
  const text = value ?? ownText;
  const iconSize = size === 'large' ? 24 : 20;
  const offersSuggestions = suggestions !== undefined;
  const open = offersSuggestions && text.length > 0 && (openProp ?? ownOpen);
  const navigator = useMemo(() => new ListNavigator(suggestions ?? []), [suggestions]);

  const close = () => {
    setOwnOpen(false);
    setHighlight(-1);
  };
  useDismiss(wrapper, open && openProp === undefined, close);

  const clear = () => {
    setOwnText('');
    close();
    onClear?.();
    input.current?.focus();
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setOwnText(event.target.value);
    setOwnOpen(true);
    setHighlight(-1);
    onChange?.(event);
  };

  const choose = (suggestion: SearchSuggestion | undefined) => {
    if (!suggestion) return;
    close();
    onSuggestionSelect?.(suggestion);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      if (open) close();
      else if (text) clear();
    } else if (offersSuggestions && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      event.preventDefault();
      setOwnOpen(true);
      setHighlight(event.key === 'ArrowDown' ? navigator.next(highlight) : navigator.previous(highlight));
    } else if (event.key === 'Enter' && open && highlight >= 0) {
      event.preventDefault();
      choose(suggestions?.[highlight]);
    }
    onKeyDown?.(event);
  };

  const optionId = (index: number) => `${id}-suggestion-${index}`;
  const count = suggestions?.length ?? 0;
  const announcement = !open || suggestionsLoading ? '' : count === 0 ? `No ${matchNoun} match “${text}”` : `${count} ${count === 1 ? 'suggestion' : 'suggestions'}`;

  return (
    <div ref={wrapper} className={['search-field-group', inlineSuggestions && 'search-field-inline', className].filter(Boolean).join(' ')}>
      <div className={`search-field search-field-${size}`} data-disabled={disabled || undefined}>
        <label className="visually-hidden" htmlFor={id}>
          {label}
        </label>
        <Icon name="search" size={iconSize} />
        <input
          {...rest}
          ref={input}
          id={id}
          type="search"
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          aria-busy={loading || undefined}
          className="search-field-input"
          {...(offersSuggestions && {
            role: 'combobox',
            'aria-autocomplete': 'list' as const,
            'aria-expanded': open,
            'aria-controls': open ? listboxId : undefined,
            'aria-activedescendant': open && highlight >= 0 ? optionId(highlight) : undefined,
          })}
        />
        {loading ? (
          <Spinner size={20} />
        ) : (
          text &&
          !disabled && (
            <button type="button" className="search-field-clear" onClick={clear} aria-label="Clear search">
              <Icon name="x" size={iconSize} />
            </button>
          )
        )}
        {offersSuggestions && (
          <p className="visually-hidden" aria-live="polite">
            {announcement}
          </p>
        )}
      </div>
      {open && (
        <MenuPanel className="search-suggestions">
          {suggestionsLoading ? (
            <SuggestionsLoading />
          ) : count === 0 ? (
            <SuggestionsEmpty query={text} text={noMatchesText} noun={matchNoun} />
          ) : (
            <>
              {heading && <p className="search-suggestions-heading">{heading}</p>}
              <div id={listboxId} role="listbox" aria-label={heading ?? label} className="menu-list">
                {suggestions?.map((suggestion, index) => (
                  // Options are chosen with the keyboard through the combobox input (aria-activedescendant).
                  // eslint-disable-next-line jsx-a11y/click-events-have-key-events
                  <div
                    key={suggestion.id}
                    id={optionId(index)}
                    role="option"
                    tabIndex={-1}
                    aria-selected={index === highlight}
                    className={['search-suggestion', suggestion.details !== undefined && 'search-suggestion-stacked', index === highlight && 'search-suggestion-highlighted'].filter(Boolean).join(' ')}
                    onPointerDown={(event) => event.preventDefault()}
                    onPointerEnter={() => setHighlight(index)}
                    onClick={() => choose(suggestion)}
                  >
                    {suggestion.details === undefined ? (
                      <SuggestionLine suggestion={suggestion} query={text} />
                    ) : (
                      <>
                        <span className="search-suggestion-title">
                          <SuggestionLine suggestion={suggestion} query={text} />
                        </span>
                        {suggestion.badges && (
                          <span className="search-suggestion-badges">
                            {suggestion.badges.map((badge) => (
                              <Badge key={badge} size="small">{badge}</Badge>
                            ))}
                          </span>
                        )}
                        <span className="search-suggestion-details">{suggestion.details}</span>
                      </>
                    )}
                  </div>
                ))}
              </div>
              {note ? (
                <p className="search-suggestions-note">{note}</p>
              ) : (
                <p className="search-suggestions-keys" aria-hidden="true">
                  <span><kbd>↑ ↓</kbd> move</span>
                  <span><kbd>Enter</kbd> {enterHint}</span>
                  <span><kbd>Esc</kbd> close</span>
                </p>
              )}
            </>
          )}
        </MenuPanel>
      )}
    </div>
  );
}

export function SuggestionsLoading() {
  return (
    <p className="search-suggestions-status">
      <Icon name="refresh" size={16} />
      Searching genes…
    </p>
  );
}

export function SuggestionsEmpty({ query, text, noun = 'genes' }: { query: string; text: string; noun?: string }) {
  return (
    <div className="search-suggestions-empty">
      <p className="search-suggestions-empty-title">No {noun} match “{query}”</p>
      <p>{text}</p>
    </div>
  );
}

function SuggestionLine({ suggestion, query }: { suggestion: SearchSuggestion; query: string }) {
  return (
    <>
      <MatchedLabel label={suggestion.label} query={query} />
      {suggestion.description && <span className="search-suggestion-description">{suggestion.description}</span>}
      {suggestion.meta && <span className="search-suggestion-meta">{suggestion.meta}</span>}
    </>
  );
}

function MatchedLabel({ label, query }: { label: string; query: string }) {
  const start = label.toLowerCase().indexOf(query.toLowerCase());
  if (!query || start < 0) return <span className="search-suggestion-label">{label}</span>;
  return (
    <span className="search-suggestion-label">
      {label.slice(0, start)}
      <strong>{label.slice(start, start + query.length)}</strong>
      {label.slice(start + query.length)}
    </span>
  );
}
