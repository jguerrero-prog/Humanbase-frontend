import { GeneMatchList, type GeneMatch } from './GeneMatchList';

const il1b = { entrez: '3553', symbol: 'IL1B', name: 'interleukin 1 beta' };
const tp53 = { entrez: '7157', symbol: 'TP53', name: 'tumor protein p53', aliases: ['TRP53', 'P53'] };
const matches: GeneMatch[] = [
  { id: 'IL1B', typed: ['IL1B'], status: 'matched', candidates: [il1b] },
  { id: 'p53', typed: ['p53'], status: 'alias', candidates: [tp53], matchedAlias: 'P53' },
  {
    id: 'AUTS2',
    typed: ['AUTS2'],
    status: 'choose',
    candidates: [
      { entrez: '26053', symbol: 'AUTS2', name: 'activator of transcription and developmental regulator AUTS2' },
      { entrez: '100124700', symbol: 'AUTS8', name: 'autism, susceptibility to, 8' },
    ],
  },
  { id: 'FOOBAR1', typed: ['FOOBAR1'], status: 'not-found', candidates: [] },
  { id: 'IL-1', typed: ['IL-1'], status: 'alias', candidates: [il1b], matchedAlias: 'IL-1' },
];

describe('GeneMatchList', () => {
  const list = new GeneMatchList(matches);

  it('lists a gene reached by two terms once, with both terms', () => {
    expect(list.matches).toHaveLength(4);
    expect(list.matches[0]?.typed).toEqual(['IL1B', 'IL-1']);
  });

  it('puts not found and terms to check first, then keeps the typed order', () => {
    expect(list.ordered.map((match) => match.id)).toEqual(['FOOBAR1', 'AUTS2', 'IL1B', 'p53']);
  });

  it('counts the genes that will run and summarizes the matches', () => {
    expect(list.runnable).toBe(3);
    expect(list.summary).toEqual(['2 matched, 1 through an alias', '1 to check', '1 not found, left out']);
  });

  it('picks the first candidate until another is chosen', () => {
    const auts2 = list.matches[2];
    expect(auts2 && list.gene(auts2)?.symbol).toBe('AUTS2');
    const chosen = list.choose('AUTS2', '100124700').matches[2];
    expect(chosen && list.gene(chosen)?.symbol).toBe('AUTS8');
  });

  it('removes rows and writes every row to the TSV', () => {
    expect(list.remove(['FOOBAR1']).count('not-found')).toBe(0);
    expect(list.toTsv().split('\n')).toEqual([
      'You typed\tSymbol\tEntrez ID\tStatus',
      'FOOBAR1\t\t\tNot found',
      'AUTS2\tAUTS2\t26053\tCheck the match',
      'IL1B, IL-1\tIL1B\t3553\tMatched',
      'p53\tTP53\t7157\tMatched an alias',
    ]);
  });
});
