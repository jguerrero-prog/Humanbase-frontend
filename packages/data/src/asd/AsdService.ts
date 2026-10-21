import type { DataClient, Query } from '../DataClient';
import type { FeaturePredictionRecord, FeaturesRecord } from '../deepsea/DeepseaResult';
import { GenomeLocation } from '../genome/GenomeLocation';
import type { GeneLocator } from '../genome/S3GeneLocator';
import { AsdVariant, type AsdRecord, type AsdVariantRow } from './AsdVariant';

// Not in the schema; this is what GET /api/variants/?labels__name=asd returns.
interface AsdPageRecord {
  count: number;
  next: string | null;
  results: AsdRecord[];
}

export interface AsdPage {
  total: number;
  rows: AsdVariantRow[];
}

export type AsdFeatureSet = 'dna' | 'rna';

/** Limits the variants to a range, or to a whole chromosome such as chr1. */
export type AsdWhere = GenomeLocation | string;

const predictionSets: Record<AsdFeatureSet, string> = { dna: 'DNA_Binding', rna: 'RNA_Binding' };

/** The ASD Browser's variants, their columns and their predicted effects, by page or by genome range. */
export class AsdService {
  /** The API always pages by 20. */
  static readonly apiPageSize = 20;
  /** The most variants read for one browser view, so a wide range stays quick. */
  static readonly rangeLimit = 200;

  constructor(
    private readonly client: DataClient,
    private readonly locator: GeneLocator,
  ) {}

  private query(page: number, where?: AsdWhere): Query {
    const range = where instanceof GenomeLocation ? where : undefined;
    const chromosome = range?.chrom ?? (typeof where === 'string' ? where : undefined);
    return { labels__name: 'asd', page, ...(chromosome && { chromosome }), ...(range && { position__gte: range.start, position__lte: range.end }) };
  }

  /** One table page of any size, read from the API's pages of 20 that cover it. */
  async page(page: number, size: number, where?: AsdWhere): Promise<AsdPage> {
    const first = (page - 1) * size;
    const from = Math.floor(first / AsdService.apiPageSize) + 1;
    const to = Math.floor((first + size - 1) / AsdService.apiPageSize) + 1;
    const head = await this.client.get<AsdPageRecord>('variants/', this.query(from, where));
    // A page past the last one is a 404, so only pages the total says exist are read.
    const last = Math.min(to, Math.ceil(head.count / AsdService.apiPageSize));
    const rest = await Promise.all(Array.from({ length: Math.max(0, last - from) }, (_, index) => this.client.get<AsdPageRecord>('variants/', this.query(from + index + 1, where))));
    const pages = [head, ...rest];
    const rows = pages.flatMap((one) => one.results.map(AsdVariant.fromRecord));
    const skip = first - (from - 1) * AsdService.apiPageSize;
    return { total: pages[0]?.count ?? 0, rows: rows.slice(skip, skip + size) };
  }

  /** Every variant in a range, up to rangeLimit, in genome order. */
  async inRange(range: GenomeLocation): Promise<AsdVariantRow[]> {
    const rows: AsdVariantRow[] = [];
    for (let page = 1; rows.length < AsdService.rangeLimit; page += 1) {
      const one = await this.client.get<AsdPageRecord>('variants/', this.query(page, range));
      rows.push(...one.results.map(AsdVariant.fromRecord));
      if (!one.next) break;
    }
    return rows.sort((a, b) => a.position - b.position);
  }

  /** Every column the data has, by name; the table shows some and offers the rest under Columns. */
  async columns(): Promise<string[]> {
    const records = await this.client.get<{ name: string }[]>('variants/features/', { label: 'asd' });
    return records.map((record) => record.name);
  }

  /** Predicted effects on every DNA or RNA feature for each variant in a range. */
  predictions(range: GenomeLocation, set: AsdFeatureSet): Promise<FeaturePredictionRecord[]> {
    return this.client.get<FeaturePredictionRecord[]>(`deepsea/${predictionSets[set]}/feature_predictions/`, { chr_and_variant_range: range.variantRange });
  }

  features(set: AsdFeatureSet): Promise<FeaturesRecord> {
    return this.client.get<FeaturesRecord>(`deepsea/${predictionSets[set]}/features/`);
  }

  /** Reads a search as a range, a position (shown at 2 kb) or a gene; undefined when nothing matches. */
  async find(text: string): Promise<{ location: GenomeLocation; gene?: string } | undefined> {
    const position = /^(?:chr)?([0-9]{1,2}|X|Y):([\d,]+)$/i.exec(text.trim().replace(/\s+/g, ''));
    if (position) {
      const [, chrom = '', at = ''] = position;
      const center = Number(at.replaceAll(',', ''));
      return { location: new GenomeLocation(`chr${chrom.toUpperCase()}`, center, center).withWidth(2_000) };
    }
    const parsed = GenomeLocation.parse(text);
    if (!parsed) return undefined;
    if (parsed instanceof GenomeLocation) return { location: parsed };
    const span = await this.locator.locate(parsed.gene);
    return span && { location: new GenomeLocation(span.chrom, span.start, span.end), gene: parsed.gene.toUpperCase() };
  }
}
