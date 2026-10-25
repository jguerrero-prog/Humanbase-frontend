import { dataVersionNames, IntegrationService, JobHistory, moduleExamples, ModuleService, NetworkQuery, useGeneListMatches, useHumanbase, useIntegrations, type DataVersion, type ModuleExample } from '@humanbase/data';
import {
  Alert,
  Button,
  GeneList,
  GeneMatchList,
  GeneMatchSummary,
  GeneMatchTable,
  parseGeneList,
  SearchExamples,
  Select,
  Spinner,
  TextInput,
  useDebounced,
  useLinkHref,
} from '@humanbase/ui';
import { useMemo, useState, type ReactNode } from 'react';
import { analysisColumns, analysisOptions, categoryCrumbs } from '../content/product';
import { hitsOf, matchOf, splitByVersion } from '../HomeSearch/geneMatches';
import { OutsideVersionAlert } from '../HomeSearch/OutsideVersionAlert';
import { notifications } from '../Notifications/Notifications';
import type { ModuleDraft } from '../Modules/ModuleExplorer';
import '../HomeSearch/HomeSearch.css';
import './ModuleSearch.css';

export interface ModuleSearchProps {
  onChooseAnalysis: (analysis: string) => void;
  /** Called with the result's link once the job has started. */
  onStarted: (link: string) => void;
  /** An example to load straight away, by its id. */
  example?: string | undefined;
  /** A result's list and settings, from its Edit genes. */
  draft?: ModuleDraft | undefined;
  afterExamples?: ReactNode;
}

const versionOptions = (Object.keys(dataVersionNames) as DataVersion[]).map((version) => ({ value: version, label: dataVersionNames[version] }));
const genesWord = (count: number) => (count === 1 ? '1 gene' : `${count.toLocaleString('en-US')} genes`);
const rangeHint = `Enter ${ModuleService.minimumGenes} to ${ModuleService.maximumGenes.toLocaleString('en-US')} genes.`;

export function ModuleSearch({ onChooseAnalysis, onStarted, example, draft, afterExamples }: ModuleSearchProps) {
  const linkHref = useLinkHref();
  const api = useHumanbase();
  const preset = moduleExamples.find((item) => item.id === example);
  const [text, setText] = useState(preset ? preset.genes.join('\n') : (draft?.entrez.join('\n') ?? ''));
  // What was typed or pasted; removing genes from the table edits the text without matching it again.
  const [typed, setTyped] = useState(text);
  const [removed, setRemoved] = useState<readonly string[]>([]);
  const [chosen, setChosen] = useState<ReadonlyMap<string, string>>(new Map());
  const [title, setTitle] = useState(preset?.title ?? draft?.title ?? '');
  const [version, setVersion] = useState<DataVersion>(draft?.version ?? NetworkQuery.defaultVersion);
  const [tissue, setTissue] = useState(preset?.tissue[version] ?? draft?.tissue ?? '');
  const [fromExample, setFromExample] = useState(Boolean(preset));
  const [exampleTitle, setExampleTitle] = useState(preset?.title);
  const [submitting, setSubmitting] = useState(false);
  const [failed, setFailed] = useState(false);

  const settled = useDebounced(typed);
  const terms = useMemo(() => parseGeneList(settled), [settled]);
  const matches = useGeneListMatches(terms);
  const networks = useIntegrations();
  const tissues = useMemo(() => (networks.data ? IntegrationService.pick(networks.data, 'tissue', version) : []), [networks.data, version]);

  const list = useMemo(() => {
    let next = new GeneMatchList((matches.data ?? []).map(matchOf)).remove(removed);
    for (const [id, entrez] of chosen) next = next.choose(id, entrez);
    return next;
  }, [matches.data, removed, chosen]);
  const hits = useMemo(() => hitsOf(matches.data ?? []), [matches.data]);
  // Terms to check run as their chosen gene, the first one until another is picked.
  const { entrez, outside, outsideGenes } = splitByVersion(list, list.matches.filter((match) => match.status !== 'not-found'), hits, version);
  const inRange = entrez.length >= ModuleService.minimumGenes && entrez.length <= ModuleService.maximumGenes;

  const type = (next: string) => {
    setText(next);
    setTyped(next);
    setRemoved([]);
    setChosen(new Map());
    setFromExample(false);
  };

  const load = (item: ModuleExample) => {
    type(item.genes.join('\n'));
    setTitle(item.title);
    setExampleTitle(item.title);
    setTissue(item.tissue[version]);
    setFromExample(true);
  };

  const remove = (ids: string[]) => {
    const gone = new Set(list.matches.filter((match) => ids.includes(match.id)).flatMap((match) => match.typed.map((term) => term.toLowerCase())));
    setRemoved([...removed, ...ids]);
    setText(parseGeneList(text).filter((term) => !gone.has(term.toLowerCase())).join('\n'));
    notifications.show({ tone: 'success', message: `${genesWord(ids.length)} removed from the list` });
  };

  const chooseVersion = (next: string) => {
    setVersion(next as DataVersion);
    setTissue('');
    setFromExample(false);
  };

  const start = async () => {
    setSubmitting(true);
    setFailed(false);
    try {
      // The live site sends its examples without a title, so the cached result comes back instead of a new job.
      const requestTitle = fromExample && title === exampleTitle ? '' : title;
      const { bodyTag } = await api.modules.submit({ entrez, integration: tissue, version, title: requestTitle });
      const link = `/modules/?body_tag=${bodyTag}`;
      const network = tissues.find((item) => item.slug === tissue)?.name ?? tissue;
      new JobHistory().add({ id: bodyTag, tool: 'Modules', status: 'running', startedAt: new Date().toISOString(), link, title: title.trim() || undefined, detail: `Modules, ${network}` });
      onStarted(link);
    } catch {
      setFailed(true);
      setSubmitting(false);
    }
  };

  const checking = terms.length > 0 && matches.isFetching;

  return (
    <div className="home-search">
      <div className="home-search-row module-search-row">
        <Select
          label="Analysis"
          hideLabel
          options={analysisOptions}
          columns={analysisColumns}
          value="modules"
          triggerIcon="module"
          size="large"
          footer={
            <p>
              Not sure which tool? <a href={linkHref(categoryCrumbs.variants.href)}>Compare them</a>
            </p>
          }
          onChange={(value) => value !== 'modules' && onChooseAnalysis(value)}
        />
        <GeneList
          label="Gene list"
          className="module-search-list"
          placeholder="Paste gene symbols or Entrez IDs, one per line or separated by commas"
          hint={rangeHint}
          value={text}
          rows={5}
          onChange={(event) => type(event.target.value)}
        />
      </div>
      <SearchExamples surface="brand" examples={moduleExamples.map((item) => ({ label: item.label, onSelect: () => load(item) }))} />
      {afterExamples}
      {checking && (
        <section className="home-search-panel module-search-checking" aria-label="Checking genes">
          <p role="status">
            <Spinner size={16} /> Checking {genesWord(terms.length)}…
          </p>
        </section>
      )}
      {matches.isError && (
        <Alert tone="error" title="Genes couldn’t be matched right now">
          Humanbase didn’t answer. Try again in a moment; your list is still in the box.
        </Alert>
      )}
      {!checking && list.matches.length > 0 && (
        <section className="home-search-panel" aria-label="Your gene list">
          <div className="home-search-settings module-search-settings">
            <TextInput label="Title" value={title} hint="Shown on the result and in your job list." onChange={(event) => setTitle(event.target.value)} />
            <Select
              label="Tissue"
              placeholder={networks.isPending ? 'Loading tissues…' : 'Choose a tissue'}
              options={tissues.map((network) => ({ value: network.slug, label: network.name }))}
              value={tissue}
              searchable
              filterLabel="Filter tissues"
              disabled={networks.isPending}
              hint={fromExample ? 'Chosen by the example. Pick the tissue closest to your study.' : 'Pick the tissue closest to your study.'}
              onChange={(next) => {
                setTissue(next);
                setFromExample(false);
              }}
            />
            <Select label="Data version" options={versionOptions} value={version} hint="MAGE or GIANT." onChange={chooseVersion} />
            <Button disabled={!tissue || !inRange} loading={submitting} onClick={() => void start()}>
              Find modules in {genesWord(entrez.length)}
            </Button>
          </div>
          {!inRange && (
            <p className="module-search-range">
              Module detection needs {ModuleService.minimumGenes} to {ModuleService.maximumGenes.toLocaleString('en-US')} genes. This list has {genesWord(entrez.length)}.
            </p>
          )}
          {failed && (
            <Alert tone="error" title="Module detection couldn’t start">
              Humanbase didn’t answer. Try again in a moment; your list and settings are kept.
            </Alert>
          )}
          <GeneMatchSummary list={list} title={`How your ${genesWord(list.matches.length)} matched`} level={2} />
          <OutsideVersionAlert outside={outsideGenes} version={version} runnable={entrez.length} onRemove={() => remove(outside.map((match) => match.id))} />
          <GeneMatchTable
            list={list}
            caption={`How your ${genesWord(list.matches.length)} matched`}
            selectable
            foldMatched
            onRemove={remove}
            onChoose={(id, gene) => setChosen(new Map(chosen).set(id, gene))}
          />
        </section>
      )}
    </div>
  );
}
