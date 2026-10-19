import { useHumanbase } from '@humanbase/data';
import { defaultGenomeEngine, GenomeEngineView, withChr, type Assembly, type GenomeBrowserEngineFactory, type GenomeDataTrack } from '@humanbase/genome';
import { Alert } from '@humanbase/ui';
import { useMemo, useState } from 'react';

export interface VariantGenomeBrowserProps {
  assembly: Assembly;
  chromosome: string;
  position: number;
  /** The variant in words, such as chr7:49,813,589 G>C. */
  label: string;
  engine?: GenomeBrowserEngineFactory | undefined;
}

// The design centers the browser on the selected variant at 50 kb.
const halfWidth = 25_000;
const noTracks: readonly GenomeDataTrack[] = [];

/** The genome around the selected variant. With the API off nothing loads, so the section is left out. */
export function VariantGenomeBrowser({ assembly, chromosome, position, label, engine = defaultGenomeEngine }: VariantGenomeBrowserProps) {
  const { showsSamples } = useHumanbase();
  const [failure, setFailure] = useState<Error>();
  const chrom = withChr(chromosome);
  const region = useMemo(() => ({ chrom, start: Math.max(1, position - halfWidth), end: position + halfWidth }), [chrom, position]);
  if (showsSamples) return null;
  return (
    <section className="variant-genome-browser" aria-label={`Genome around ${label}`}>
      {failure && (
        <Alert tone="error" title="The genome browser couldn’t load">
          {failure.message} The molecular effects below still work.
        </Alert>
      )}
      <GenomeEngineView
        engine={engine}
        label={`Genome browser, 50 kb around ${label}`}
        assembly={assembly}
        region={region}
        tracks={noTracks}
        selected={{ chrom, position }}
        onStatusChange={(status, error) => setFailure(status === 'failed' ? error : undefined)}
      />
    </section>
  );
}
