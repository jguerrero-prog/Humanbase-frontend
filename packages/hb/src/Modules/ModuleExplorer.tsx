import { ApiError, ExtendedUniverse, IntegrationService, JobHistory, useHumanbase, useIntegrations, useModuleResult, type DataVersion, type ModuleView } from '@humanbase/data';
import type { GraphRendererFactory } from '@humanbase/graph';
import { Alert, Button, Dialog, EmptyState, TextInput, useLinkHref } from '@humanbase/ui';
import { useEffect, useEffectEvent, useRef, useState } from 'react';
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
  const linkHref = useLinkHref();
  const api = useHumanbase();
  const result = useModuleResult(bodyTag);
  const integrations = useIntegrations();
  const data = result.data;
  const [renaming, setRenaming] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  // Renaming has no endpoint, so the new title is kept in this browser's job history.
  const [title, setTitle] = useState(() => new JobHistory().list().find((job) => job.id === bodyTag)?.title);
  const [starting, setStarting] = useState<Start>();
  const [failure, setFailure] = useState<Start['failure']>();
  const autoStarted = useRef(false);

  useEffect(() => {
    const history = new JobHistory();
    const job = history.list().find((entry) => entry.id === bodyTag);
    if (!job) return;
    if (data && job.status !== 'finished') history.add({ ...job, status: 'finished' });
    if (result.isError && job.status !== 'failed') history.add({ ...job, status: 'failed' });
  }, [bodyTag, data, result.isError]);

  const shownTitle = title || data?.title || 'Untitled module search';
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
    const missing = result.error instanceof ApiError && (result.error.isNotFound || result.error.status === 400);
    return missing ? (
      <EmptyState
        title="This module result isn’t available"
        text="Results are kept for a while after a job finishes, and this one has expired or never started. Paste the gene list again to find its modules."
        actions={
          <a className="button button-secondary" href={linkHref('/?analysis=modules')}>
            Find modules
          </a>
        }
      />
    ) : (
      <Alert tone="error" title="The module result couldn’t load" action={{ label: 'Try again', onSelect: () => void result.refetch() }}>
        Humanbase didn’t answer. The job keeps running, so trying again in a moment is safe.
      </Alert>
    );
  }

  if (!data) {
    return <GraphLoading title="Finding modules" text="Module detection usually takes a minute or two for a few hundred genes." note="You can leave this page. The job is in your Jobs menu, and this link opens the result when it’s ready." />;
  }


  const rename = () => {
    const next = draftTitle.trim();
    const history = new JobHistory();
    const job = history.list().find((entry) => entry.id === bodyTag);
    if (job) history.add({ ...job, title: next || undefined });
    setTitle(next || undefined);
    setRenaming(false);
  };

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
        onRename={() => {
          setDraftTitle(shownTitle);
          setRenaming(true);
        }}
        onEditGenes={() => onEditGenes({ entrez: data.entrez, title: title || data.title, tissue: data.integration, version: data.version })}
        onTissueChange={(tissue) =>
          void start({ tissue, failure: { title: 'Modules for that tissue couldn’t start', text: 'Humanbase didn’t answer. This result is unchanged; try the tissue again in a moment.' } })
        }
      />
      <Dialog
        title="Rename this result"
        open={renaming}
        onClose={() => setRenaming(false)}
        actions={
          <>
            <Button variant="ghost" onClick={() => setRenaming(false)}>
              Cancel
            </Button>
            <Button onClick={rename}>Rename</Button>
          </>
        }
      >
        <TextInput label="Title" value={draftTitle} hint="Kept in this browser and shown in your job list." onChange={(event) => setDraftTitle(event.target.value)} />
      </Dialog>
    </>
  );
}
