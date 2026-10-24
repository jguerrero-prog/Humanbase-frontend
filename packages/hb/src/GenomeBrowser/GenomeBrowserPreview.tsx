import { assemblyNames, GenomeLocation, useGeneLocation, useHumanbase } from '@humanbase/data';
import { defaultGenomeEngine, diseaseImpactTracks, seqweaverGnomadTrack, type GenomeBrowserEngineFactory, type GenomeDataTrack } from '@humanbase/genome';
import { Alert, ResultHeader, ResultLayout, Skeleton } from '@humanbase/ui';
import { categoryCrumbs } from '../content/product';
import { GenomeBrowserLink, type GenomeBrowserView } from '../content/genomeBrowser';
import { VariantGenomeBrowser } from '../Deepsea/VariantGenomeBrowser';
import '../Deepsea/Deepsea.css';

export interface GenomeBrowserPreviewProps {
  view: GenomeBrowserView;
  /** The page keeps the view in its URL, with the gene and variant the link named. */
  onLocationChange: (location: GenomeLocation) => void;
  /** The proposal this page previews, linked from its notice. */
  proposalHref: string;
  engine?: GenomeBrowserEngineFactory | undefined;
}

// humanbase.io's /genome tracks, in its order; Conservation and GM12878 ChromHMM are offered in Tracks, hidden, as there.
const tracks: Record<GenomeBrowserView['assembly'], readonly GenomeDataTrack[]> = {
  hg19: [seqweaverGnomadTrack([0, 3]), ...diseaseImpactTracks('de novo ASD')],
  hg38: [],
};

/** The genome around a gene or a variant, with humanbase.io's /genome tracks: a preview of a proposal under review. */
export function GenomeBrowserPreview({ view, onLocationChange, proposalHref, engine = defaultGenomeEngine }: GenomeBrowserPreviewProps) {
  const { showsSamples } = useHumanbase();
  const found = useGeneLocation(view.location ? undefined : view.gene, view.assembly);
  const assemblyName = assemblyNames[view.assembly];
  const location = view.location ?? found.data ?? GenomeBrowserLink.start(view.assembly);
  const variant = view.variant?.chrom === location.chrom ? view.variant : undefined;
  const finding = found.isPending && found.fetchStatus !== 'idle';

  let geneNote;
  if (found.data === null && view.gene) {
    geneNote = (
      <Alert tone="warning" title={`${view.gene} isn’t in the gene index`}>
        {showsSamples ? `With the API off, the sample data finds a few example genes only. Turn the API on to find ${view.gene}. Showing ${location.format()}.` : `${GenomeLocation.geneNotFound(view.gene, view.assembly)} Showing ${location.format()}.`}
      </Alert>
    );
  } else if (found.isError) {
    geneNote = (
      <Alert tone="error" title={`${view.gene} couldn’t be found`} action={{ label: 'Try again', onSelect: () => void found.refetch() }}>
        The gene index didn’t answer. Showing {location.format()}.
      </Alert>
    );
  }

  return (
    <ResultLayout
      header={
        <ResultHeader
          crumbs={[categoryCrumbs.variants, { label: 'Genome browser' }]}
          title="Genome browser"
          context={[{ name: 'Genome', value: assemblyName }, ...(view.gene ? [{ name: 'Gene', value: view.gene }] : []), ...(view.variant ? [{ name: 'Variant', value: `${view.variant.chrom}:${view.variant.start.toLocaleString('en-US')}` }] : [])]}
        />
      }
      mainLabel="Genome browser"
      main={
        <div className="deepsea-result">
          <Alert tone="info" title="Preview" action={{ label: 'Read the proposal on GitHub', href: proposalHref }}>
            This page is a proposal under review: a genome browser you open from a gene or a variant. It may change or be taken out.
          </Alert>
          {view.assembly === 'hg38' && (
            <Alert tone="info" title="Genes only on GRCh38/hg38">
              The disease impact and Seqweaver gnomAD scores were computed on GRCh37/hg19, so this assembly shows genes and sequence.
            </Alert>
          )}
          {geneNote}
          {finding ? (
            <Skeleton width="100%" height="480px" />
          ) : (
            <VariantGenomeBrowser
              browser="genome"
              assembly={view.assembly}
              chromosome={location.chrom}
              position={variant?.start}
              label={variant ? `${variant.chrom}:${variant.start.toLocaleString('en-US')}` : (view.gene ?? location.format())}
              location={location}
              tracks={tracks[view.assembly]}
              onLocationChange={onLocationChange}
              engine={engine}
              variantSteps={false}
              failureNote="Reload the page to try again."
            />
          )}
        </div>
      }
    />
  );
}
