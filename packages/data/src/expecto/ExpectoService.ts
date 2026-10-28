import type { DataClient, Query } from '../DataClient';
import { TissueVariants, type TissueDatabase, type TissueVariantsRecord } from './TissueVariants';

export type VariantQuery = { kind: 'gene'; symbol: string } | { kind: 'rsid'; rsid: string } | { kind: 'position'; chromosome: string; position: number };

interface VariantRecord {
  rsid: string;
  chromosome: string;
  position: number;
  ref_allele: string;
  alt_allele: string;
  gene: { entrez: number; standard_name: string | null; systematic_name: string } | null;
}

interface VariantPage {
  count: number;
  next: string | null;
  results: readonly VariantRecord[];
}

export interface ScoredVariant {
  rsid: string;
  chromosome: string;
  position: number;
  change: string;
  gene?: { entrez: number; symbol: string } | undefined;
}

const version = 'v1';
// Gene, rsID and position searches return a few pages at most; this stops a runaway query.
const pageLimit = 25;

/** ExPecto's precomputed predictions: a gene's effects by tissue, and the variants with the strongest effects. */
export class ExpectoService {
  constructor(private readonly client: DataClient) {}

  /** Reads text typed in the SNP rsID search: an rsID, a position such as chr1:877047, or a gene symbol. */
  static parse(text: string): VariantQuery | undefined {
    const typed = text.trim().replace(/,/g, '');
    if (!typed) return undefined;
    if (/^rs\d+$/i.test(typed)) return { kind: 'rsid', rsid: typed.toLowerCase() };
    const place = /^(?:chr)?([0-9]{1,2}|X|Y|M):(\d+)$/i.exec(typed);
    if (place?.[1] && place[2]) return { kind: 'position', chromosome: `chr${place[1].toUpperCase()}`, position: Number(place[2]) };
    if (/^[A-Za-z0-9][\w.-]*$/.test(typed)) return { kind: 'gene', symbol: typed.toUpperCase() };
    return undefined;
  }

  async tissueVariants(entrez: number, database: TissueDatabase, signal?: AbortSignal): Promise<TissueVariants> {
    return new TissueVariants(await this.client.get<TissueVariantsRecord>(`genes/${entrez}/tissue_variants/`, { database, collapse: true }, signal));
  }

  /** How many variants ExPecto lists, for the tab's lead. */
  async variantTotal(): Promise<number> {
    return (await this.client.get<VariantPage>('variants/', { version, page: 1 })).count;
  }

  /** Every variant matching the query. A gene search keeps only that gene, since the API matches the start of the symbol. */
  async searchVariants(query: VariantQuery, signal?: AbortSignal): Promise<ScoredVariant[]> {
    const filter: Query =
      query.kind === 'gene'
        ? { gene__standard_name__istartswith: query.symbol }
        : query.kind === 'rsid'
          ? { rsid: query.rsid }
          : { chromosome: query.chromosome, position__gte: query.position, position__lte: query.position };
    const rows: VariantRecord[] = [];
    for (let page = 1; page <= pageLimit; page++) {
      const answer = await this.client.get<VariantPage>('variants/', { version, ...filter, page }, signal);
      rows.push(...answer.results);
      if (!answer.next) break;
    }
    const variants = rows.map(toVariant);
    return query.kind === 'gene' ? variants.filter((variant) => variant.gene?.symbol.toUpperCase() === query.symbol) : variants;
  }
}

function toVariant(record: VariantRecord): ScoredVariant {
  const symbol = record.gene && (record.gene.standard_name ?? record.gene.systematic_name);
  return {
    rsid: record.rsid,
    chromosome: record.chromosome,
    position: record.position,
    change: `${record.ref_allele}>${record.alt_allele}`,
    gene: record.gene && symbol ? { entrez: record.gene.entrez, symbol } : undefined,
  };
}
