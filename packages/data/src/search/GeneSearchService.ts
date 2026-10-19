import type { DataClient } from '../DataClient';
import { GeneHit, type GeneHitRecord } from '../genes/GeneHit';

interface ListRecord {
  query: string;
  matches: readonly GeneHitRecord[];
}

export interface TermMatches {
  typed: string;
  genes: GeneHit[];
}

const organism = 'homo-sapiens';
// The live site switches to POST when the URL would get this long.
const longestUrlQuery = 1800;

export class GeneSearchService {
  constructor(private readonly client: DataClient) {}

  /** Genes whose symbol, alias or name starts with the text, for suggestions while typing. */
  async suggest(text: string): Promise<GeneHit[]> {
    const records = await this.client.get<GeneHitRecord[]>('genes/search/partial/', { organism, q: text.trim() });
    return records.map((record) => new GeneHit(record));
  }

  async exact(symbol: string): Promise<GeneHit[]> {
    const records = await this.client.get<GeneHitRecord[]>('genes/search/exact/', { organism, q: symbol.trim() });
    return records.map((record) => new GeneHit(record));
  }

  /** Matches every term of a pasted or typed list in one request. */
  async list(terms: readonly string[]): Promise<TermMatches[]> {
    const q = terms.map((term) => term.trim()).filter(Boolean).join(' ');
    if (!q) return [];
    const records =
      q.length < longestUrlQuery
        ? await this.client.get<ListRecord[]>('genes/search/multi/', { organism, q })
        : await this.client.post<ListRecord[]>('genes/search/multi/', { q: q.replaceAll(' ', '+') }, { organism });
    return records.map((record) => ({ typed: record.query, genes: record.matches.map((match) => new GeneHit(match)) }));
  }

  /** Splits pasted text into terms: spaces, commas, semicolons and new lines all separate genes. */
  static terms(text: string): string[] {
    return text.split(/[\s,;]+/).filter(Boolean);
  }
}
