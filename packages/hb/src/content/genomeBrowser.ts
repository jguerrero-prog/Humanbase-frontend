import { GenomeLocation, readableSearch, type Assembly } from '@humanbase/data';
import type { Crumb } from '@humanbase/ui';
import { genomeBrowserPreview } from './genomeBrowserPreview';
import { categoryCrumbs, productTools } from './product';

export { genomeBrowserPreview };

/** What /genome/ shows: a place, the gene the link named, and the variant to mark when the link came from one. */
export interface GenomeBrowserView {
  assembly: Assembly;
  gene?: string | undefined;
  location?: GenomeLocation | undefined;
  /** One base, such as chr1:877047. */
  variant?: GenomeLocation | undefined;
  /** The tool whose link opened the page, which the breadcrumbs name. */
  from?: GenomeSource | undefined;
}

/** The tools that link into the genome browser, each under its top bar category. */
const sources = {
  networks: [categoryCrumbs.genes, productTools.networks],
  modules: [categoryCrumbs.genes, productTools.modules],
  netwas: [categoryCrumbs.genes, productTools.netwas],
  'expression-effects': [categoryCrumbs.variants, productTools.expressionEffects],
} as const;

export type GenomeSource = keyof typeof sources;

const isSource = (value: string | null): value is GenomeSource => value !== null && Object.hasOwn(sources, value);

const position = /^((?:chr)?(?:[0-9]{1,2}|X|Y|M|MT)):([\d,]+)$/i;

function variantAt(text: string | null, assembly: Assembly): GenomeLocation | undefined {
  const place = position.exec(text?.replaceAll(/\s/g, '') ?? '');
  const parsed = place && GenomeLocation.parse(`${place[1]}:${place[2]}-${place[2]}`, assembly);
  return parsed instanceof GenomeLocation ? parsed.fit().location : undefined;
}

const href = (params: Record<string, string>, from?: GenomeSource): string | undefined => (genomeBrowserPreview ? `/genome/?${readableSearch(from ? { ...params, from } : params)}` : undefined);

/** Links into the genome browser page, and the view /genome/ reads back from them. Every link is undefined while the preview is off. */
export const genomeBrowserLink = {
  label: 'View in genome browser',
  /** A variant opens with this much of the genome around it, as variant results do. */
  variantWidth: 50_000,

  /** Where humanbase.io's /genome opens. */
  start: (assembly: Assembly): GenomeLocation => new GenomeLocation('chr1', 2_230_000, 2_440_000, assembly),

  gene: (symbol: string, from?: GenomeSource): string | undefined => href({ gene: symbol }, from),

  /** A variant, such as chr1:877047; the page centers on it and marks it. */
  variant: (chromosome: string, at: number, from?: GenomeSource): string | undefined => href({ location: `${GenomeLocation.at(chromosome, at).chrom}:${at}` }, from),

  /** The trail: the tool the link came from under its category, or Variants & sequences, where #457 places the page. */
  crumbs(view: GenomeBrowserView): Crumb[] {
    const [category, tool] = view.from ? sources[view.from] : [categoryCrumbs.variants];
    return [category, ...(tool ? [{ label: tool.label, href: tool.href }] : []), { label: 'Genome browser' }];
  },

  /** Reads ?gene=, ?location= (a range or one position), ?assembly= and ?from=, plus ?variant=, which the page keeps once the view moves. */
  read(query: URLSearchParams): GenomeBrowserView {
    const assembly: Assembly = query.get('assembly') === 'hg38' ? 'hg38' : 'hg19';
    const typed = query.get('location') ?? '';
    const from = query.get('from');
    const one = variantAt(typed, assembly);
    const range = GenomeLocation.parse(typed, assembly);
    return {
      assembly,
      gene: query.get('gene')?.trim() || undefined,
      location: range instanceof GenomeLocation ? range.fit().location : one?.withWidth(genomeBrowserLink.variantWidth),
      variant: one ?? variantAt(query.get('variant'), assembly),
      from: isSource(from) ? from : undefined,
    };
  },
} as const;
