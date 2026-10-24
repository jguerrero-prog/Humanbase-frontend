import { ApiError, deepseaExamples, deepseaModels, JobHistory, useHumanbase, VariantFileCheck, type DeepseaModel, type InputKind, type VariantModel } from '@humanbase/data';
import { AboutPanel, Alert, DocsLink, saveFile, type Crumb } from '@humanbase/ui';
import { useState } from 'react';
import { categoryCrumbs } from '../content/product';
import { expressionEffectsLink } from '../Expecto/geneExpressionTools';
import '../Jobs/JobForm.css';
import { VariantJobForm, type VariantJob, type VariantJobFormProps } from '../VariantJobForm/VariantJobForm';

export interface DeepseaFormProps {
  model: VariantModel;
  /** Called when the Model field changes, such as to put the model in the URL. */
  onModelChange?: (model: string) => void;
  /** The models the Model field offers; without it, only this form's model. */
  models?: VariantJobFormProps['models'];
  /** The inputs the form offers, when not every one the model takes. */
  inputs?: readonly InputKind[] | undefined;
  /** Opens the new job's page. */
  onStarted: (link: string) => void;
}

type Failure = 'busy' | 'off' | 'refused' | 'failed';

const number = new Intl.NumberFormat('en-US');

const formLinks: Record<VariantModel, string> = {
  sei: '/variant-effects/',
  beluga: '/variant-effects/?model=beluga',
  insilico: '/variant-effects/?tab=region-scan',
  seqweaver: '/seqweaver/',
  expecto: expressionEffectsLink({ tab: 'submit-variants' }),
};

/** Where a model's job form is: Sei, Beluga and region scan share Variant effects, ExPecto's sits on Expression effects' Submit variants tab. */
export function deepseaFormLink(model: VariantModel): string {
  return formLinks[model];
}

/** A job page's breadcrumbs: Variants & sequences, the model's form, then the job's title. */
export function deepseaJobCrumbs(model: DeepseaModel, title: string): Crumb[] {
  return [categoryCrumbs.variants, { label: model.tool, href: deepseaFormLink(model.id) }, { label: title }];
}

export function deepseaJobLink(id: string): string {
  return `/deepsea/jobs/${id}/`;
}

/** The Sei, Beluga or Seqweaver form: checks the file in the browser, starts the job and keeps it in this browser's job list. */
export function DeepseaForm({ model, onModelChange, models, inputs, onStarted }: DeepseaFormProps) {
  const api = useHumanbase();
  const [running, setRunning] = useState(false);
  const [failure, setFailure] = useState<Failure>();
  const info = deepseaModels[model];
  const examples = deepseaExamples[model];

  const run = async (job: VariantJob) => {
    setFailure(undefined);
    setRunning(true);
    try {
      const started = await api.deepsea.submit(job);
      const link = deepseaJobLink(started.id);
      const detail = `${info.tool}, ${number.format(job.count)} ${job.kind === 'fasta' ? 'sequences' : job.kind === 'bed' ? 'regions' : 'variants'}`;
      new JobHistory().add({ id: started.id, tool: info.tool, status: started.status, startedAt: started.created.toISOString(), link, title: job.title.trim() || undefined, detail });
      onStarted(link);
    } catch (error) {
      if (error instanceof ApiError && error.status === 429) setFailure('busy');
      else if (api.showsSamples) setFailure('off');
      else if (error instanceof ApiError && error.status === 400) setFailure('refused');
      else setFailure('failed');
      setRunning(false);
    }
  };

  const notice = failure && (
    <Alert tone={failure === 'off' ? 'info' : failure === 'busy' || failure === 'refused' ? 'warning' : 'error'} title={titles[failure](info.tool)} dismissible onDismiss={() => setFailure(undefined)}>
      {texts[failure]}
    </Alert>
  );

  return (
    <div className="job-columns">
      <VariantJobForm key={model} model={model} onModelChange={onModelChange} models={models} inputs={inputs} examples={examples} onRun={run} running={running} notice={notice} />
      <DeepseaAbout model={model} />
    </div>
  );
}

/** The About panel for a sequence model: what it does, its documentation and its example files. */
export function DeepseaAbout({ model }: { model: VariantModel }) {
  const info = deepseaModels[model];
  return (
    <AboutPanel
      tool={info.inSentence ?? info.tool}
      docsHref={info.docsName ? undefined : info.docsHref}
      links={info.docsName && <DocsLink href={info.docsHref}>Read the {info.docsName} documentation</DocsLink>}
      examples={Object.entries(deepseaExamples[model].hg19).map(([kind, text]) => ({
        name: `example.${kind}`,
        detail: exampleDetail(kind as InputKind, model),
        onDownload: () => saveFile(text, `example.${kind}`, 'text/plain'),
      }))}
    >
      {info.about}
    </AboutPanel>
  );
}

function exampleDetail(kind: InputKind, model: VariantModel): string {
  const info = deepseaModels[model];
  if (kind === 'fasta') return `Sequences, ${VariantFileCheck.sequenceLength[model].toLocaleString('en-US')} bp for ${deepseaModels[info.basedOn ?? model].tool}`;
  const noun = kind === 'bed' ? 'Regions' : 'Variants';
  return info.strand ? `${noun} with strand, GRCh37/hg19` : `${noun}, GRCh37/hg19`;
}

const titles: Record<Failure, (tool: string) => string> = {
  busy: (tool) => `You already have jobs queued or running for ${tool}`,
  off: () => 'Jobs can’t start while the API is off',
  refused: (tool) => `${tool} didn’t accept this file`,
  failed: (tool) => `${tool} couldn’t start`,
};

const texts: Record<Failure, string> = {
  busy: 'Humanbase limits how many jobs run at once from one network. Wait for one to finish in your Jobs menu, then run this again; your file and settings are kept.',
  off: 'This copy of Humanbase shows sample data. Use the example file to see a sample job.',
  refused: 'Humanbase checked the file and turned it down. Check it against the rules below and run it again; your settings are kept.',
  failed: 'Humanbase didn’t answer. Your file and settings are kept, so try again in a moment.',
};
