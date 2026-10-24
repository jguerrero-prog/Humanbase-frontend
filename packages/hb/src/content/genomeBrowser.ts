import { GenomeLocation, type Assembly } from '@humanbase/data';

/** The genome browser page (#458) is a preview of a proposal under review (#457). Set to false to take out /genome/ and every "View in genome browser" link. */
export const genomeBrowserPreview = true;

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

/** Links into the genome browser page, and the view /genome/ reads back from them. Every link is undefined while the preview is off. */
export class GenomeBrowserLink {
  static readonly label = 'View in genome browser';
  static readonly path = '/genome/';
  /** A variant opens with this much of the genome around it, as variant results do. */
  static readonly variantWidth = 50_000;

  /** Where humanbase.io's /genome opens. */
  static start(assembly: Assembly): GenomeLocation {
    return new GenomeLocation('chr1', 2_230_000, 2_440_000, assembly);
  }

  static gene(symbol: string): string | undefined {
    return this.href(`gene=${encodeURIComponent(symbol)}`);
  }

  /** A variant, such as chr1:877047; the page centers on it and marks it. */
  static variant(chromosome: string, at: number): string | undefined {
    return this.href(`location=${GenomeLocation.at(chromosome, at).chrom}:${at}`);
  }

  /** Reads ?gene=, ?location= (a range or one position) and ?assembly=, plus ?variant=, which the page keeps once the view moves. */
  static read(query: URLSearchParams): GenomeBrowserView {
    const assembly: Assembly = query.get('assembly') === 'hg38' ? 'hg38' : 'hg19';
    const typed = query.get('location') ?? '';
    const one = variantAt(typed, assembly);
    const range = GenomeLocation.parse(typed, assembly);
    return {
      assembly,
      gene: query.get('gene')?.trim() || undefined,
      location: range instanceof GenomeLocation ? range.fit().location : one?.withWidth(this.variantWidth),
      variant: one ?? variantAt(query.get('variant'), assembly),
    };
  }

  private static href(query: string): string | undefined {
    return genomeBrowserPreview ? `${this.path}?${query}` : undefined;
  }
}
