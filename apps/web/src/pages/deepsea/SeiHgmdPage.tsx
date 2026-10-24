import { SeiHgmdService, type HgmdOrder } from '@humanbase/data';
import { SeiHgmdBrowser, type SeiHgmdState } from '@humanbase/hb';
import { useSearchParams } from 'react-router';
import '../ToolPage.css';

// The URL keeps the view, sort order and selected variant, so each view can be shared.
export function SeiHgmdPage() {
  const [params, setParams] = useSearchParams();
  const order = SeiHgmdService.orders.find((option) => option.value === params.get('sort'))?.value ?? 'default';
  const state: SeiHgmdState = { view: params.get('view') === 'genome' ? 'genome' : 'heatmap', order, variant: params.get('variant') ?? undefined };
  const change = (next: Partial<SeiHgmdState>) =>
    setParams((current) => {
      const merged = { ...state, ...next };
      const write = (key: string, value: string | undefined, skip?: string) => (value && value !== skip ? current.set(key, value) : current.delete(key));
      write('view', merged.view, 'heatmap');
      write('sort', merged.order satisfies HgmdOrder, 'default');
      write('variant', merged.variant);
      return current;
    }, { replace: next.view === undefined });

  return (
    <section className="page-section tool-page">
      <title>{`Sei HGMD variants${state.view === 'genome' ? ' · Genome browser' : ''} · Humanbase`}</title>
      <SeiHgmdBrowser state={state} onStateChange={change} />
    </section>
  );
}
