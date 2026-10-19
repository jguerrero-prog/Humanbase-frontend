import { useGeneSuggestions, useHumanbase } from '@humanbase/data';
import { Alert, SearchExamples, SearchField, useDebounced } from '@humanbase/ui';
import { useState } from 'react';
import { suggestionOf } from '../HomeSearch/geneMatches';

export interface GeneFinderProps {
  label: string;
  placeholder: string;
  /** Symbols offered under the field, such as IRGM. */
  examples: readonly string[];
  /** Opens the chosen gene's page. */
  onPick: (entrez: number) => void;
}

/** One gene: suggestions while typing, and examples that open a gene straight away. */
export function GeneFinder({ label, placeholder, examples, onPick }: GeneFinderProps) {
  const api = useHumanbase();
  const [text, setText] = useState('');
  const [missing, setMissing] = useState<string>();
  const settled = useDebounced(text);
  const suggestions = useGeneSuggestions(settled);
  const typing = text.trim().length >= 2;

  const openExample = async (symbol: string) => {
    setMissing(undefined);
    const [gene] = await api.search.exact(symbol).catch(() => []);
    if (gene) onPick(gene.entrez);
    else setMissing(symbol);
  };

  return (
    <div className="gene-finder">
      <SearchField
        label={label}
        placeholder={placeholder}
        value={text}
        onChange={(event) => setText(event.target.value)}
        onClear={() => setText('')}
        suggestions={typing ? (suggestions.data?.map((gene) => suggestionOf(gene, text)) ?? []) : []}
        suggestionsLoading={typing && (suggestions.isFetching || settled !== text)}
        onSuggestionSelect={(suggestion) => onPick(Number(suggestion.id))}
      />
      <SearchExamples examples={examples.map((symbol) => ({ label: symbol, onSelect: () => void openExample(symbol) }))} />
      {missing && (
        <Alert tone="warning" title={`${missing} couldn’t be found`} dismissible onDismiss={() => setMissing(undefined)}>
          Gene search didn’t answer for this example. Type the symbol to search for it instead.
        </Alert>
      )}
    </div>
  );
}
