import { ApiError, featureLabel, sequenceSpan, useDeepseaFeatures, useHumanbase, useInsilico, type DeepseaJob, type InsilicoResult } from '@humanbase/data';
import { ActionMenu, Alert, Button, Cell, HeaderCell, ResultHeader, ResultLayout, saveFile, Select, Skeleton, SubstitutionMap, Table, type ScaleSpec } from '@humanbase/ui';
import { useMemo, useState, type ReactNode } from 'react';
import { jobDateTime } from '../Jobs/JobPage';
import { deepseaFormLink } from './DeepseaForm';
import './Deepsea.css';

export interface InsilicoResultViewProps {
  job: DeepseaJob;
  title: string;
  /** Copy link and Rename. */
  tools: ReactNode;
}

const windowSize = 91;
const binSize = 10;
const strongestShown = 10;
// The result the Figma screens open on: HepG2 / CEBPB, the example's first variant.
const startFeature = 297;
const scale: ScaleSpec = { title: 'Log2 fold change', kind: 'diverging', edges: [-0.5, -0.25, -0.1, 0.1, 0.25, 0.5], words: ['Mutation lowers', 'Mutation raises'] };
const number = new Intl.NumberFormat('en-US');
const fold = (value: number) => (value < 0 ? `−${Math.abs(value).toFixed(2)}` : value.toFixed(2));

function sequenceOption(name: string) {
  const span = sequenceSpan(name);
  return { value: name, label: span ? `${span.label}, ${span.chromosome}:${number.format(span.start)}-${number.format(span.end)}` : name };
}

/** A finished in silico mutagenesis job: every substitution of one sequence, for one chromatin feature. */
export function InsilicoResultView({ job, title, tools }: InsilicoResultViewProps) {
  const { showsSamples } = useHumanbase();
  const names = job.sequenceNames;
  const [sequence, setSequence] = useState(names[0]);
  const [featureIndex, setFeatureIndex] = useState(startFeature);
  const [start, setStart] = useState<number>();
  const features = useDeepseaFeatures('beluga');
  const result = useInsilico(job, sequence, featureIndex);
  const featureOptions = useMemo(() => (features.data?.model_features ?? []).map((feature) => ({ value: String(feature.idx), label: featureLabel(feature) })), [features.data]);
  const feature = featureOptions.find((option) => option.value === String(featureIndex))?.label ?? 'the chosen feature';
  const span = sequence ? sequenceSpan(sequence) : undefined;
  const files = job.resultFiles;

  const header = (
    <ResultHeader
      crumbs={[{ label: 'Jobs', href: '/jobs/' }, { label: job.model.tool, href: deepseaFormLink(job.model.id) }, { label: title }]}
      title={title}
      context={[
        { name: 'Model', value: job.model.kind },
        { name: 'Sequences', value: number.format(names.length) },
        { name: 'Length', value: result.data ? `${number.format(result.data.length)} bp` : '…' },
        { name: 'Submitted', value: jobDateTime.format(job.created) },
      ]}
      settingsLabel="Job actions"
      settings={
        <>
          {tools}
          {files.length > 0 && <ActionMenu label="Download results" trigger="text" items={files.map((file) => ({ label: file.name, description: file.format, icon: 'download', onSelect: () => window.open(file.url, '_blank', 'noopener') }))} />}
        </>
      }
    />
  );

  const choose = (next: { sequence?: string; feature?: number }) => {
    if (next.sequence !== undefined) setSequence(next.sequence);
    if (next.feature !== undefined) setFeatureIndex(next.feature);
    setStart(undefined);
  };

  const controls = (
    <div className="insilico-controls">
      <Select
        label={`Sequence (${names.indexOf(sequence ?? '') + 1} of ${names.length})`}
        size="small"
        options={names.map(sequenceOption)}
        value={sequence ?? ''}
        onChange={(value) => choose({ sequence: value })}
      />
      <Select
        label={`Chromatin feature (${number.format(featureOptions.findIndex((option) => option.value === String(featureIndex)) + 1)} of ${number.format(featureOptions.length)})`}
        size="small"
        searchable
        filterLabel="Filter features"
        options={featureOptions}
        value={String(featureIndex)}
        disabled={!featureOptions.length}
        onChange={(value) => choose({ feature: Number(value) })}
      />
      <Button variant="secondary" size="small" icon="download" disabled={!result.data} onClick={() => result.data && saveFile(result.data.csv(), `${sequence ?? 'sequence'}_${feature.replace(/\W+/g, '_')}.csv`, 'text/csv')}>
        Download CSV
      </Button>
    </div>
  );

  let body: ReactNode;
  if (result.isError) {
    const missing = result.error instanceof ApiError && result.error.isNotFound && showsSamples;
    body = missing ? (
      <Alert tone="info" title="The sample data doesn’t include this choice">
        With the API off, results show HepG2 / CEBPB for the first two sequences. Choose one of those, or turn the API on.
      </Alert>
    ) : (
      <Alert tone="error" title="This result couldn’t load" action={{ label: 'Try again', onSelect: () => void result.refetch() }}>
        Humanbase didn’t answer. The job’s results are kept, so trying again is safe.
      </Alert>
    );
  } else if (!result.data) {
    body = <Skeleton width="100%" height="320px" />;
  } else {
    body = <InsilicoMap key={`${sequence}-${featureIndex}`} result={result.data} feature={feature} span={span} start={start} onStart={setStart} />;
  }

  return (
    <div className="deepsea-result">
      <ResultLayout
        header={header}
        mainLabel={`Effect of every substitution on ${feature}`}
        main={
          <div className="insilico-result" aria-busy={result.isFetching || undefined}>
            <h2 className="insilico-title">Effect of every substitution on {feature}</h2>
            {controls}
            {body}
          </div>
        }
      />
    </div>
  );
}

interface InsilicoMapProps {
  result: InsilicoResult;
  feature: string;
  span: ReturnType<typeof sequenceSpan>;
  start: number | undefined;
  onStart: (start: number) => void;
}

function InsilicoMap({ result, feature, span, start, onStart }: InsilicoMapProps) {
  // Opens on the strongest position for the chosen feature, with the window centered on it.
  const strongest = useMemo(() => result.strongest(1)[0]?.position ?? Math.floor(result.length / 2), [result]);
  const [selected, setSelected] = useState(strongest);
  const last = Math.max(0, result.length - windowSize);
  const from = Math.min(last, Math.max(0, start ?? strongest - Math.floor(windowSize / 2)));
  const overview = useMemo(() => result.strongestPer(binSize).map((item) => Math.abs(item.value)), [result]);
  const top = useMemo(() => result.strongestPositions(strongestShown), [result]);
  const [shown, setShown] = useState<number>();
  const genome = (position: number) => (span ? `${span.chromosome}:${number.format(span.start + position)}` : undefined);
  const show = (position: number) => {
    onStart(position - Math.floor(windowSize / 2));
    setSelected(position);
    setShown(position);
  };
  return (
    <>
      <SubstitutionMap
        length={result.length}
        start={from}
        windowSize={windowSize}
        onStart={onStart}
        columns={result.columns(from, windowSize)}
        overview={overview}
        selected={selected}
        onSelect={setSelected}
        scale={scale}
        {...(span && { genome: { chromosome: span.chromosome, start: span.start } })}
        note={`Log2 fold change for ${feature}. Negative: the mutation lowers the predicted signal.`}
      />
      <Table caption={`Strongest changes to ${feature}`} showCaption density="compact">
        <thead>
          <tr>
            <HeaderCell>Position</HeaderCell>
            {span && <HeaderCell>Genome position</HeaderCell>}
            <HeaderCell>Strongest change</HeaderCell>
            <HeaderCell align="end">Log2 fold change</HeaderCell>
            <HeaderCell>
              <span className="visually-hidden">Show in the map</span>
            </HeaderCell>
          </tr>
        </thead>
        <tbody>
          {top.map((item) => (
            <tr key={item.position}>
              <Cell rowHeader type="id">{number.format(item.position)}</Cell>
              {span && <Cell type="id">{genome(item.position)}</Cell>}
              <Cell type="id">{`${item.ref}>${item.alt}`}</Cell>
              <Cell type="number">{fold(item.value)}</Cell>
              <Cell>
                <Button variant="ghost" size="small" onClick={() => show(item.position)} aria-label={`Show position ${number.format(item.position)} in the map`}>
                  Show
                </Button>
              </Cell>
            </tr>
          ))}
        </tbody>
      </Table>
      <p className="visually-hidden" role="status">
        {shown !== undefined && `Showing position ${number.format(shown)} in the map.`}
      </p>
    </>
  );
}
