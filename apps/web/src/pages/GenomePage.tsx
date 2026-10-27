import { genomeBrowserLink, GenomeBrowserPreview } from '@humanbase/hb';
import type { GenomeLocation } from '@humanbase/data';
import { useReadableSearchParams } from '../useReadableSearchParams';
import './ToolPage.css';

// The URL keeps the view, the gene or variant the link named, and the assembly, so a view can be shared.
export function GenomePage() {
  const [params, setParams] = useReadableSearchParams();
  const view = genomeBrowserLink.read(params);
  const move = (to: GenomeLocation) =>
    setParams((current) => {
      current.set('location', to.format());
      if (view.variant) current.set('variant', `${view.variant.chrom}:${view.variant.start}`);
      return current;
    });

  return (
    <section className="page-section tool-page">
      <title>{`${view.gene ? `${view.gene} · ` : ''}Genome browser · Humanbase`}</title>
      <GenomeBrowserPreview view={view} onLocationChange={move} />
    </section>
  );
}
