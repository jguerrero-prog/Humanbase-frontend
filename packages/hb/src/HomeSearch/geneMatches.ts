import type { GeneHit, TermMatches } from '@humanbase/data';
import type { GeneCandidate, GeneMatch, SearchSuggestion } from '@humanbase/ui';

const shownAliases = 4;

export function candidateOf(gene: GeneHit): GeneCandidate {
  return { entrez: String(gene.entrez), symbol: gene.symbol, name: gene.name, aliases: gene.aliases };
}

/** One row of How your genes matched for a typed term and what gene search found for it. */
export function matchOf({ typed, genes }: TermMatches): GeneMatch {
  const id = `term-${typed.toLowerCase()}`;
  const [only] = genes;
  if (!only) return { id, typed: [typed], status: 'not-found', candidates: [] };
  if (genes.length > 1) return { id, typed: [typed], status: 'choose', candidates: genes.map(candidateOf) };
  const alias = only.matchedAlias(typed);
  return alias ? { id, typed: [typed], status: 'alias', candidates: [candidateOf(only)], matchedAlias: alias } : { id, typed: [typed], status: 'matched', candidates: [candidateOf(only)] };
}

/** The alias that starts with what was typed, when the symbol doesn't. */
function aliasStartingWith(gene: GeneHit, text: string): string | undefined {
  const term = text.trim().toLowerCase();
  if (gene.symbol.toLowerCase().startsWith(term)) return undefined;
  return gene.aliases.find((alias) => alias.toLowerCase().startsWith(term));
}

export function suggestionOf(gene: GeneHit, text: string): SearchSuggestion {
  const alias = aliasStartingWith(gene, text);
  const others = gene.aliases.filter((name) => name !== alias).slice(0, shownAliases);
  const details = [`Entrez ${gene.entrez}.`, alias && `Matched on its alias ${alias}.`, others.length > 0 && `Also known as ${others.join(', ')}`].filter(Boolean).join(' ');
  return { id: String(gene.entrez), label: gene.symbol, description: gene.name, details };
}
