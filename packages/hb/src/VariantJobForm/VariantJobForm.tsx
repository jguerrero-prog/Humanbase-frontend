import { VariantFileCheck, type FileCheckResult, type InputKind, type VariantModel } from '@humanbase/data';
import { Accordion, AccordionItem, Button, Field, FileDrop, SegmentedControl, saveFile, Select, TextInput, type ChosenFile } from '@humanbase/ui';
import { useId, useMemo, useState } from 'react';
import './VariantJobForm.css';

type Source = 'upload' | 'paste' | 'example';

export interface VariantJobFormProps {
  model: VariantModel;
  examples: Partial<Record<InputKind, string>>;
  onRun?: (job: { model: VariantModel; kind: InputKind; text: string; title: string; email: string }) => void;
}

const models = [
  { value: 'sei', label: 'Sei (DNA)' },
  { value: 'beluga', label: 'Beluga (DNA)' },
  { value: 'seqweaver', label: 'Seqweaver (RNA)' },
];
const toolNames: Record<VariantModel, string> = { sei: 'Sei', beluga: 'Beluga', seqweaver: 'Seqweaver' };
const extensions: Record<InputKind, string> = { vcf: '.vcf,.txt', bed: '.bed,.txt', fasta: '.fasta,.fa,.txt' };
const nouns: Record<InputKind, string> = { vcf: 'variants', bed: 'regions', fasta: 'sequences' };

function rulesFor(kind: InputKind, model: VariantModel): string {
  if (kind === 'fasta') return `Each sequence starts with >. Only A, C, G and T, ${VariantFileCheck.sequenceLength[model].toLocaleString('en-US')} bp each for ${toolNames[model]}.`;
  if (kind === 'bed') return 'Tab-separated: chromosome, start, end. Each interval is scored at its center.';
  return `Tab-separated: chromosome, position, ID, REF, ALT${model === 'seqweaver' ? ', then strand (+ or -)' : ''}. A header line is optional.`;
}

function downloadProblems(result: FileCheckResult) {
  const text = ['line\tproblem', ...result.problems.map(({ line, rule }) => `${line}\t${rule}`)].join('\n');
  saveFile(text, 'problems.tsv', 'text/tab-separated-values');
}

export function VariantJobForm({ model: initialModel, examples, onRun }: VariantJobFormProps) {
  const id = useId();
  const [model, setModel] = useState(initialModel);
  const [kind, setKind] = useState<InputKind>('vcf');
  const [source, setSource] = useState<Source>('upload');
  const [file, setFile] = useState<ChosenFile>();
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const tool = toolNames[model];
  const result = useMemo(() => (text.trim() ? new VariantFileCheck(kind, model).check(text) : undefined), [text, kind, model]);
  const blocking = result?.limit ?? result?.otherKind;
  const ready = Boolean(result && result.count > 0 && !result.problems.length && !blocking);
  const runLabel = ready && result ? `Run ${tool} on ${result.count.toLocaleString('en-US')} ${nouns[kind]}` : `Run ${tool}`;

  const choose = async (chosen: File) => {
    setFile({ name: chosen.name, size: chosen.size });
    setText(await chosen.text());
  };
  const start = (nextKind: InputKind, nextSource: Source) => {
    const example = examples[nextKind] ?? '';
    setKind(nextKind);
    setSource(nextSource);
    setFile(nextSource === 'example' ? { name: `example.${nextKind}`, size: example.length } : undefined);
    setText(nextSource === 'example' ? example : '');
  };
  const run = () => {
    if (!ready) return;
    if (onRun) onRun({ model, kind, text, title, email });
    else setNote(`${tool} would start on ${result?.count.toLocaleString('en-US')} ${nouns[kind]}. This example doesn’t send a job.`);
  };

  return (
    <form className="job-form" onSubmit={(event) => { event.preventDefault(); run(); }}>
      <div className="job-form-row">
        <Select label="Model" options={models} value={model} onChange={(value) => setModel(value as VariantModel)} hint="Sei and Beluga predict DNA effects." />
        <Select label="Genome assembly" options={[{ value: 'hg19', label: 'GRCh37/hg19' }]} defaultValue="hg19" hint="Coordinates in the file must match." />
      </div>
      <SegmentedControl
        label="What are you submitting?"
        value={kind}
        onChange={(value) => start(value as InputKind, source === 'example' ? 'example' : 'upload')}
        segments={[{ value: 'vcf', label: 'Variants (VCF)' }, { value: 'bed', label: 'Regions (BED)' }, { value: 'fasta', label: 'Sequences (FASTA)' }]}
      />
      <SegmentedControl
        label="Add the file"
        value={source}
        onChange={(value) => start(kind, value as Source)}
        segments={[{ value: 'upload', label: 'Upload a file' }, { value: 'paste', label: 'Paste' }, { value: 'example', label: 'Use the example' }]}
      />
      {source === 'paste' ? (
        <Field label={`Paste ${nouns[kind]}`} hint={result ? (result.problems.length ? `${result.problems.length} lines need fixing` : result.summary) : undefined}>
          {(control) => <textarea {...control} className="field-control job-form-paste" value={text} spellCheck={false} onChange={(event) => setText(event.target.value)} />}
        </Field>
      ) : (
        <FileDrop
          label={`${kind.toUpperCase()} file`}
          hideLabel
          accept={extensions[kind]}
          prompt={`Drop a ${kind.toUpperCase()} file here, or`}
          hint="Up to 20,000 variants; 10,000 or fewer finish fastest."
          file={file}
          result={result ? `${result.summary}, ready to run` : undefined}
          problems={result?.problems}
          problemSummary={`${result?.problems.length ?? 0} lines need fixing before this file can run`}
          onFile={choose}
          onRemove={() => start(kind, 'upload')}
          onDownloadProblems={() => result && downloadProblems(result)}
        />
      )}
      {blocking && <p className="job-form-blocking" role="alert">{blocking}</p>}
      <Accordion size="compact">
        <AccordionItem title={`${kind.toUpperCase()} rules for ${tool}`}>
          <p>{rulesFor(kind, model)}</p>
        </AccordionItem>
      </Accordion>
      <TextInput label="Job title (optional)" placeholder="Untitled" hint="Shown on the job page and in this browser’s job list." value={title} onChange={(event) => setTitle(event.target.value)} />
      <TextInput label="Email (optional)" type="email" placeholder="name@institution.edu" hint="We’ll send a link when it finishes. The job is saved in this browser either way." value={email} onChange={(event) => setEmail(event.target.value)} />
      <div className="job-form-actions">
        <Button type="submit" aria-disabled={!ready || undefined} aria-describedby={`${id}-help`}>
          {runLabel}
        </Button>
        <p id={`${id}-help`} className="job-form-help" role="status">
          {note || (ready ? 'Starts a job; you can leave this page.' : `Add a file to run ${tool}.`)}
        </p>
      </div>
    </form>
  );
}
