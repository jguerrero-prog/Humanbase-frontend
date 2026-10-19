export type MatchStatus = 'matched' | 'alias' | 'choose' | 'not-found';

export interface GeneCandidate {
  entrez: string;
  symbol: string;
  name: string;
  aliases?: readonly string[];
}

export interface GeneMatch {
  id: string;
  typed: readonly string[];
  status: MatchStatus;
  candidates: readonly GeneCandidate[];
  chosen?: string;
  matchedAlias?: string;
  edited?: boolean;
}

const problemOrder: Partial<Record<MatchStatus, number>> = { 'not-found': 0, choose: 1 };

export const statusLabels: Record<MatchStatus, string> = {
  matched: 'Matched',
  alias: 'Matched an alias',
  choose: 'Check the match',
  'not-found': 'Not found',
};

const plural = (count: number, one: string, many = `${one}s`) => `${count} ${count === 1 ? one : many}`;

export class GeneMatchList {
  readonly matches: readonly GeneMatch[];

  constructor(matches: readonly GeneMatch[]) {
    this.matches = GeneMatchList.merge(matches);
  }

  // A gene reached by two terms, such as a symbol and its alias, is listed once with both terms.
  private static merge(matches: readonly GeneMatch[]): GeneMatch[] {
    const merged: GeneMatch[] = [];
    const indexByGene = new Map<string, number>();
    for (const match of matches) {
      const gene = match.status === 'matched' || match.status === 'alias' ? match.candidates[0]?.entrez : undefined;
      const at = gene === undefined ? undefined : indexByGene.get(gene);
      const existing = at === undefined ? undefined : merged[at];
      if (at !== undefined && existing) {
        merged[at] = { ...existing, typed: [...existing.typed, ...match.typed] };
        continue;
      }
      if (gene !== undefined) indexByGene.set(gene, merged.length);
      merged.push(match);
    }
    return merged;
  }

  // Not found and terms to check come first; the rest keep the order they were typed.
  get ordered(): GeneMatch[] {
    return this.matches
      .map((match, index) => ({ match, index }))
      .sort((a, b) => (problemOrder[a.match.status] ?? 2) - (problemOrder[b.match.status] ?? 2) || a.index - b.index)
      .map(({ match }) => match);
  }

  get problems(): GeneMatch[] {
    return this.ordered.filter((match) => match.status === 'not-found' || match.status === 'choose');
  }

  get resolved(): GeneMatch[] {
    return this.ordered.filter((match) => match.status === 'matched' || match.status === 'alias');
  }

  count(status: MatchStatus): number {
    return this.matches.filter((match) => match.status === status).length;
  }

  get runnable(): number {
    return this.matches.length - this.count('not-found');
  }

  get summary(): string[] {
    const matched = this.count('matched') + this.count('alias');
    const aliases = this.count('alias');
    const toCheck = this.count('choose');
    const notFound = this.count('not-found');
    return [
      `${matched} matched${aliases ? `, ${aliases} through an alias` : ''}`,
      toCheck ? `${toCheck} to check` : 'None to check',
      notFound ? `${notFound} not found, left out` : 'None not found',
    ];
  }

  gene(match: GeneMatch): GeneCandidate | undefined {
    return match.candidates.find((candidate) => candidate.entrez === match.chosen) ?? match.candidates[0];
  }

  choose(id: string, entrez: string): GeneMatchList {
    return new GeneMatchList(this.matches.map((match) => (match.id === id ? { ...match, chosen: entrez } : match)));
  }

  replace(id: string, next: GeneMatch): GeneMatchList {
    return new GeneMatchList(this.matches.map((match) => (match.id === id ? next : match)));
  }

  remove(ids: Iterable<string>): GeneMatchList {
    const gone = new Set(ids);
    return new GeneMatchList(this.matches.filter((match) => !gone.has(match.id)));
  }

  toTsv(): string {
    const rows = this.ordered.map((match) => {
      const gene = match.status === 'not-found' ? undefined : this.gene(match);
      return [match.typed.join(', '), gene?.symbol ?? '', gene?.entrez ?? '', statusLabels[match.status]].join('\t');
    });
    return ['You typed\tSymbol\tEntrez ID\tStatus', ...rows].join('\n');
  }

  static pluralGenes(count: number): string {
    return plural(count, 'gene');
  }
}
