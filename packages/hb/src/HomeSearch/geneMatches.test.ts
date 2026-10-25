import { GeneHit, type TermMatches } from '@humanbase/data';
import { GeneMatchList } from '@humanbase/ui';
import { hitsOf, matchOf, splitByVersion, suggestionOf } from './geneMatches';

const gene = (symbol: string, aliases: string, entrez = 1, versions = ['v1']) =>
  new GeneHit({ entrez, standard_name: symbol, aliases, description: `${symbol} gene`, versions_available: versions });

describe('matchOf', () => {
  it('reads a single symbol hit as matched and an alias hit as matched an alias', () => {
    expect(matchOf({ typed: 'IL1B', genes: [gene('IL1B', 'IL1F2')] }).status).toBe('matched');
    expect(matchOf({ typed: 'p53', genes: [gene('TP53', 'P53|LFS1')] })).toMatchObject({ status: 'alias', matchedAlias: 'P53' });
  });

  it('asks to check a term that matched several genes and lists a term with none as not found', () => {
    expect(matchOf({ typed: 'IL1', genes: [gene('IL1A', '', 1), gene('IL1B', '', 2)] }).status).toBe('choose');
    expect(matchOf({ typed: 'NOTAGENE123', genes: [] }).status).toBe('not-found');
  });
});

describe('suggestionOf', () => {
  it('says which alias matched what was typed', () => {
    expect(suggestionOf(gene('CASP1', 'P45|ICE|IL1BC', 834), 'IL1B').details).toBe('Entrez 834. Matched on its alias IL1BC. Also known as P45, ICE');
    expect(suggestionOf(gene('IL1B', 'IL1F2|IL1beta|IL-1|IL1-BETA', 3553), 'IL1B').details).toBe('Entrez 3553. Also known as IL1F2, IL1beta, IL-1, IL1-BETA');
  });
});

describe('splitByVersion', () => {
  const terms: TermMatches[] = [
    { typed: 'IL1B', genes: [gene('IL1B', '', 3553, ['v1', 'v3'])] },
    { typed: 'IL-1', genes: [gene('IL1B', '', 3553, ['v1', 'v3']), gene('IL1A', '', 3552, ['v1'])] },
    { typed: 'AUTS12', genes: [gene('AUTS12', '', 100188314, [])] },
    { typed: 'TNF', genes: [gene('TNF', '', 7124, ['v1'])] },
  ];
  const list = new GeneMatchList(terms.map(matchOf));
  const resolved = list.matches.filter((match) => match.status !== 'not-found');

  it('keeps genes in the version once, taking the first candidate of a term to check until another is chosen', () => {
    const split = splitByVersion(list, resolved, hitsOf(terms), 'v3');
    expect(split.entrez).toEqual([3553]);
    expect(split.outsideGenes.map((hit) => hit.symbol)).toEqual(['AUTS12', 'TNF']);
  });

  it('uses the chosen candidate of a term to check', () => {
    const chosen = list.choose('term-il-1', '3552');
    const split = splitByVersion(chosen, chosen.matches, hitsOf(terms), 'v1');
    expect(split.entrez).toEqual([3553, 3552, 7124]);
    expect(split.outsideGenes.map((hit) => hit.symbol)).toEqual(['AUTS12']);
  });
});
