import { Humanbase } from '../Humanbase';
import { SampleClient } from '../sample/SampleClient';
import { Network, type NetworkRecord } from './Network';
import { NetworkQuery } from './NetworkQuery';
import { NetworkView } from './NetworkView';

const gene = (entrez: number, symbol: string, query = false) => ({ entrez, systematic_name: symbol, standard_name: symbol, description: `${symbol} protein`, aliases: [], xrefs: [], query });

// A and B are queried. C connects strongly to both; D connects to A but more strongly to E.
const record: NetworkRecord = {
  mincut: 0.4,
  genes: [gene(1, 'A', true), gene(2, 'B', true), gene(3, 'C'), gene(4, 'D'), gene(5, 'E')],
  edges: [
    { source: 0, target: 2, weight: 0.9 },
    { source: 1, target: 2, weight: 0.7 },
    { source: 0, target: 3, weight: 0.85 },
    { source: 3, target: 4, weight: 0.95 },
    { source: 0, target: 4, weight: 0.3 },
    { source: 0, target: 1, weight: 0.6 },
  ],
};

describe('Network', () => {
  const network = new Network(record);

  it('scores related genes by their average weight to the query genes', () => {
    expect(network.related().map((g) => [g.symbol, Number(g.score.toFixed(2))])).toEqual([
      ['D', 0.85],
      ['C', 0.8],
      ['E', 0.3],
    ]);
  });

  it('can rank by uniqueness: the score over the average weight of all the gene’s connections, query genes included', () => {
    expect(network.related(true).map((g) => [g.symbol, Number(g.uniqueness.toFixed(3))])).toEqual([
      ['C', 1],
      ['D', 0.944],
      ['E', 0.48],
    ]);
  });

  it('ranks query genes with the others, so one inside the chosen number takes a place', () => {
    expect(network.ranked().map((g) => g.symbol)).toEqual(['D', 'C', 'A', 'B', 'E']);
    const { genes, edges } = network.subset({ shown: 3, minConfidence: 0.65, prioritizeUniqueness: false });
    expect(genes.map((g) => g.symbol)).toEqual(['A', 'B', 'D', 'C']);
    expect(edges.map((e) => `${e.source.symbol}-${e.target.symbol}`)).toEqual(['A-C', 'B-C', 'A-D']);
  });

  it('keeps connections strictly above the cutoff and hides related genes left without one', () => {
    const { genes, edges } = network.subset({ shown: 5, minConfidence: 0.85, prioritizeUniqueness: false });
    expect(edges.map((e) => `${e.source.symbol}-${e.target.symbol}`)).toEqual(['A-C', 'D-E']);
    expect(genes.map((g) => g.symbol)).toEqual(['A', 'B', 'D', 'C', 'E']);
    const hiding = network.subset({ shown: 4, minConfidence: 0.85, prioritizeUniqueness: false });
    expect(hiding.genes.map((g) => g.symbol)).toEqual(['A', 'B', 'C']);
    expect(hiding.hidden).toBe(1);
  });

  it('ranks a lone query gene first, as humanbase.io does', () => {
    const lone = new Network({ ...record, genes: record.genes.map((g) => ({ ...g, query: g.entrez === 1 })) });
    expect(lone.ranked(true)[0]?.symbol).toBe('A');
    expect(lone.subset({ shown: 2, minConfidence: 0.5, prioritizeUniqueness: false }).genes.map((g) => g.symbol)).toEqual(['A', 'C']);
  });

  it('names requested genes the network left out', () => {
    expect(network.missing([1, 2, 99])).toEqual([99]);
  });

  it('finds the connection between two genes in either order', () => {
    expect(network.edgeBetween(4, 1)?.weight).toBe(0.85);
  });

  it('falls back to a middle cutoff when the API suggests none', () => {
    expect(new Network({ ...record, mincut: null }).suggestedConfidence).toBe(Network.fallbackConfidence);
  });
});

describe('NetworkQuery', () => {
  it('requests the global network of the chosen version when no tissue is set', () => {
    expect(new NetworkQuery([3553]).slug).toBe('global-v3');
    expect(new NetworkQuery([3553], undefined, 'v1').slug).toBe('global');
    expect(new NetworkQuery([3553], 'kidney-v3', 'v3').slug).toBe('kidney-v3');
  });

  it('keeps data types in the URL', () => {
    const query = NetworkQuery.fromSearch(new URLSearchParams('entrez=3553&datatype=co-expression&datatype=interaction'));
    expect(query.dataTypes).toEqual(['co-expression', 'interaction']);
    expect(query.toSearch().getAll('datatype')).toEqual(['co-expression', 'interaction']);
  });
});

describe('NetworkView', () => {
  it('reads filters and the selection from the URL, ignoring values out of range', () => {
    const view = NetworkView.fromSearch(new URLSearchParams('shown=30&confidence=0.7&unique=1&gene=3554'));
    expect(view).toMatchObject({ shown: 30, minConfidence: 0.7, prioritizeUniqueness: true, selection: { kind: 'gene', entrez: 3554 } });
    expect(NetworkView.fromSearch(new URLSearchParams('shown=500&confidence=4')).shown).toBe(NetworkView.defaultShown);
  });

  it('starts at the network’s suggested cutoff until the slider moves', () => {
    expect(new NetworkView().options(0.48).minConfidence).toBe(0.48);
    expect(new NetworkView(15, 0.6).options(0.48).minConfidence).toBe(0.6);
  });

  it('writes only what differs from the defaults, next to the request', () => {
    const search = new NetworkView().with({ selection: { kind: 'connection', source: 3553, target: 7124 } }).applyTo(new URLSearchParams('entrez=3553&shown=20'));
    expect(search.toString()).toBe('entrez=3553&connection=3553-7124');
  });
});

describe('NetworkService with the API off', () => {
  const api = new Humanbase(SampleClient.bundled());

  it('loads IL1B and TNF from the samples, whatever order the genes were chosen in', async () => {
    const network = await api.networks.get(new NetworkQuery([7124, 3553]));
    expect(network.queryGenes.map((g) => g.symbol).sort()).toEqual(['IL1B', 'TNF']);
    expect(network.related().length).toBe(50);
  });

  it('reports a gene that is in no network as not found', async () => {
    await expect(api.networks.get(new NetworkQuery([100188314]))).rejects.toMatchObject({ status: 404 });
  });

  it('lists GIANT data types and none for MAGE', async () => {
    expect((await api.networks.dataTypes('v1')).map((t) => t.title)).toContain('Co-expression');
    expect(await api.networks.dataTypes('v3')).toEqual([]);
  });
});
