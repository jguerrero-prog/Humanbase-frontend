import { ApiError, IntegrationService, JobHistory, useHumanbase, useIntegrations, useModuleResult, type DataVersion, type ModuleView } from '@humanbase/data';
import type { GraphRendererFactory } from '@humanbase/graph';
import { Alert, Button, Dialog, EmptyState, TextInput, useLinkHref } from '@humanbase/ui';
import { useEffect, useState } from 'react';
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
  /** Called with a new result's link, after changing the tissue starts another job. */
  onStarted: (link: string) => void;
  renderer?: GraphRendererFactory | undefined;
}

/** A module job: waiting while it runs, then its result, or why there is none. */
export function ModuleExplorer({ bodyTag, view, onViewChange, onEditGenes, onStarted, renderer }: ModuleExplorerProps) {
  const linkHref = useLinkHref();
  const api = useHumanbase();
  const result = useModuleResult(bodyTag);
  const integrations = useIntegrations();
  const data = result.data;
  const [renaming, setRenaming] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  // Renaming has no endpoint, so the new title is kept in this browser's job history.
  const [title, setTitle] = useState(() => new JobHistory().list().find((job) => job.id === bodyTag)?.title);
  const [starting, setStarting] = useState(false);
  const [startFailed, setStartFailed] = useState(false);

  useEffect(() => {
    const history = new JobHistory();
    const job = history.list().find((entry) => entry.id === bodyTag);
    if (!job) return;
    if (data && job.status !== 'finished') history.add({ ...job, status: 'finished' });
    if (result.isError && job.status !== 'failed') history.add({ ...job, status: 'failed' });
  }, [bodyTag, data, result.isError]);

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

  const shownTitle = title || data.title || 'Untitled module search';
  const tissues = integrations.data ? IntegrationService.pick(integrations.data, 'tissue', data.version) : [];

  const rename = () => {
    const next = draftTitle.trim();
    const history = new JobHistory();
    const job = history.list().find((entry) => entry.id === bodyTag);
    if (job) history.add({ ...job, title: next || undefined });
    setTitle(next || undefined);
    setRenaming(false);
  };

  const changeTissue = async (tissue: string) => {
    setStarting(true);
    setStartFailed(false);
    try {
      const { bodyTag: next } = await api.modules.submit({ entrez: data.entrez, integration: tissue, version: data.version, title: shownTitle });
      const link = `/modules/?body_tag=${next}`;
      const network = tissues.find((item) => item.slug === tissue)?.name ?? tissue;
      new JobHistory().add({ id: next, tool: 'Modules', status: 'running', startedAt: new Date().toISOString(), link, title: shownTitle, detail: `Modules, ${network}` });
      onStarted(link);
    } catch {
      setStartFailed(true);
    } finally {
      setStarting(false);
    }
  };

  return (
    <>
      {startFailed && (
        <Alert tone="error" title="Modules for that tissue couldn’t start" dismissible onDismiss={() => setStartFailed(false)}>
          Humanbase didn’t answer. This result is unchanged; try the tissue again in a moment.
        </Alert>
      )}
      <ModuleResultView
        result={data}
        title={shownTitle}
        view={view}
        tissues={tissues}
        starting={starting}
        renderer={renderer}
        onViewChange={onViewChange}
        onRename={() => {
          setDraftTitle(shownTitle);
          setRenaming(true);
        }}
        onEditGenes={() => onEditGenes({ entrez: data.entrez, title: shownTitle, tissue: data.integration, version: data.version })}
        onTissueChange={(tissue) => void changeTissue(tissue)}
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
