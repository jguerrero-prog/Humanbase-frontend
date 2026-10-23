import { deepseaModels, genomeLabels, variantModels, VariantFileCheck, type FileCheckResult, type Genome, type InputKind, type VariantModel } from '@humanbase/data';
import { Accordion, AccordionItem, Button, Field, FileDrop, SegmentedControl, saveFile, Select, TextInput, type ChosenFile } from '@humanbase/ui';
import { useId, useMemo, useState, type ReactNode } from 'react';
import '../Jobs/JobForm.css';
import './VariantJobForm.css';

type Source = 'upload' | 'paste' | 'example';

export interface VariantJob {
  model: VariantModel;
  kind: InputKind;
  text: string;
  fileName: string;
  /** True when the text came from an uploaded file, not pasted or the example. */
  uploaded: boolean;
  genome: Genome;
  count: number;
  title: string;
  email: string;
}

export interface VariantJobFormProps {
  model: VariantModel;
  /** Choosing another model calls this instead of switching in place, such as to open that tool's page. */
  onModelChange?: ((model: VariantModel) => void) | undefined;
  examples: Record<Genome, Partial<Record<InputKind, string>>>;
  onRun?: ((job: VariantJob) => void | Promise<void>) | undefined;
  /** True while the job is being started. */
  running?: boolean | undefined;
  /** Shown above the form, such as why a job couldn’t start. */
  notice?: ReactNode;
  /** Replaces the Model field, such as with Expression effects' ExPecto or ExPecto SC choice. */
  modelField?: ReactNode;
  /** One line under the model saying what can be scored, from the model's config. */
  scoreable?: string | undefined;
}

const models = variantModels.map((value) => ({ value, label: deepseaModels[value].option }));
// ExPecto runs on Beluga, so its Model field names Beluga and offers nothing else.
const modelOptions = (model: VariantModel) => (deepseaModels[model].basedOn ? [{ value: model, label: deepseaModels[model].option }] : models);
const extensions: Record<InputKind, string> = { vcf: '.vcf,.txt', bed: '.bed,.txt', fasta: '.fasta,.fa,.txt' };
const nouns: Record<InputKind, string> = { vcf: 'variants', bed: 'regions', fasta: 'sequences' };

const bp = (model: VariantModel) => VariantFileCheck.sequenceLength[model].toLocaleString('en-US');
// The model that reads the sequences: Beluga for in silico mutagenesis and ExPecto.
const engineOf = (model: VariantModel) => deepseaModels[deepseaModels[model].basedOn ?? model].tool;

function rulesFor(kind: InputKind, model: VariantModel): string {
  if (kind === 'fasta') return `Each sequence starts with >. Only A, C, G and T, ${bp(model)} bp each for ${engineOf(model)}.`;
  if (kind === 'bed') return 'Tab-separated: chromosome, start, end. Each interval is scored at its center.';
  if (deepseaModels[model].strand) return 'Tab-separated: chromosome, position, ID, REF, ALT, then strand (+ or -). A header line is optional.';
  return 'Tab-separated, at least 5 columns: chromosome, position, ID, reference and alternative allele.';
}

function downloadProblems(result: FileCheckResult) {
  const text = ['line\tproblem', ...result.problems.map(({ line, rule }) => `${line}\t${rule}`)].join('\n');
  saveFile(text, 'problems.tsv', 'text/tab-separated-values');
}

export function VariantJobForm({ model: initialModel, onModelChange, examples, onRun, running, notice, modelField, scoreable }: VariantJobFormProps) {
  const id = useId();
  const [model, setModel] = useState(initialModel);
  const [kind, setKind] = useState<InputKind>(deepseaModels[initialModel].inputs[0] ?? 'vcf');
  const [genome, setGenome] = useState<Genome>(deepseaModels[initialModel].genomes[0] ?? 'hg19');
  const [source, setSource] = useState<Source>('upload');
  const [file, setFile] = useState<ChosenFile>();
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const tool = deepseaModels[model].tool;
  const named = deepseaModels[model].inSentence ?? tool;
  const result = useMemo(() => (text.trim() ? new VariantFileCheck(kind, model).check(text) : undefined), [text, kind, model]);
  const blocking = result?.limit ?? result?.otherKind;
  const ready = Boolean(result && result.count > 0 && !result.problems.length && !blocking);
  const runLabel = ready && result ? `Run ${named} on ${result.count.toLocaleString('en-US')} ${nouns[kind]}` : `Run ${named}`;

  const sources = [
    { value: 'upload', label: 'Upload a file' },
    { value: 'paste', label: 'Paste' },
    ...(examples[genome][kind] ? [{ value: 'example', label: 'Use the example' }] : []),
  ];
  const chooseModel = (next: VariantModel) => (onModelChange ? onModelChange(next) : setModel(next));
  const choose = async (chosen: File) => {
    setFile({ name: chosen.name, size: chosen.size });
    setText(await chosen.text());
  };
  const start = (nextKind: InputKind, nextSource: Source, nextGenome = genome) => {
    const example = examples[nextGenome][nextKind] ?? '';
    setKind(nextKind);
    setSource(nextSource);
    setFile(nextSource === 'example' ? { name: `example.${nextKind}`, size: example.length } : undefined);
    setText(nextSource === 'example' ? example : '');
  };
  const run = () => {
    if (!ready) return;
    if (onRun) void onRun({ model, kind, text, fileName: file?.name ?? `pasted.${kind}`, uploaded: source === 'upload', genome, count: result?.count ?? 0, title, email });
    else setNote(`${named} would start on ${result?.count.toLocaleString('en-US')} ${nouns[kind]}. This example doesn’t send a job.`);
  };

  return (
    <form className="job-form" onSubmit={(event) => { event.preventDefault(); run(); }}>
      {notice}
      <div className="job-form-row">
        {modelField ?? <Select label="Model" options={modelOptions(model)} value={model} onChange={(value) => chooseModel(value as VariantModel)} hint={deepseaModels[model].otherModels} />}
        {kind !== 'fasta' && (
          <Select
            label="Genome assembly"
            options={deepseaModels[model].genomes.map((value) => ({ value, label: genomeLabels[value] }))}
            value={genome}
            onChange={(value) => {
              setGenome(value as Genome);
              if (source === 'example') start(kind, examples[value as Genome][kind] ? 'example' : 'upload', value as Genome);
            }}
            hint="Coordinates in the file must match."
          />
        )}
      </div>
      {scoreable && <p className="job-form-help">{scoreable}</p>}
      {deepseaModels[model].inputs.length > 1 && (
        <SegmentedControl
          label="What are you submitting?"
          value={kind}
          onChange={(value) => start(value as InputKind, source === 'example' && examples[genome][value as InputKind] ? 'example' : 'upload')}
          segments={[{ value: 'vcf', label: 'Variants (VCF)' }, { value: 'bed', label: 'Regions (BED)' }, { value: 'fasta', label: 'Sequences (FASTA)' }].filter((segment) => deepseaModels[model].inputs.includes(segment.value as InputKind))}
        />
      )}
      <SegmentedControl
        label="Add the file"
        value={source}
        onChange={(value) => start(kind, value as Source)}
        segments={sources}
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
          hint={kind === 'fasta' ? `Sequences of ${bp(model)} bp each, for ${engineOf(model)}.` : 'Up to 20,000 variants; 10,000 or fewer finish fastest.'}
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
        <AccordionItem title={`${kind.toUpperCase()} rules for ${named}`}>
          <p>{rulesFor(kind, model)}</p>
        </AccordionItem>
      </Accordion>
      <TextInput label="Job title (optional)" placeholder="Untitled" hint="Shown on the job page and in this browser’s job list." value={title} onChange={(event) => setTitle(event.target.value)} />
      <TextInput label="Email (optional)" type="email" placeholder="name@institution.edu" hint="We’ll send a link when it finishes. The job is saved in this browser either way." value={email} onChange={(event) => setEmail(event.target.value)} />
      <div className="job-form-actions">
        <Button type="submit" loading={running ?? false} aria-disabled={!ready || undefined} aria-describedby={`${id}-help`}>
          {runLabel}
        </Button>
        <p id={`${id}-help`} className="job-form-help" role="status">
          {note || (ready ? 'Starts a job; you can leave this page.' : `Add a file to run ${tool}.`)}
        </p>
      </div>
    </form>
  );
}
