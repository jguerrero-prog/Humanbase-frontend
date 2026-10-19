import { ApiError, dataVersionNames, JobHistory, useIntegrations, useModuleResult, type ModuleResult } from '@humanbase/data';
import { Alert, EmptyState, ResultHeader, ResultLayout } from '@humanbase/ui';
import { useEffect } from 'react';
import { GraphLoading } from '../Networks/GraphPanel';

export interface ModuleExplorerProps {
  bodyTag: string;
}

/** A module job: waiting while it runs, then its result, or why there is none. */
export function ModuleExplorer({ bodyTag }: ModuleExplorerProps) {
  const result = useModuleResult(bodyTag);
  const integrations = useIntegrations();
  const data = result.data;

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
          <a className="button button-secondary" href="/?analysis=modules">
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

  const tissue = integrations.data?.find((network) => network.slug === data.integration)?.name ?? data.integration;
  return <ModuleResultView result={data} tissue={tissue} />;
}

function ModuleResultView({ result, tissue }: { result: ModuleResult; tissue: string }) {
  const title = result.title || 'Untitled module search';
  return (
    <ResultLayout
      header={
        <ResultHeader
          crumbs={[{ label: 'Modules', href: '/?analysis=modules' }, { label: title }]}
          title={title}
          context={[
            { name: 'Data version', value: dataVersionNames[result.version] },
            { name: 'Tissue', value: tissue },
          ]}
        />
      }
      mainLabel="Modules"
      main={<p>{result.modules.length} modules found.</p>}
    />
  );
}
