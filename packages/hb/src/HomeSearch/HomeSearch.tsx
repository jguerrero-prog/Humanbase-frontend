import { dataVersionNames, GeneSearchService, IntegrationService, NetworkQuery, useGeneSuggestions, useHumanbase, useIntegrations, type DataVersion, type GeneHit, type TermMatches } from '@humanbase/data';
import {
  Alert,
  Button,
  GeneMatchList,
  GeneMatchSummary,
  GeneMatchTable,
  SearchExamples,
  SearchField,
  Select,
  useDebounced,
  type GeneMatch,
  type SearchSuggestion,
  useLinkHref,
} from '@humanbase/ui';
import { useMemo, useState, type ClipboardEvent, type KeyboardEvent, type ReactNode } from 'react';
import { analysisColumns, analysisOptions, categoryCrumbs } from '../content/product';
import { matchOf, suggestionOf } from './geneMatches';
import { genesWord, OutsideVersionAlert } from './OutsideVersionAlert';
import './HomeSearch.css';

export interface HomeSearchProps {
  onShowNetwork: (query: NetworkQuery) => void;
  onChooseAnalysis: (analysis: string) => void;
  onExampleSet: () => void;
  /** Shown under the example searches, above the selected genes. */
  afterExamples?: ReactNode;
}

const exampleGenes = ['IL1B', 'BRCA1', 'PTEN'];
const versionOptions = (Object.keys(dataVersionNames) as DataVersion[]).map((version) => ({ value: version, label: dataVersionNames[version] }));

export function HomeSearch({ onShowNetwork, onChooseAnalysis, onExampleSet, afterExamples }: HomeSearchProps) {
  const linkHref = useLinkHref();
  const api = useHumanbase();
  const [analysis, setAnalysis] = useState<string>();
  const [text, setText] = useState('');
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

  const add = (found: readonly TermMatches[]) => {
    const typedBefore = new Set(list.matches.flatMap((match) => match.typed.map((term) => term.toLowerCase())));
    const fresh = found.filter((term) => !typedBefore.has(term.typed.toLowerCase()));
    const next = new Map(genes);
    for (const term of fresh) for (const gene of term.genes) next.set(String(gene.entrez), gene);
    setGenes(next);
    setList(new GeneMatchList([...list.matches, ...fresh.map(matchOf)]));
    setAnalysis('networks');
  };

  const match = async (find: () => Promise<TermMatches[]>) => {
    setMatching(true);
    setFailed(false);
    try {
      add(await find());
      setText('');
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

  const geneOf = (match: GeneMatch) => {
    const candidate = list.gene(match);
    return candidate ? genes.get(candidate.entrez) : undefined;
  };
  const resolved = list.matches.filter((match) => match.status === 'matched' || match.status === 'alias' || (match.status === 'choose' && match.chosen));
  const outside = resolved.filter((match) => geneOf(match)?.isInVersion(version) === false);
  const runnable = resolved.filter((match) => !outside.includes(match)).flatMap((match) => list.gene(match)?.entrez ?? []).map(Number);


  const remove = (ids: readonly string[]) => setList(list.remove(ids));
  const chooseVersion = (next: string) => {
    setVersion(next as DataVersion);
    setTissue('');
  };

  return (
    <div className="home-search">
      <div className="home-search-row">
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
        <SearchField
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
          {...(!typingOne && { open: false })}
          onSuggestionSelect={chooseSuggestion}
          note="Choosing a gene switches the analysis to Networks. To search several genes, keep typing and separate them with spaces."
        />
      </div>
      <SearchExamples
        surface="brand"
        examples={[...exampleGenes.map((symbol) => ({ label: symbol, onSelect: runExample(symbol) })), { label: 'Autism gene set', onSelect: onExampleSet }]}
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
          <OutsideVersionAlert outside={outside.flatMap((match) => geneOf(match) ?? [])} version={version} runnable={runnable.length} onRemove={() => remove(outside.map((match) => match.id))} />
          <GeneMatchTable list={list} caption="How your genes matched" onRemove={remove} onChoose={(id, entrez) => setList(list.choose(id, entrez))} />
        </section>
      )}
    </div>
  );
}
