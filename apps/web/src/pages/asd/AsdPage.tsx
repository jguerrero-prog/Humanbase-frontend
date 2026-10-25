import type { AsdFeatureSet } from '@humanbase/data';
import { AsdExplorer, type AsdState, type AsdView } from '@humanbase/hb';
import { useReadableSearchParams } from '../../useReadableSearchParams';
import '../ToolPage.css';

// The URL keeps the view, location, variant and feature set, so either view can be shared.
export function AsdPage() {
  const [params, setParams] = useReadableSearchParams();
  const state: AsdState = {
    view: params.get('view') === 'table' ? 'table' : 'browser',
    location: params.get('location') ?? undefined,
    variant: params.get('variant') ?? undefined,
    set: params.get('features') === 'rna' ? 'rna' : 'dna',
  };
  const change = (next: Partial<AsdState>) =>
    setParams((current) => {
      const merged = { ...state, ...next };
      const write = (key: string, value: string | undefined, skip?: string) => (value && value !== skip ? current.set(key, value) : current.delete(key));
      write('view', merged.view satisfies AsdView, 'browser');
      write('location', merged.location);
      write('variant', merged.variant);
      write('features', merged.set satisfies AsdFeatureSet, 'dna');
      return current;
    }, { replace: next.variant !== undefined && next.location === undefined && next.view === undefined });

  return (
    <section className="page-section tool-page">
      <title>ASD Browser · Humanbase</title>
      <AsdExplorer state={state} onStateChange={change} />
    </section>
  );
}
