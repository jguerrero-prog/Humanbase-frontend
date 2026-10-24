import { GenomeLocation, type Assembly } from '@humanbase/data';
import { genomeBrowserPreview } from './genomeBrowserPreview';

export { genomeBrowserPreview };

/** What /genome/ shows: a place, the gene the link named, and the variant to mark when the link came from one. */
export interface GenomeBrowserView {
  assembly: Assembly;
  gene?: string | undefined;
  location?: GenomeLocation | undefined;
  /** One base, such as chr1:877047. */
  variant?: GenomeLocation | undefined;
}

const position = /^((?:chr)?(?:[0-9]{1,2}|X|Y|M|MT)):([\d,]+)$/i;

function variantAt(text: string | null, assembly: Assembly): GenomeLocation | undefined {
  const place = position.exec(text?.replaceAll(/\s/g, '') ?? '');
  const parsed = place && GenomeLocation.parse(`${place[1]}:${place[2]}-${place[2]}`, assembly);
  return parsed instanceof GenomeLocation ? parsed.fit().location : undefined;
}

const href = (query: string): string | undefined => (genomeBrowserPreview ? `/genome/?${query}` : undefined);

/** Links into the genome browser page, and the view /genome/ reads back from them. Every link is undefined while the preview is off. */
export const genomeBrowserLink = {
  label: 'View in genome browser',
  /** A variant opens with this much of the genome around it, as variant results do. */
  variantWidth: 50_000,

  /** Where humanbase.io's /genome opens. */
  start: (assembly: Assembly): GenomeLocation => new GenomeLocation('chr1', 2_230_000, 2_440_000, assembly),

  gene: (symbol: string): string | undefined => href(`gene=${encodeURIComponent(symbol)}`),

  /** A variant, such as chr1:877047; the page centers on it and marks it. */
  variant: (chromosome: string, at: number): string | undefined => href(`location=${GenomeLocation.at(chromosome, at).chrom}:${at}`),

  /** Reads ?gene=, ?location= (a range or one position) and ?assembly=, plus ?variant=, which the page keeps once the view moves. */
  read(query: URLSearchParams): GenomeBrowserView {
    const assembly: Assembly = query.get('assembly') === 'hg38' ? 'hg38' : 'hg19';
    const typed = query.get('location') ?? '';
    const one = variantAt(typed, assembly);
    const range = GenomeLocation.parse(typed, assembly);
    return {
      assembly,
      gene: query.get('gene')?.trim() || undefined,
      location: range instanceof GenomeLocation ? range.fit().location : one?.withWidth(genomeBrowserLink.variantWidth),
      variant: one ?? variantAt(query.get('variant'), assembly),
    };
  },
} as const;
