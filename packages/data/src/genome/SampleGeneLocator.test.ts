import { SampleClient } from '../sample/SampleClient';
import { SampleGeneLocator } from './SampleGeneLocator';

describe('SampleGeneLocator', () => {
  const client = SampleClient.bundled();
  const locator = new SampleGeneLocator(client);

  beforeEach(() => vi.spyOn(console, 'warn').mockImplementation(() => undefined));
  afterEach(() => vi.restoreAllMocks());

  it('reads hg19 spans by name, whatever the case', async () => {
    expect(await locator.locate(' chd8 ')).toEqual(await locator.locate('CHD8', 'hg19'));
    expect((await locator.locate('CHD8'))?.chrom).toBe('chr14');
  });

  it('keeps each assembly’s spans apart, so an hg19 span never answers an hg38 search', async () => {
    const get = vi.spyOn(client, 'get');
    expect(await locator.locate('CHD8', 'hg38')).toBeUndefined();
    expect(get).toHaveBeenCalledWith('genome/genes/hg38/chd8');
  });
});
