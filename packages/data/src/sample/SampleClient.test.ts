import { ApiError } from '../ApiError';
import { Humanbase } from '../Humanbase';
import { SampleClient } from './SampleClient';
import { sampleKey } from './sampleKey';

describe('sampleKey', () => {
  it('matches the path however it is written and sorts the query', () => {
    expect(sampleKey('GET', '/api/genes/3553/')).toBe('genes/3553');
    expect(sampleKey('GET', 'genes/3553')).toBe('genes/3553');
    expect(sampleKey('GET', 'integrations/', { b: 2, a: [1, 3], skip: undefined })).toBe('integrations@a=1&a=3&b=2');
  });

  it('tells POST bodies apart', () => {
    const one = sampleKey('POST', 'integrations/relevant/', {}, { entrez: [3553] });
    expect(one).toMatch(/^integrations\/relevant@post-[0-9a-f]{8}$/);
    expect(sampleKey('POST', 'integrations/relevant/', {}, { entrez: [7124] })).not.toBe(one);
  });
});

describe('SampleClient', () => {
  const client = new SampleClient({
    'genes/3553': () => Promise.resolve({ status: 200, body: { entrez: 3553 } }),
    'genes/0': () => Promise.resolve({ status: 404, body: null }),
  });

  it('answers from the recorded response', async () => {
    await expect(client.get('/genes/3553/')).resolves.toEqual({ entrez: 3553 });
  });

  it('replays a recorded error', async () => {
    const error = await client.get('genes/0/').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).isNotFound).toBe(true);
  });

  it('treats a request with no sample as not found', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    await expect(client.get('genes/1/')).rejects.toMatchObject({ status: 404 });
  });
});

describe('the API switch', () => {
  afterEach(() => vi.restoreAllMocks());

  it('makes no request when the API is off', async () => {
    const fetch = vi.spyOn(globalThis, 'fetch');
    const humanbase = Humanbase.fromConfig({ api: false, apiBase: '/api' });
    const gene = await humanbase.genes.get(3553);
    expect(gene.symbol).toBe('IL1B');
    expect(humanbase.showsSamples).toBe(true);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('uses the API when it is on', () => {
    expect(Humanbase.fromConfig({ api: true, apiBase: '/api' }).showsSamples).toBe(false);
  });
});
