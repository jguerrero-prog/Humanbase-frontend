import { PrecomputedVariantBrowser, seqweaverGnomad, type PrecomputedVariantState } from '@humanbase/hb';
import { useReadableSearchParams } from '../../useReadableSearchParams';
import '../ToolPage.css';

// The URL keeps the browser's range and the selected variant, so a view can be shared.
export function SeqweaverGnomadPage() {
  const [params, setParams] = useReadableSearchParams();
  const state: PrecomputedVariantState = { location: params.get('location') ?? undefined, variant: params.get('variant') ?? undefined };
  const change = (next: PrecomputedVariantState) =>
    setParams((current) => {
      for (const key of ['location', 'variant'] as const) {
        const value = next[key];
        if (value) current.set(key, value);
        else current.delete(key);
      }
      return current;
    });

  return (
    <section className="page-section tool-page">
      <title>Seqweaver gnomAD browser · Humanbase</title>
      <PrecomputedVariantBrowser set={seqweaverGnomad} state={state} onStateChange={change} />
    </section>
  );
}
