import { useId, useMemo, useRef, useState, type ChangeEvent, type InputHTMLAttributes, type KeyboardEvent, type Ref } from 'react';
import { Badge } from '../Badge/Badge';
import { Icon } from '../Icon/Icon';
import { Alert } from '../Message/Alert';
import { ListNavigator } from '../List/ListNavigator';
import { useDismiss } from '../List/useDismiss';
import { MenuPanel } from '../Menu/Menu';
import { Spinner } from '../Spinner/Spinner';
import { useLinkHref } from '../hooks/useLinkHref';
import './SearchField.css';

export type SearchFieldSize = 'large' | 'medium';

/** A page a suggestion can open in, such as Networks. */
export interface SearchDestination {
  label: string;
  href: string;
}

export interface SearchSuggestion {
  id: string;
  label: string;
  description?: string;
  meta?: string;
  badges?: readonly string[];
  details?: string;
  /** Where the suggestion can open. Given, the suggestions become a grid with an Open in row of links, and nothing opens until one is chosen. */
  destinations?: readonly SearchDestination[];
}

export interface SearchFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'id' | 'type' | 'value' | 'defaultValue'> {
  label: string;
  ref?: Ref<HTMLInputElement>;
  size?: SearchFieldSize;
  loading?: boolean;
  value?: string;
  defaultValue?: string;
  onClear?: () => void;
  suggestions?: readonly SearchSuggestion[];
  suggestionsLoading?: boolean;
  /** The suggestions couldn’t load. Shown instead of “No genes match”, with Try again calling onRetry. */
  suggestionsFailed?: boolean;
  onRetry?: () => void;
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void;
  noMatchesText?: string;
  open?: boolean;
  defaultHighlight?: number;
  heading?: string;
  /** How many matched in all, shown beside the heading as “5 of 21” when more matched than are suggested. */
  total?: number;
  note?: string;
  inlineSuggestions?: boolean;
  /** What the suggestions are, for “No genes match”. */
  matchNoun?: string;
  /** What Enter does with a highlighted suggestion. */
  enterHint?: string;
}

export function SearchField({
  label, size = 'large', loading = false, value, defaultValue = '', disabled, className, onChange, onClear, onKeyDown,
  suggestions, suggestionsLoading = false, suggestionsFailed = false, onRetry, onSuggestionSelect, noMatchesText = 'Check the symbol, or search by Entrez ID or gene name.', open: openProp, defaultHighlight = -1, heading, total, note, inlineSuggestions = false, matchNoun = 'genes', enterHint = 'open gene', ref, onFocus, ...rest
}: SearchFieldProps) {
  const linkHref = useLinkHref();
  const id = useId();
  const listboxId = `${id}-suggestions`;
  const wrapper = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [ownText, setOwnText] = useState(defaultValue);
  const [ownOpen, setOwnOpen] = useState(false);
  const [highlight, setHighlight] = useState(defaultHighlight);
  const [column, setColumn] = useState(0);
  const text = value ?? ownText;
  const iconSize = size === 'large' ? 24 : 20;
  const offersSuggestions = suggestions !== undefined;
  const open = offersSuggestions && text.length > 0 && (openProp ?? ownOpen);
  const navigator = useMemo(() => new ListNavigator(suggestions ?? []), [suggestions]);
  const count = suggestions?.length ?? 0;
  const grid = suggestions?.some((suggestion) => suggestion.destinations?.length) ?? false;
  const destinationsOf = (row: number) => suggestions?.[row]?.destinations ?? [];
  const optionId = (index: number) => `${id}-suggestion-${index}`;
  const cellId = (row: number, at: number) => `${optionId(row)}-${at}`;
  const highlightRow = (row: number) => {
    setHighlight(row);
    setColumn((current) => Math.max(0, Math.min(current, destinationsOf(row).length - 1)));
  };

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

  const openDestination = (row: number, at: number) => document.getElementById(cellId(row, at))?.querySelector('a')?.click();

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      if (open) close();
      else if (text) clear();
    } else if (offersSuggestions && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      event.preventDefault();
      setOwnOpen(true);
      highlightRow(event.key === 'ArrowDown' ? navigator.next(highlight) : navigator.previous(highlight));
    } else if (grid && open && highlight >= 0 && (event.key === 'ArrowRight' || event.key === 'ArrowLeft')) {
      event.preventDefault();
      setColumn(Math.max(0, Math.min(column + (event.key === 'ArrowRight' ? 1 : -1), destinationsOf(highlight).length - 1)));
    } else if (grid && event.key === 'Enter') {
      // Enter never guesses a destination: with nothing highlighted it highlights the first, so the next Enter opens it.
      event.preventDefault();
      if (highlight >= 0 && open) openDestination(highlight, column);
      else if (count > 0) {
        setOwnOpen(true);
        setHighlight(0);
        setColumn(0);
      }
    } else if (event.key === 'Enter' && open && highlight >= 0) {
      event.preventDefault();
      choose(suggestions?.[highlight]);
    }
    onKeyDown?.(event);
  };

  const activeId = grid && destinationsOf(highlight).length > 0 ? cellId(highlight, column) : optionId(highlight);
  const failure = new SuggestionsFailure(text);
  const retry = () => {
    input.current?.focus();
    onRetry?.();
  };
  const announcement =
    !open || suggestionsLoading ? '' : suggestionsFailed ? failure.announcement : count === 0 ? `No ${matchNoun} match “${text}”` : `${count} ${count === 1 ? 'suggestion' : 'suggestions'}`;

  return (
    <div ref={wrapper} className={['search-field-group', inlineSuggestions && 'search-field-inline', className].filter(Boolean).join(' ')}>
      <div className={`search-field search-field-${size}`} data-disabled={disabled || undefined}>
        <label className="visually-hidden" htmlFor={id}>
          {label}
        </label>
        <Icon name="search" size={iconSize} />
        <input
          {...rest}
          ref={(node) => {
            input.current = node;
            if (typeof ref === 'function') ref(node);
            else if (ref) ref.current = node;
          }}
          id={id}
          type="search"
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          // Coming back to text already typed, or set by an example, shows its suggestions again.
          onFocus={(event) => {
            if (text) setOwnOpen(true);
            onFocus?.(event);
          }}
          disabled={disabled}
          aria-busy={loading || undefined}
          className="search-field-input"
          {...(offersSuggestions && {
            role: 'combobox',
            'aria-autocomplete': 'list' as const,
            'aria-haspopup': grid ? ('grid' as const) : ('listbox' as const),
            'aria-expanded': open,
            'aria-controls': open ? listboxId : undefined,
            'aria-activedescendant': open && highlight >= 0 ? activeId : undefined,
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
          ) : suggestionsFailed ? (
            <Alert tone="error" title={SuggestionsFailure.title} live={false} className="search-suggestions-error" {...(onRetry && { action: { label: 'Try again', onSelect: retry } })}>
              {failure.text}
            </Alert>
          ) : count === 0 ? (
            <SuggestionsEmpty query={text} text={noMatchesText} noun={matchNoun} />
          ) : (
            <>
              {heading && (
                <p className="search-suggestions-heading">
                  {heading}
                  {total !== undefined && total > count && <span className="search-suggestions-count">{`${count} of ${total}`}</span>}
                </p>
              )}
              {grid ? (
                <div id={listboxId} role="grid" aria-label={heading ?? label} className="menu-list">
                  {suggestions?.map((suggestion, row) => (
                    <div
                      key={suggestion.id}
                      id={optionId(row)}
                      role="row"
                      className={['search-suggestion', 'search-suggestion-stacked', row === highlight && 'search-suggestion-highlighted'].filter(Boolean).join(' ')}
                      onPointerDown={(event) => event.preventDefault()}
                      onPointerEnter={() => highlightRow(row)}
                    >
                      <div role="rowheader" className="search-suggestion-header">
                        <SuggestionBody suggestion={suggestion} query={text} />
                      </div>
                      <div className="search-suggestion-destinations">
                        <span className="search-suggestion-open-in" aria-hidden="true">Open in</span>
                        {suggestion.destinations?.map((destination, at) => (
                          <div key={destination.label} id={cellId(row, at)} role="gridcell" aria-selected={row === highlight && at === column}>
                            <a
                              className="button button-ghost button-small"
                              data-state={row === highlight && at === column ? 'hover' : undefined}
                              href={linkHref(destination.href)}
                              tabIndex={-1}
                              aria-label={`${suggestion.label} in ${destination.label}`}
                              onPointerEnter={() => setColumn(at)}
                              onClick={close}
                            >
                              {destination.label}
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
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
                      <SuggestionBody suggestion={suggestion} query={text} />
                    )}
                  </div>
                ))}
              </div>
              )}
              {note ? (
                <p className="search-suggestions-note">{note}</p>
              ) : (
                <p className="search-suggestions-keys" aria-hidden="true">
                  <span><kbd>↑ ↓</kbd> {grid ? 'result' : 'move'}</span>
                  {grid && <span><kbd>← →</kbd> destination</span>}
                  <span><kbd>Enter</kbd> {grid ? 'open' : enterHint}</span>
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
      <Spinner size={16} />
      Searching genes…
    </p>
  );
}

/** What the suggestions panel says when the request fails, so a failure never reads as “No genes match”. */
class SuggestionsFailure {
  static readonly title = 'Suggestions couldn’t load';

  constructor(private readonly query: string) {}

  get text(): string {
    return `Humanbase didn’t answer, so “${this.query}” hasn’t been checked yet. What you typed is still here.`;
  }

  get announcement(): string {
    return `Error: ${SuggestionsFailure.title}. ${this.text}`;
  }
}

export function SuggestionsEmpty({ query, text, noun = 'genes' }: { query: string; text: string; noun?: string }) {
  return (
    <div className="search-suggestions-empty">
      <p className="search-suggestions-empty-title">No {noun} match “{query}”</p>
      <p>{text}</p>
    </div>
  );
}

function SuggestionBody({ suggestion, query }: { suggestion: SearchSuggestion; query: string }) {
  return (
    <>
      <span className="search-suggestion-title">
        <SuggestionLine suggestion={suggestion} query={query} />
      </span>
      {suggestion.badges && suggestion.badges.length > 0 && (
        <span className="search-suggestion-badges">
          {suggestion.badges.map((badge) => (
            <Badge key={badge} size="small">{badge}</Badge>
          ))}
        </span>
      )}
      {suggestion.details && <span className="search-suggestion-details">{suggestion.details}</span>}
    </>
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
