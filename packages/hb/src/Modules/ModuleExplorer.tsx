import { ApiError, ExtendedUniverse, IntegrationService, JobHistory, useHumanbase, useIntegrations, useModuleResult, type DataVersion, type ModuleView } from '@humanbase/data';
import type { GraphRendererFactory } from '@humanbase/graph';
import { Alert } from '@humanbase/ui';
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { JobLoadError, syncJobStatus, useJobActions, useJobTitle } from '../Jobs/JobPage';
import { GraphLoading } from '../Networks/GraphPanel';
import { ModuleResultView } from './ModuleResultView';

/** What Edit genes hands back to the search: the list and settings the result was made from. */
export interface ModuleDraft {
  entrez: readonly number[];
  title: string;
  tissue: string;
  version: DataVersion;
}

export interface ModuleExplorerProps {
  bodyTag: string;
  view: ModuleView;
  onViewChange: (view: ModuleView) => void;
  onEditGenes: (draft: ModuleDraft) => void;
  /** Called with a new result's link after another job starts; replace is true when the page started it on its own. */
  onStarted: (link: string, replace: boolean) => void;
  /** extended_universe=true in the URL: new GIANT jobs use cross-organism annotations, as on humanbase.io. */
  extendedUniverse?: boolean;
  renderer?: GraphRendererFactory | undefined;
}

interface Start {
  tissue?: string;
  extendedUniverse?: boolean;
  /** An automatic rerun hides the annotations notice and replaces this page in history. */
  automatic?: boolean;
  failure: { title: string; text: string };
}

const annotationsName = (extended: boolean) => (extended ? 'extended (cross-organism)' : 'human-only');
const annotationsRun = (extended: boolean, automatic = false): Start => ({
  extendedUniverse: extended,
  automatic,
  failure: { title: `Modules with ${annotationsName(extended)} annotations couldn’t start`, text: 'Humanbase didn’t answer. This result is unchanged; try again in a moment.' },
});

/** A module job: waiting while it runs, then its result, or why there is none. */
export function ModuleExplorer({ bodyTag, view, onViewChange, onEditGenes, onStarted, extendedUniverse = false, renderer }: ModuleExplorerProps) {
  const api = useHumanbase();
  const result = useModuleResult(bodyTag);
  const integrations = useIntegrations();
  const data = result.data;
  const { title: shownTitle, given: title, rename } = useJobTitle({ id: bodyTag, tool: 'Modules', title: data?.title }, 'Untitled module search');
  const { startRename, overlays } = useJobActions(shownTitle, rename, 'result');
  const [starting, setStarting] = useState<Start>();
  const [failure, setFailure] = useState<Start['failure']>();
  const autoStarted = useRef(false);

  useEffect(() => {
    if (data) syncJobStatus(bodyTag, 'finished');
    if (result.isError) syncJobStatus(bodyTag, 'failed');
  }, [bodyTag, data, result.isError]);

  const tissues = integrations.data && data ? IntegrationService.pick(integrations.data, 'tissue', data.version) : [];

  const start = async (request: Start) => {
    if (!data || starting) return;
    const tissue = request.tissue ?? data.integration;
    const extended = (request.extendedUniverse ?? extendedUniverse) && ExtendedUniverse.supports(data.version);
    setStarting(request);
    setFailure(undefined);
    try {
      // The annotations rerun keeps the result's own title, so its body_tag matches the one humanbase.io makes.
      const { bodyTag: next } = await api.modules.submit({ entrez: data.entrez, integration: tissue, version: data.version, title: request.tissue ? shownTitle : data.title, extendedUniverse: extended });
      const link = ExtendedUniverse.link(`/modules/?body_tag=${next}`, extended);
      const network = tissues.find((item) => item.slug === tissue)?.name ?? tissue;
      new JobHistory().add({ id: next, tool: 'Modules', status: 'running', startedAt: new Date().toISOString(), link, title: shownTitle, detail: `Modules, ${network}` });
      onStarted(link, request.automatic ?? false);
    } catch {
      setFailure(request.failure);
    } finally {
      setStarting(undefined);
    }
  };

  // As on humanbase.io, extended_universe=true on a human-only GIANT result reruns it with extended annotations.
  const rerunExtended = useEffectEvent(() => void start(annotationsRun(true, true)));
  const needsExtended = extendedUniverse && !!data && ExtendedUniverse.supports(data.version) && data.extendedUniverse === false;
  useEffect(() => {
    if (!needsExtended || autoStarted.current) return;
    autoStarted.current = true;
    rerunExtended();
  }, [needsExtended]);

  if (result.isError) {
    return (
      <JobLoadError
        missing={result.error instanceof ApiError && (result.error.isNotFound || result.error.status === 400)}
        notFound={{
          title: 'This module result isn’t available',
          text: 'Results are kept for a while after a job finishes, and this one has expired or never started. Paste the gene list again to find its modules.',
          run: { label: 'Find modules', href: '/?analysis=modules' },
        }}
        failedTitle="The module result couldn’t load"
        onRetry={() => void result.refetch()}
      />
    );
  }

  if (!data) {
    return <GraphLoading title="Finding modules" text="Module detection usually takes a minute or two for a few hundred genes." note="You can leave this page. The job is in your Jobs menu, and this link opens the result when it’s ready." />;
  }

  const extendedResult = data.extendedUniverse === true;
  const showsAnnotations = ExtendedUniverse.supports(data.version) && data.extendedUniverse !== undefined && (extendedResult || extendedUniverse) && !starting?.automatic;

  return (
    <>
      {failure && (
        <Alert tone="error" title={failure.title} dismissible onDismiss={() => setFailure(undefined)}>
          {failure.text}
        </Alert>
      )}
      <ModuleResultView
        result={data}
        title={shownTitle}
        view={view}
        tissues={tissues}
        starting={starting !== undefined}
        notice={
          showsAnnotations && (
            <Alert
              title={extendedResult ? 'Extended annotations' : 'Human-only annotations'}
              action={{ label: extendedResult ? 'Run with human-only annotations' : 'Run with extended (cross-organism) annotations', onSelect: () => void start(annotationsRun(!extendedResult)) }}
            >
              This module was computed with {annotationsName(extendedResult)} annotations.
            </Alert>
          )
        }
        renderer={renderer}
        onViewChange={onViewChange}
        onRename={startRename}
        onEditGenes={() => onEditGenes({ entrez: data.entrez, title: title ?? data.title, tissue: data.integration, version: data.version })}
        onTissueChange={(tissue) =>
          void start({ tissue, failure: { title: 'Modules for that tissue couldn’t start', text: 'Humanbase didn’t answer. This result is unchanged; try the tissue again in a moment.' } })
        }
      />
      {overlays}
    </>
  );
}
