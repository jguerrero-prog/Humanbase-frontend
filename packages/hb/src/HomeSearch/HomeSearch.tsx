import { GeneSearchService, IntegrationService, NetworkQuery, useGeneSuggestions, useHumanbase, useIntegrations, type DataVersion, type GeneHit, type TermMatches } from '@humanbase/data';
import {
  Alert,
  Button,
  GeneMatchList,
  GeneMatchSummary,
  GeneMatchTable,
  genesWord,
  SearchExamples,
  SearchField,
  Select,
  useDebounced,
  type SearchSuggestion,
  useLinkHref,
} from '@humanbase/ui';
import { useEffect, useMemo, useRef, useState, type ClipboardEvent, type KeyboardEvent, type ReactNode } from 'react';
import { versionOptions } from '../content/dataVersions';
import { analysisColumns, analysisOptions, categoryCrumbs } from '../content/product';
import { hitsOf, matchOf, splitByVersion, suggestionOf } from './geneMatches';
import { OutsideVersionAlert } from './OutsideVersionAlert';
import './HomeSearch.css';

export interface HomeSearchProps {
  onShowNetwork: (query: NetworkQuery) => void;
  /** Shows the analysis menu; left out on the Networks page, which is the analysis. */
  onChooseAnalysis?: (analysis: string) => void;
  /** Adds the Autism gene set example, which opens Modules. */
  onExampleSet?: () => void;
  /** brand on the homepage's dark hero; light on a white page, such as Networks with no genes chosen. */
  surface?: 'brand' | 'light';
  /** Shown under the example searches, above the selected genes. */
  afterExamples?: ReactNode;
}

const exampleGenes = ['IL1B', 'BRCA1', 'PTEN'];
// As on humanbase.io: a term, not a gene, so it opens the suggestions for genes annotated to it.
const exampleTerm = 'cancer';

export function HomeSearch({ onShowNetwork, onChooseAnalysis, onExampleSet, afterExamples, surface = 'brand' }: HomeSearchProps) {
  const linkHref = useLinkHref();
  const api = useHumanbase();
  const [analysis, setAnalysis] = useState<string>();
  const [text, setText] = useState('');
  const searchInput = useRef<HTMLInputElement>(null);
  // An example term focuses the search once its text is in, so the field opens its suggestions.
  const [termShown, setTermShown] = useState(0);
  useEffect(() => {
    if (termShown) searchInput.current?.focus();
  }, [termShown]);
  const [list, setList] = useState(() => new GeneMatchList([]));
  const [genes, setGenes] = useState<ReadonlyMap<string, GeneHit>>(new Map());
  const [matching, setMatching] = useState(false);
  const [failed, setFailed] = useState(false);
  const [version, setVersion] = useState<DataVersion>(NetworkQuery.defaultVersion);
  const [tissue, setTissue] = useState('');

  const typingOne = !/\s/.test(text.trim());
  const settled = useDebounced(typingOne ? text : '');
  const suggestions = useGeneSuggestions(settled);
  const networks = useIntegrations();
  const tissues = useMemo(() => (networks.data ? IntegrationService.pick(networks.data, 'tissue', version) : []), [networks.data, version]);

  // Searches finish late, so each update builds on the current state rather than the one the search started from.
  const add = (found: readonly TermMatches[]) => {
    setGenes((current) => new Map([...current, ...hitsOf(found)]));
    setList((current) => {
      const typedBefore = new Set(current.matches.flatMap((match) => match.typed.map((term) => term.toLowerCase())));
      const fresh = found.filter((term) => !typedBefore.has(term.typed.toLowerCase()));
      return new GeneMatchList([...current.matches, ...fresh.map(matchOf)]);
    });
    setAnalysis('networks');
  };

  const match = async (find: () => Promise<TermMatches[]>) => {
    const searched = text;
    setMatching(true);
    setFailed(false);
    try {
      add(await find());
      setText((current) => (current === searched ? '' : current));
    } catch {
      setFailed(true);
    } finally {
      setMatching(false);
    }
  };

  const chooseSuggestion = (suggestion: SearchSuggestion) => {
    const gene = suggestions.data?.find((hit) => String(hit.entrez) === suggestion.id);
    if (!gene) return;
    add([{ typed: text.trim(), genes: [gene] }]);
    setText('');
  };

  const runTyped = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter' || event.defaultPrevented || !text.trim()) return;
    event.preventDefault();
    void match(() => api.search.list(GeneSearchService.terms(text)));
  };

  // Inputs drop line breaks from pasted text, which would glue a pasted column of genes together.
  const pasteList = (event: ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData('text');
    if (!/[\n,;\t]/.test(pasted)) return;
    event.preventDefault();
    setText(`${text} ${GeneSearchService.terms(pasted).join(' ')}`.trim());
  };

  const runExample = (symbol: string) => () => void match(async () => [{ typed: symbol, genes: await api.search.exact(symbol) }]);
  const suggestTerm = (term: string) => () => {
    setText(term);
    setTermShown((count) => count + 1);
  };

  const { entrez: runnable, outside, outsideGenes } = splitByVersion(list, genes, version);

  const remove = (ids: readonly string[]) => setList((current) => current.remove(ids));
  const chooseVersion = (next: string) => {
    setVersion(next as DataVersion);
    setTissue('');
  };

  return (
    <div className={['home-search', `home-search-${surface}`, !onChooseAnalysis && 'home-search-single'].filter(Boolean).join(' ')}>
      <div className="home-search-row">
        {onChooseAnalysis && (
          <Select
            label="Analysis"
            hideLabel
            placeholder="Select an analysis"
            options={analysisOptions}
            columns={analysisColumns}
            {...(analysis && { value: analysis })}
            triggerIcon={analysis === 'networks' ? 'gene-network' : 'analysis'}
            size="large"
            footer={
              <p>
                Not sure which tool? <a href={linkHref(categoryCrumbs.variants.href)}>Compare them</a>
              </p>
            }
            onChange={(value) => (value === 'networks' ? setAnalysis(value) : onChooseAnalysis(value))}
          />
        )}
        <SearchField
          ref={searchInput}
          label="Search genes"
          placeholder={list.matches.length > 0 ? 'Add more genes, for example TNF' : 'Search a gene, for example IL1B'}
          value={text}
          loading={matching}
          onChange={(event) => setText(event.target.value)}
          onClear={() => setText('')}
          onKeyDown={runTyped}
          onPaste={pasteList}
          suggestions={typingOne ? (suggestions.data?.map((gene) => suggestionOf(gene, text)) ?? []) : []}
          suggestionsLoading={typingOne && (suggestions.isFetching || settled !== text)}
          suggestionsFailed={typingOne && suggestions.isError}
          onRetry={() => void suggestions.refetch()}
          {...(!typingOne && { open: false })}
          onSuggestionSelect={chooseSuggestion}
          note={`${onChooseAnalysis ? 'Choosing a gene switches the analysis to Networks. ' : ''}To search several genes, keep typing and separate them with spaces.`}
        />
      </div>
      <SearchExamples
        surface={surface}
        examples={[
          ...exampleGenes.map((symbol) => ({ label: symbol, onSelect: runExample(symbol) })),
          { label: exampleTerm, onSelect: suggestTerm(exampleTerm) },
          ...(onExampleSet ? [{ label: 'Autism gene set', onSelect: onExampleSet }] : []),
        ]}
      />
      {afterExamples}
      {failed && (
        <Alert tone="error" title="Genes couldn’t be matched right now">
          Humanbase didn’t answer. Try again in a moment; what you typed is still in the box.
        </Alert>
      )}
      {list.matches.length > 0 && (
        <section className="home-search-panel" aria-label="Selected genes">
          <div className="home-search-settings">
            <Select
              label="Tissue"
              placeholder={networks.isPending ? 'Loading tissues…' : 'Choose a tissue'}
              options={tissues.map((network) => ({ value: network.slug, label: network.name }))}
              value={tissue}
              searchable
              filterLabel="Filter tissues"
              disabled={networks.isPending}
              {...(networks.isError ? { error: 'Tissues couldn’t load. The global network will be used.' } : { hint: 'Leave empty to use the global network.' })}
              onChange={setTissue}
            />
            <Select label="Data version" options={versionOptions} value={version} hint="MAGE or GIANT." onChange={chooseVersion} />
            <Button disabled={runnable.length === 0} onClick={() => onShowNetwork(new NetworkQuery(runnable, tissue || undefined, version))}>
              Show network for {genesWord(runnable.length)}
            </Button>
          </div>
          <GeneMatchSummary list={list} level={2} />
          <OutsideVersionAlert outside={outsideGenes} version={version} runnable={runnable.length} onRemove={() => remove(outside.map((match) => match.id))} />
          <GeneMatchTable list={list} caption="How your genes matched" onRemove={remove} onChoose={(id, entrez) => setList((current) => current.choose(id, entrez))} />
        </section>
      )}
    </div>
  );
}
