import { ApiError, featureLabel, sequenceSpan, useDeepseaFeatures, useHumanbase, useInsilico, type DeepseaJob, type InsilicoResult } from '@humanbase/data';
import { ActionMenu, Alert, Button, ResultHeader, ResultLayout, saveFile, Select, Skeleton, SubstitutionMap, type ScaleSpec } from '@humanbase/ui';
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
// The result the Figma screens open on: HepG2 / CEBPB, the example's first variant.
const startFeature = 297;
const scale: ScaleSpec = { title: 'Log2 fold change', kind: 'diverging', edges: [-0.5, -0.25, -0.1, 0.1, 0.25, 0.5], words: ['Mutation lowers', 'Mutation raises'] };
const number = new Intl.NumberFormat('en-US');

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
  return (
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
  );
}
