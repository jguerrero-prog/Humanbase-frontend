import { ApiError, type DataVersion, dataVersionNames, type GwasCheckResult, GwasFileCheck, IntegrationService, JobHistory, type Mhc, type NetwasExample, NetwasService, NetworkQuery, SampleMissingError, useHumanbase, useIntegrations } from '@humanbase/data';
import { AboutPanel, Accordion, AccordionItem, Alert, Button, ErrorSummary, FileDrop, saveFile, SegmentedControl, Select, TextInput, type ChosenFile, type ErrorSummaryItem } from '@humanbase/ui';
import { useId, useMemo, useState, type FormEvent } from 'react';
import '../Jobs/JobForm.css';
import './Netwas.css';

/** The settings a failed job hands back to the form, so only the file has to be added again. */
export interface NetwasDraft {
  version: DataVersion;
  tissue: string;
  pValue?: number | null | undefined;
  mhc?: string | null | undefined;
  title?: string | undefined;
  email?: string | undefined;
}

export interface NetwasFormProps {
  draft?: NetwasDraft | undefined;
  docsHref: string;
  /** Called with the job page's link once the job is saved in this browser. */
  onStarted: (link: string) => void;
}

type Source = 'upload' | 'example';

interface GwasFile extends ChosenFile {
  text: string;
  bytes: File;
}

const versionOptions = (Object.keys(dataVersionNames) as DataVersion[]).map((version) => ({ value: version, label: dataVersionNames[version] }));
const mhcOptions = [
  { value: 'exclude', label: 'Exclude' },
  { value: 'keep', label: 'Keep' },
];
const globalSlug: Record<DataVersion, string> = { v1: 'global', v3: 'global-v3' };
// The GIANT example is the BMI GWAS, so it comes with the tissue the NetWAS docs use for it.
const exampleTissue: Record<DataVersion, string> = { v1: 'adipose-tissue', v3: 'global-v3' };
const rules = 'Tab-separated. VEGAS: gene in column 2, p-value in column 8. MAGMA: column 1 and 9. 2-column: gene and p-value.';
const formats = 'VEGAS, MAGMA or 2-column, tab-separated.';
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const number = new Intl.NumberFormat('en-US');

function toolOf(version: DataVersion): string {
  return version === 'v3' ? 'MAGE-WAS' : 'NetWAS';
}

export function NetwasForm({ draft, docsHref, onStarted }: NetwasFormProps) {
  const id = useId();
  const ids = { file: `${id}-file`, pValue: `${id}-p`, email: `${id}-email` };
  const api = useHumanbase();
  const networks = useIntegrations();
  const [version, setVersion] = useState<DataVersion>(draft?.version ?? NetworkQuery.defaultVersion);
  const [tissue, setTissue] = useState(draft?.tissue ?? globalSlug[version]);
  const [source, setSource] = useState<Source>('upload');
  const [file, setFile] = useState<GwasFile>();
  const [refused, setRefused] = useState<string>();
  const [loadingExample, setLoadingExample] = useState(false);
  const [pValue, setPValue] = useState(String(draft?.pValue ?? NetwasService.defaultPValue));
  const [mhc, setMhc] = useState<Mhc>(draft?.mhc === 'keep' ? 'keep' : 'exclude');
  const [title, setTitle] = useState(draft?.title ?? '');
  const [email, setEmail] = useState(draft?.email ?? '');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverProblems, setServerProblems] = useState<Record<string, string>>({});
  const [failure, setFailure] = useState<'busy' | 'off' | 'failed'>();
  const tool = toolOf(version);
  const examples = NetwasService.examples[version];

  const tissues = useMemo(() => {
    const all = networks.data ?? [];
    const global = all.find((network) => network.slug === globalSlug[version]);
    return [...(global ? [global] : []), ...IntegrationService.pick(all, 'tissue', version)];
  }, [networks.data, version]);
  const tissueName = tissues.find((network) => network.slug === tissue)?.name ?? tissue;

  const check: GwasCheckResult | undefined = useMemo(() => (file ? new GwasFileCheck().check(file.text) : undefined), [file]);
  const threshold = Number(pValue);
  const thresholdError = version === 'v1' && !(threshold > 0 && threshold < 1) ? 'Enter a p-value between 0 and 1, such as 0.01.' : undefined;
  const hits = check && version === 'v1' && !thresholdError ? GwasFileCheck.below(check, threshold) : undefined;
  const noHits = hits === 0 ? `No gene in this file is below ${pValue}, so ${tool} has no GWAS hits to learn from. Raise the threshold or check the p-value column.` : undefined;
  const ready = Boolean(check && check.count > 0 && !check.problems.length && !refused);
  const emailError = email.trim() && !emailPattern.test(email.trim()) ? 'Enter an email address like name@institution.edu, or leave it empty.' : undefined;

  const fileError = submitted
    ? (serverProblems.gwas_file ?? refused ?? (!file ? `Add a GWAS file to run ${tool}: ${formats}` : check?.count === 0 && !check.problems.length ? `This file has no genes with p-values. Use ${formats}` : undefined))
    : refused;
  const errors: ErrorSummaryItem[] = submitted
    ? [
        ...(fileError || (check?.problems.length ?? 0) > 0 ? [{ fieldId: ids.file, message: !file ? 'Add a GWAS file.' : fileError ?? `Fix ${check?.problems.length} lines in the GWAS file.` }] : []),
        ...(thresholdError || noHits || serverProblems.p_value ? [{ fieldId: ids.pValue, message: thresholdError ?? noHits ?? serverProblems.p_value ?? '' }] : []),
        ...(emailError || serverProblems.email ? [{ fieldId: ids.email, message: emailError ?? serverProblems.email ?? '' }] : []),
      ]
    : [];

  const reset = () => {
    setFile(undefined);
    setRefused(undefined);
    setServerProblems({});
  };

  const choose = async (chosen: File) => {
    setServerProblems({});
    setRefused(GwasFileCheck.refuse(chosen.name, chosen.size));
    setFile({ name: chosen.name, size: chosen.size, text: await chosen.text(), bytes: chosen });
  };

  const loadExample = async (example: NetwasExample | undefined = examples[0]) => {
    if (!example) return;
    setSource('example');
    reset();
    setTissue(exampleTissue[version]);
    setLoadingExample(true);
    try {
      const text = await api.netwas.exampleFile(example);
      setFile({ name: example.name, size: new Blob([text]).size, text, bytes: new File([text], example.name, { type: 'text/plain' }) });
    } catch {
      setRefused('The example file didn’t load. Try again in a moment, or download it from the panel and upload it.');
    } finally {
      setLoadingExample(false);
    }
  };

  const chooseSource = (next: Source) => {
    if (next === 'example') void loadExample();
    else {
      setSource('upload');
      reset();
    }
  };

  const chooseVersion = (next: string) => {
    const nextVersion = next as DataVersion;
    setVersion(nextVersion);
    setTissue(globalSlug[nextVersion]);
    if (source === 'example') {
      setSource('upload');
      reset();
    }
  };

  const downloadExample = async (example: NetwasExample) => {
    saveFile(await api.netwas.exampleFile(example), example.name);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    setFailure(undefined);
    setServerProblems({});
    if (!file || !ready || thresholdError || noHits || emailError) return;
    setSubmitting(true);
    try {
      const job = await api.netwas.submit({ file: file.bytes, tissue, version, pValue: version === 'v1' ? threshold : undefined, mhc: version === 'v3' ? mhc : undefined, title, email });
      const link = `/netwas/${job.id}/`;
      new JobHistory().add({ id: job.id, tool: job.tool, status: job.status, startedAt: job.created.toISOString(), link, title: title.trim() || undefined, detail: `${job.tool}, ${tissueName}` });
      onStarted(link);
    } catch (error) {
      const problems = NetwasService.problemsOf(error);
      if (error instanceof ApiError && error.status === 400 && problems.length) setServerProblems(Object.fromEntries(problems.map(({ field, message }) => [field, message])));
      else if (error instanceof ApiError && error.status === 429) setFailure('busy');
      else if (error instanceof SampleMissingError) setFailure('off');
      else setFailure('failed');
      setSubmitting(false);
    }
  };

  const showErrors = submitted && errors.length > 0;
  const runLabel = ready && check ? `Run ${tool} on ${number.format(check.count)} genes` : `Run ${tool}`;

  return (
    <div className="job-columns">
      <form className="job-form" noValidate onSubmit={(event) => void submit(event)}>
        {showErrors && <ErrorSummary key={errors.map((item) => item.message).join()} items={errors} />}
        {failure === 'busy' && (
          <Alert tone="warning" title={`You already have 5 ${tool} jobs queued or running`} dismissible onDismiss={() => setFailure(undefined)}>
            Humanbase runs up to 5 at a time from one network. Wait for one to finish in your Jobs menu, then run this again; your settings are kept.
          </Alert>
        )}
        {failure === 'off' && (
          <Alert tone="info" title="Jobs can’t start while the API is off" dismissible onDismiss={() => setFailure(undefined)}>
            This copy of Humanbase shows sample data. Choose GIANT and use its example file to see a sample job.
          </Alert>
        )}
        {failure === 'failed' && (
          <Alert tone="error" title={`${tool} couldn’t start`} dismissible onDismiss={() => setFailure(undefined)}>
            Humanbase didn’t answer. Your file and settings are kept, so try again in a moment.
          </Alert>
        )}
        <div className="job-form-row">
          <Select label="Data version" options={versionOptions} value={version} hint={`${tool} runs on ${dataVersionNames[version]} networks.`} onChange={chooseVersion} />
          <Select
              label="Tissue network"
              placeholder={networks.isPending ? 'Loading tissues…' : 'Choose a tissue'}
              options={tissues.map((network) => ({ value: network.slug, label: network.name }))}
              value={tissue}
              searchable
              filterLabel="Filter tissues"
              disabled={networks.isPending}
              hint="Global, or the tissue closest to your study."
              error={submitted ? serverProblems.tissue : undefined}
              onChange={setTissue}
            />
        </div>
        <SegmentedControl
          label="Add your GWAS results"
          value={source}
          segments={[
            { value: 'upload', label: 'Upload a file' },
            { value: 'example', label: 'Use the example' },
          ]}
          onChange={(value) => chooseSource(value as Source)}
        />
        <div className="netwas-file">
          <FileDrop
            id={ids.file}
            label="GWAS file"
            hideLabel
            accept={GwasFileCheck.extensions.join(',')}
            prompt="Drop a GWAS file here, or"
            hint={formats}
            file={file}
            error={fileError}
            progress={loadingExample ? { text: 'Loading the example file…', value: 0, max: 1 } : undefined}
            result={ready && check ? `${check.summary}, ready to run` : undefined}
            problems={check?.problems}
            problemSummary={`${check?.problems.length ?? 0} lines need fixing before this file can run`}
            onFile={(chosen) => {
              setSource('upload');
              void choose(chosen);
            }}
            onRemove={() => {
              setSource('upload');
              reset();
            }}
            onDownloadProblems={() => check && saveFile(['line\tproblem', ...check.problems.map(({ line, rule }) => `${line}\t${rule}`)].join('\n'), 'problems.tsv', 'text/tab-separated-values')}
          />
          {submitted && !file && (
            <a className="netwas-file-help" href="#gwas-file-rules" onClick={(event) => { event.preventDefault(); void loadExample(); }}>
              See the format, or use the example {version === 'v3' ? 'Alzheimer’s' : 'BMI'} file
            </a>
          )}
        </div>
        <div id="gwas-file-rules">
          <Accordion size="compact">
            <AccordionItem title={`GWAS file rules for ${tool}`} summary={rules}>
              <p>
                Genes can be HGNC symbols or Entrez IDs. A header row is optional, and lines starting with # are skipped. VEGAS uses the gene in column 2 and the p-value in column 8; MAGMA (.genes.out) column 1 and column 9; 2-column a gene and its p-value. Files must be under 3 MB, as .txt, .csv, .tsv or .out.
              </p>
            </AccordionItem>
          </Accordion>
        </div>
        {version === 'v1' ? (
          <TextInput
            id={ids.pValue}
            label="p-value threshold"
            inputMode="decimal"
            value={pValue}
            hint={`Genes below this p-value are the GWAS hits ${tool} learns from.`}
            error={submitted ? (thresholdError ?? noHits ?? serverProblems.p_value) : undefined}
            onChange={(event) => setPValue(event.target.value)}
          />
        ) : (
          <Select
            label="MHC region"
            options={mhcOptions}
            value={mhc}
            hint="The region’s long-range linkage makes one signal light up a whole block, so exclude it unless your trait is autoimmune."
            onChange={(value) => setMhc(value as Mhc)}
          />
        )}
        <TextInput label="Job title (optional)" placeholder="Untitled" hint="Shown on the job page and in this browser’s job list." value={title} onChange={(event) => setTitle(event.target.value)} />
        <TextInput
          id={ids.email}
          label="Email (optional)"
          type="email"
          placeholder="name@institution.edu"
          hint="We’ll send a link when it finishes. The job is saved in this browser either way."
          error={submitted ? (emailError ?? serverProblems.email) : undefined}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <div className="job-form-actions">
          <Button type="submit" loading={submitting}>
            {runLabel}
          </Button>
          <p className="job-form-help">Starts a job; you can leave this page.</p>
        </div>
      </form>
      <AboutPanel
        tool="NetWAS"
        docsHref={docsHref}
        examplesTitle={version === 'v3' ? 'Example files: an Alzheimer’s GWAS subset of 1,008 genes, for trying MAGE-WAS, not for results' : 'Example files: the same BMI GWAS (Randall 2013)'}
        examples={examples.map((example) => ({ name: example.name, detail: `${example.format} format`, onDownload: () => void downloadExample(example) }))}
      >
        NetWAS reprioritizes your GWAS using a tissue-specific functional network and a support vector machine to surface disease genes that a standard p-value cutoff would miss.
        {version === 'v3' && ' With MAGE, it runs as MAGE-WAS on MAGE networks.'}
      </AboutPanel>
    </div>
  );
}
