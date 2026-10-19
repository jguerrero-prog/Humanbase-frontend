import { GeneHit } from '@humanbase/data';
import { matchOf, suggestionOf } from './geneMatches';

const gene = (symbol: string, aliases: string, entrez = 1) =>
  new GeneHit({ entrez, standard_name: symbol, aliases, description: `${symbol} gene`, versions_available: ['v1'] });

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
