import { SeiHgmdService } from '@humanbase/data';
import { SeiHgmdBrowser, type SeiHgmdState } from '@humanbase/hb';
import { useSearchParams } from 'react-router';
import '../ToolPage.css';

// The URL keeps the view, the heatmap's order, and the browser's range and variant, so each view can be shared.
export function SeiHgmdPage() {
  const [params, setParams] = useSearchParams();
  const state: SeiHgmdState = {
    view: params.get('view') === 'genome' ? 'genome' : 'heatmap',
    order: SeiHgmdService.orders.find((option) => option.value === params.get('sort'))?.value ?? 'default',
    location: params.get('location') ?? undefined,
    variant: params.get('variant') ?? undefined,
  };
  const change = (next: Partial<SeiHgmdState>) =>
    setParams((current) => {
      const merged = { ...state, ...next };
      const write = (key: string, value: string | undefined, skip?: string) => (value && value !== skip ? current.set(key, value) : current.delete(key));
      write('view', merged.view, 'heatmap');
      write('sort', merged.order, 'default');
      write('location', merged.location);
      write('variant', merged.variant);
      return current;
    });

  return (
    <section className="page-section tool-page">
      <title>{`Sei HGMD variants${state.view === 'genome' ? ' · Genome browser' : ''} · Humanbase`}</title>
      <SeiHgmdBrowser state={state} onStateChange={change} />
    </section>
  );
}
