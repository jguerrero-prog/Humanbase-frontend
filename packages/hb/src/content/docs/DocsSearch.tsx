import { SearchField, type SearchSuggestion } from '@humanbase/ui';
import { useMemo, useState } from 'react';
import { docsLibrary } from './DocsLibrary';
import { DocsSearchIndex } from './DocsSearchIndex';

export interface DocsSearchProps {
  /** Opens a result's route, such as /docs/sei/#output. */
  onOpen: (href: string) => void;
}

let index: DocsSearchIndex | undefined;
const searchIndex = () => (index ??= new DocsSearchIndex(docsLibrary.pages));

/** The sidebar's "Search the docs" field: results by section as you type, opened with Enter or a click. */
export function DocsSearch({ onOpen }: DocsSearchProps) {
  const [query, setQuery] = useState('');
  const suggestions = useMemo<SearchSuggestion[]>(
    () => searchIndex().search(query).map((hit) => ({ id: hit.id, label: hit.title, ...(hit.title !== hit.page && { description: hit.page }), details: hit.snippet })),
    [query],
  );
  return (
    <SearchField
      label="Search the docs"
      placeholder="Search the docs"
      size="medium"
      value={query}
      onChange={(event) => setQuery(event.target.value)}
      onClear={() => setQuery('')}
      suggestions={suggestions}
      matchNoun="pages"
      noMatchesText="Try another word, or browse the pages below."
      enterHint="open section"
      inlineSuggestions
      onSuggestionSelect={(suggestion) => {
        setQuery('');
        onOpen(suggestion.id);
      }}
    />
  );
}
