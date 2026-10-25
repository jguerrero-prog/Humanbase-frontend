import { useDeepseaFeatureCount, useDeepseaInputCount, useDeepseaRegions, type DeepseaJob, type GenomeLocation } from '@humanbase/data';
import { Alert, Button, byGenomePosition, ContextLabel, Icon, ResultFiles, Skeleton, type JobStep } from '@humanbase/ui';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { jobDateTime, JobWaiting } from '../Jobs/JobPage';
import { deepseaJobCrumbs } from './DeepseaForm';
import { startWidth } from './DeepseaResultView';
import { VariantGenomeBrowser } from './VariantGenomeBrowser';

export interface DeepseaFilesViewProps {
  job: DeepseaJob;
  title: string;
  /** Copy link and Rename. */
  tools: ReactNode;
  /** The BED region the genome browser is open at, such as chr1:109,817,091, kept in the page's address. */
  region?: string | undefined;
  onRegionChange?: ((region: string) => void) | undefined;
}

/** A BED job's own regions on the genome with the reference tracks, opened only when asked for, stepping in genome order. */
function JobRegionsBrowser({ job, count, region, onRegionChange }: { job: DeepseaJob; count: number | undefined; region: string | undefined; onRegionChange: ((region: string) => void) | undefined }) {
  const [open, setOpen] = useState(region !== undefined);
  const regions = useDeepseaRegions(job, open);
  const ordered = useMemo(() => [...(regions.data ?? [])].sort(byGenomePosition), [regions.data]);
  const [picked, setPicked] = useState(region);
  const index = Math.max(0, ordered.findIndex((each) => each.label === picked));
  const selected = ordered[index];
  const [view, setView] = useState<{ region: string; location: GenomeLocation }>();
  const location = selected && (view?.region === selected.label ? view.location : selected.view(job.assembly, view?.location.width ?? startWidth));
  const show = (to: number) => {
    const next = ordered[to];
    if (!next) return;
    setPicked(next.label);
    onRegionChange?.(next.label);
  };
  // The address keeps the region shown, so a shared link opens on it; a link to a region the file lacks opens on the first.
  useEffect(() => {
    if (selected && selected.label !== region) onRegionChange?.(selected.label);
  }, [selected, region, onRegionChange]);
  const many = count === 1 ? 'region' : `${count ? `${count} ` : ''}regions`;

  return (
    <section className="deepsea-files" aria-label="Your regions">
      <h2>Your regions</h2>
      {!open ? (
        <>
          <p className="deepsea-note">See where your {many} sit on the genome, with the reference tracks. The predictions stay in the files above.</p>
          <div>
            <Button variant="secondary" size="medium" icon="genome-track" onClick={() => setOpen(true)}>
              View your regions in the genome browser
            </Button>
          </div>
        </>
      ) : regions.isError ? (
        <Alert tone="error" title="Your regions couldn’t load" action={{ label: 'Try again', onSelect: () => void regions.refetch() }}>
          Humanbase couldn’t read the file you submitted. The result files above still work.
        </Alert>
      ) : !regions.data ? (
        <Skeleton width="100%" />
      ) : !selected || !location ? (
        <p className="deepsea-note">Your file has no regions the genome browser can show.</p>
      ) : (
        <>
          <p className="deepsea-note">
            Region {index + 1} of {ordered.length}: {selected.label}
          </p>
          <VariantGenomeBrowser
            assembly={job.assembly}
            chromosome={selected.chromosome}
            position={selected.position}
            label={selected.label}
            location={location}
            tracks={[]}
            browser="bed-regions"
            failureNote="The result files above still work."
            onLocationChange={(to) => setView({ region: selected.label, location: to })}
            {...(index > 0 && { onPreviousVariant: () => show(index - 1) })}
            {...(index < ordered.length - 1 && { onNextVariant: () => show(index + 1) })}
          />
        </>
      )}
    </section>
  );
}

/** A job's result files in the job page's words; links only once the job has finished. */
export function DeepseaResultFiles({ job, linked }: { job: DeepseaJob; linked: boolean }) {
  const files = job.resultFiles.filter((file) => !linked || file.key !== 'gz_file');
  if (!files.length) return null;
  return (
    <section className="deepsea-files" aria-label="Result files">
      <h2>Result files</h2>
      <ResultFiles files={files.map((file) => ({ name: file.key === 'uploaded_query' ? 'Your query' : file.name, holds: file.holds, format: file.format, href: linked ? file.url : undefined }))} />
    </section>
  );
}

/** A finished Sei, Beluga or Seqweaver job whose input humanbase.io doesn't plot: its results are files to download. */
export function DeepseaFilesView({ job, title, tools, region, onRegionChange }: DeepseaFilesViewProps) {
  const profiles = useDeepseaFeatureCount(job.model.id);
  const inputs = useDeepseaInputCount(job).data;
  const archive = job.resultFiles.find((file) => file.key === 'gz_file');
  const steps: JobStep[] = [
    { label: 'Submitted', detail: jobDateTime.format(job.created), state: 'done' },
    { label: 'Queued', state: 'done' },
    { label: 'Ran', state: 'done' },
    { label: 'Results ready', state: 'done' },
  ];
  return (
    <JobWaiting
      title={title}
      crumbs={deepseaJobCrumbs(job.model, title)}
      status="finished"
      badge="Finished"
      next={{ title: 'Download the results', text: job.filesSummary(profiles, inputs) }}
      actions={
        archive && (
          <a className="button button-primary button-medium" href={archive.url}>
            <Icon name="download" size={16} />
            Download everything ({archive.format})
          </a>
        )
      }
      steps={steps}
      details={
        <>
          <ContextLabel name="Tool" value={job.model.tool} />
          <ContextLabel name="Input" value={job.inputLabel} />
        </>
      }
      tools={tools}
    >
      <DeepseaResultFiles job={job} linked />
      {job.kind === 'bed' && <JobRegionsBrowser job={job} count={inputs} region={region} onRegionChange={onRegionChange} />}
    </JobWaiting>
  );
}
