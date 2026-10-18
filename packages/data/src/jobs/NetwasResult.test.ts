import { NetwasResult } from './NetwasResult';

const file = `# Job id: d7732f19-916d-4458-97b5-936b8d6345cb
# Tissue: adipose tissue
# P-value threshold: 0.01
EMP1\t-1\t0.541169
KRT6B\t-1\t0.561327
LEP\t1\t0.42
ZNF1\t0\t-0.2
`;

describe('NetwasResult', () => {
  const result = NetwasResult.parse(file);

  it('reads the header fields', () => {
    expect(result.header.get('Tissue')).toBe('adipose tissue');
    expect(result.header.get('P-value threshold')).toBe('0.01');
  });

  it('ranks genes by score, highest first', () => {
    expect(result.genes.map((gene) => [gene.rank, gene.symbol])).toEqual([
      [1, 'KRT6B'],
      [2, 'EMP1'],
      [3, 'LEP'],
      [4, 'ZNF1'],
    ]);
  });

  it('filters without renumbering ranks', () => {
    expect(result.filter('candidates').map((gene) => gene.rank)).toEqual([1, 2]);
    expect(result.filter('hits').map((gene) => gene.symbol)).toEqual(['LEP']);
    expect(result.filter('all')).toHaveLength(4);
  });

  it('names training labels in words', () => {
    expect(NetwasResult.labelText(-1)).toBe('Not significant');
    expect(NetwasResult.labelText(0)).toBe('Not used');
  });
});
