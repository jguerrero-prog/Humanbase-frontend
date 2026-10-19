import { ApiError, NetworkQuery, useGeneListMatches, useIntegrations, useNetwasJob, useNetwasResult, type NetwasJob } from '@humanbase/data';
import { Alert, Button, ContextLabel, EmptyState, JobDetails, NetwasGuide, ResultHeader, ResultLayout, saveFile, Skeleton, StatusBadge, type JobStep } from '@humanbase/ui';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { elapsed, jobDateTime as dateTime, JobWaiting, syncJobHistory, useJobActions, useJobTitle } from '../Jobs/JobPage';
import { NetwasGenes } from '../NetwasGenes/NetwasGenes';
import type { NetwasDraft } from './NetwasForm';
import './Netwas.css';

export interface NetwasJobViewProps {
  id: string;
  /** Opens the form again with this job's settings, after a job fails. */
  onEditAndResubmit: (draft: NetwasDraft) => void;
}

const citation = 'Greene CS, Krishnan A, Wong AK, et al. (2015). Understanding multicellular function and disease with human tissue-specific networks. Nature Genetics.';
const usualTime = 'NetWAS jobs usually take 10 to 30 minutes.';
const date = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

function stepsOf(job: NetwasJob, now: number): JobStep[] {
  const submitted: JobStep = { label: 'Submitted', detail: dateTime.format(job.created), state: 'done' };
  if (job.status === 'queued') return [submitted, { label: 'Queued', detail: 'Waiting to start', state: 'current' }, { label: 'Running', state: 'upcoming' }, { label: 'Results ready', state: 'upcoming' }];
  if (job.status === 'failed') return [submitted, { label: 'Queued', state: 'done' }, { label: 'Running', detail: job.failure ? `Stopped: ${job.failure}` : 'Stopped before it finished', state: 'stopped' }];
  return [submitted, { label: 'Queued', state: 'done' }, { label: 'Running', detail: `${elapsed(job.created, now)} so far. ${usualTime}`, state: 'current' }, { label: 'Results ready', state: 'upcoming' }];
}

// The API names the reason; the file rules come from the API's description of the upload.
function whatToDo(job: NetwasJob): string {
  if (job.failure && /p-?value/i.test(job.failure)) return 'Each format keeps the p-value in one place: column 8 in VEGAS, column 9 in MAGMA, column 2 in a 2-column file. Fix the file and submit again; your settings are kept.';
  return `The job stopped before it finished${job.logFile ? '; the log file may say why' : ''}. Check the file against the GWAS file rules and submit again; your settings are kept.`;
}

function ResultGenes({ text, job }: { text: string; job: NetwasJob }) {
  const [shown, setShown] = useState<readonly string[]>([]);
  const matches = useGeneListMatches(shown);
  const onShownChange = useCallback((symbols: readonly string[]) => setShown(symbols), []);
  const found = useMemo(() => {
    const genes = new Map<string, { name: string; entrez: number }>();
    for (const match of matches.data ?? []) {
      const gene = match.genes.find((hit) => hit.symbol.toLowerCase() === match.typed.toLowerCase()) ?? match.genes[0];
      if (gene) genes.set(match.typed.toUpperCase(), { name: gene.name, entrez: gene.entrez });
    }
    return genes;
  }, [matches.data]);
  const names = Object.fromEntries([...found].map(([symbol, gene]) => [symbol, gene.name]));
  const tissue = job.tissue.startsWith('global') ? undefined : job.tissue;
  // Undefined while the lookup runs; null once it has answered without the gene.
  const hrefOf = (symbol: string) => {
    const gene = found.get(symbol.toUpperCase());
    if (gene) return new NetworkQuery([gene.entrez], tissue, job.version).href;
    return matches.isSuccess ? null : undefined;
  };
  return <NetwasGenes file={text} names={names} networkHref={hrefOf} onShownChange={onShownChange} />;
}

export function NetwasJobView({ id, onEditAndResubmit }: NetwasJobViewProps) {
  const job = useNetwasJob(id);
  const data = job.data;
  const result = useNetwasResult(data?.status === 'finished' ? data : undefined);
  const integrations = useIntegrations();
  const { title, rename } = useJobTitle(data);
  const { copyButton, renameButton, overlays } = useJobActions(title, rename);
  const [tab, setTab] = useState('genes');
  // When the job was last read; elapsed times move on with each poll.
  const now = job.dataUpdatedAt;

  useEffect(() => {
    if (!data) return;
    const tissueName = integrations.data?.find((network) => network.slug === data.tissue)?.name ?? data.tissue;
    syncJobHistory(data, `/netwas/${data.id}/`, `${data.tool}, ${tissueName}`);
  }, [data, integrations.data]);

  if (job.isError) {
    const missing = job.error instanceof ApiError && job.error.isNotFound;
    return missing ? (
      <EmptyState
        title="This NetWAS job isn’t available"
        text="No job has this link. Check that it was copied whole, or run NetWAS again."
        actions={
          <a className="button button-secondary" href="/netwas/">
            Run NetWAS
          </a>
        }
      />
    ) : (
      <Alert tone="error" title="This job couldn’t load" action={{ label: 'Try again', onSelect: () => void job.refetch() }}>
        Humanbase didn’t answer. The job keeps running, so trying again in a moment is safe.
      </Alert>
    );
  }

  if (!data) {
    return (
      <div className="job-page" aria-busy="true">
        <Skeleton width="240px" />
        <Skeleton width="420px" />
      </div>
    );
  }

  const tissueName = integrations.data?.find((network) => network.slug === data.tissue)?.name ?? data.tissue;
  const network = `${tissueName}, ${data.version === 'v3' ? 'MAGE' : 'GIANT'}`;
  const gwasFile = [data.gwasFileName, data.gwasFormat].filter(Boolean).join(', ');
  const crumbs = [{ label: 'Jobs', href: '/jobs/' }, { label: title }];
  if (data.status === 'finished') {
    const fileName = data.resultsFile?.split('/').pop() ?? `${data.id}.txt`;
    const threshold = data.pValue === null ? undefined : String(data.pValue);
    const context = [{ name: 'Tissue network', value: network }, { name: 'GWAS file', value: gwasFile }, ...(threshold ? [{ name: 'p-value threshold', value: threshold }] : [])];
    const header = result.data?.result.header;
    const field = (name: string) => header?.get(name) || undefined;
    const details = [
      { term: 'Job ID', value: data.id, mono: true },
      { term: 'Job title', value: data.title ?? `None given; shown as ${title}` },
      { term: 'Email', value: data.email ?? 'None given' },
      { term: 'Created', value: field('Created') ?? dateTime.format(data.created) },
      { term: 'GWAS file', value: data.gwasFileName, mono: true },
      { term: 'GWAS format', value: data.gwasFormat || 'Detected by NetWAS' },
      { term: 'Tissue network', value: network },
      ...(threshold ? [{ term: 'p-value threshold', value: threshold }] : [{ term: 'MHC region', value: data.mhc === 'keep' ? 'Kept' : 'Excluded' }]),
      { term: 'Result columns', value: 'Gene symbol; training label (1, −1, 0); NetWAS score' },
    ];
    return (
      <>
        <title>{`Finished · ${title} · Humanbase`}</title>
        <ResultLayout
          mainLabel={tab === 'genes' ? 'Genes ranked by NetWAS score' : `${title} details`}
          companionLabel="How to read this"
          header={
            <ResultHeader
              crumbs={crumbs}
              title={title}
              actions={
                <span className="job-page-finished">
                  <StatusBadge status="finished" />
                  <span>Created {date.format(data.created)}</span>
                </span>
              }
              context={context}
              settingsLabel="Job actions"
              settings={
                <>
                  {renameButton}
                  {copyButton}
                  <Button variant="secondary" icon="download" disabled={!result.data} onClick={() => result.data && saveFile(result.data.text, fileName)}>
                    Download result file
                  </Button>
                </>
              }
              tabs={[
                { value: 'genes', label: 'Genes' },
                { value: 'details', label: 'Job details' },
              ]}
              tabsLabel={`${title} views`}
              tab={tab}
              onTabChange={setTab}
            />
          }
          main={
            tab === 'details' ? (
              <JobDetails items={details} label={`${title} details`} />
            ) : result.isError ? (
              <Alert tone="error" title="The result file couldn’t load" action={{ label: 'Try again', onSelect: () => void result.refetch() }}>
                The job finished, but its file didn’t arrive. Trying again is safe.
              </Alert>
            ) : result.data ? (
              <ResultGenes text={result.data.text} job={data} />
            ) : (
              <div className="job-page" aria-busy="true">
                <p className="job-page-note">Reading the result file…</p>
              </div>
            )
          }
          companion={data.version === 'v1' && threshold ? <NetwasGuide tissue={tissueName.toLowerCase()} threshold={threshold} citation={citation} /> : undefined}
        />
        {overlays}
      </>
    );
  }

  const badge = data.status === 'queued' ? 'Queued' : data.status === 'running' ? `Running for ${elapsed(data.created, now)}` : `Failed${data.failure ? `: ${data.failure}` : ''}`;
  return (
    <>
      <title>{`${badge} · ${title} · Humanbase`}</title>
      <JobWaiting
        title={title}
        status={data.status}
        badge={badge}
        note={data.status === 'running' ? `${elapsed(data.created, now)} so far. ${usualTime}` : data.status === 'queued' ? 'Waiting for a worker to start it.' : undefined}
        next={data.status === 'failed' ? { title: 'What to do', text: whatToDo(data) } : { title: 'You can leave this page', text: 'Jobs in the top bar shows its progress from any page, and the link works on any device. If you gave an email address, the results link is sent there too.' }}
        actions={
          data.status === 'failed' && (
            <>
              <Button variant="secondary" onClick={() => onEditAndResubmit({ version: data.version, tissue: data.tissue, pValue: data.pValue, mhc: data.mhc, title: data.title, email: data.email })}>
                Edit and resubmit
              </Button>
              <a className="button button-ghost button-medium" href="/netwas/#gwas-file-rules">
                See file format
              </a>
              {data.logFile && (
                <a className="button button-ghost button-medium" href={data.logFile}>
                  Open the log file
                </a>
              )}
            </>
          )
        }
        steps={stepsOf(data, now)}
        details={
          <>
            <ContextLabel name="Tool" value={data.tool} />
            <ContextLabel name="Tissue network" value={network} />
            <ContextLabel name="GWAS file" value={gwasFile} />
          </>
        }
        tools={
          <>
            {copyButton}
            {renameButton}
          </>
        }
      />
      {overlays}
    </>
  );
}
