import { ApiError } from '../ApiError';
import { Humanbase } from '../Humanbase';
import { SampleClient } from '../sample/SampleClient';
import { GeneSearchService } from './GeneSearchService';

const samples = () => new Humanbase(SampleClient.bundled());

describe('GeneSearchService', () => {
  it('suggests genes while typing, with the networks each one is in', async () => {
    const [first] = await samples().search.suggest('IL1B');
    expect(first?.symbol).toBe('IL1B');
    expect(first?.aliases).toContain('IL1F2');
    expect(first?.isInVersion('v1')).toBe(true);
  });

  it('returns no suggestions for an unknown symbol', async () => {
    await expect(samples().search.suggest('NOTAGENE123')).resolves.toEqual([]);
  });

  it('reads a missing recording as no match, but lets other failures through', async () => {
    await expect(samples().search.suggest('NOTRECORDED')).resolves.toEqual([]);
    const failing = { get: vi.fn().mockRejectedValue(new ApiError(502, 'genes/search/partial/')), post: vi.fn(), text: vi.fn() };
    await expect(new GeneSearchService(failing).suggest('IL1B')).rejects.toThrow(ApiError);
  });

  it('matches a pasted list term by term', async () => {
    const terms = GeneSearchService.terms('IL1B, TNF\nAUTS12;NOTAGENE123  p53');
    const matches = await samples().search.list(terms);
    expect(matches.map((match) => [match.typed, match.genes.map((gene) => gene.symbol)])).toEqual([
      ['IL1B', ['IL1B']],
      ['TNF', ['TNF']],
      ['AUTS12', ['AUTS12']],
      ['NOTAGENE123', []],
      ['p53', ['TP53']],
    ]);
    const auts12 = matches[2]?.genes[0];
    expect(auts12?.isInAnyNetwork).toBe(false);
    expect(matches[4]?.genes[0]?.matchedAlias('p53')).toBe('P53');
  });

  it('posts a list too long for a URL', async () => {
    const client = { get: vi.fn(), post: vi.fn().mockResolvedValue([]), text: vi.fn() };
    await new GeneSearchService(client).list(Array.from({ length: 400 }, (_, i) => `GENE${i}`));
    expect(client.get).not.toHaveBeenCalled();
    expect(client.post).toHaveBeenCalledWith('genes/search/multi/', { q: expect.stringMatching(/^GENE0\+GENE1\+/) }, { organism: 'homo-sapiens' });
  });
});

describe('IntegrationService', () => {
  it('lists tissue networks for each data version', async () => {
    const { IntegrationService } = await import('../networks/IntegrationService');
    const networks = await samples().integrations.list();
    const giant = IntegrationService.pick(networks, 'tissue', 'v1');
    const mage = IntegrationService.pick(networks, 'tissue', 'v3');
    expect(giant.map((network) => network.slug)).toContain('blood-vessel');
    expect(mage.every((network) => network.version === 'v3')).toBe(true);
    expect(IntegrationService.pick(networks, 'global', 'v1').map((network) => network.slug)).toEqual(['global']);
    expect(IntegrationService.pick(networks, 'process', 'v1').length).toBeGreaterThan(100);
  });
});
