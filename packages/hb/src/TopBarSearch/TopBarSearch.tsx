import { useGeneSuggestions } from '@humanbase/data';
import { SearchField, topBarSearchLabel, useDebounced } from '@humanbase/ui';
import { useState } from 'react';
import { suggestionOf } from '../HomeSearch/geneMatches';
import { geneDestinations } from './geneDestinations';

const shown = 5;

/** The top bar's gene search: each suggested gene lists the pages it can open in, and nothing opens until one is chosen. */
export function TopBarSearch() {
  const [text, setText] = useState('');
  const settled = useDebounced(text);
  const genes = useGeneSuggestions(settled);
  const found = genes.data ?? [];
  return (
    <SearchField
      size="medium"
      label={topBarSearchLabel}
      placeholder={topBarSearchLabel}
      value={text}
      onChange={(event) => setText(event.target.value)}
      onClear={() => setText('')}
      suggestions={found.slice(0, shown).map((gene) => ({ ...suggestionOf(gene, text), destinations: geneDestinations(gene) }))}
      suggestionsLoading={genes.isFetching || settled !== text}
      heading="Genes"
      total={found.length}
    />
  );
}
