import { ApiError, SampleMissingError } from '../ApiError';
import { Humanbase } from '../Humanbase';
import { SampleClient } from './SampleClient';
import { sampleKey } from './sampleKey';

describe('sampleKey', () => {
  it('matches the path however it is written and sorts the query', () => {
    expect(sampleKey('GET', '/api/genes/3553/')).toBe('genes/3553');
    expect(sampleKey('GET', 'genes/3553')).toBe('genes/3553');
    expect(sampleKey('GET', 'integrations/', { b: 2, a: [1, 3], skip: undefined })).toBe('integrations@a=1&a=3&b=2');
  });

  it('hashes a query too long for a file name', () => {
    const entrez = Array.from({ length: 52 }, (_, i) => 1000 + i);
    expect(sampleKey('GET', 'terms/annotated/', { entrez, database: 'gene-ontology-bp' })).toMatch(/^terms\/annotated@query-[0-9a-f]{8}$/);
  });

  it('tells POST bodies apart', () => {
    const one = sampleKey('POST', 'integrations/relevant/', {}, { entrez: [3553] });
    expect(one).toMatch(/^integrations\/relevant@post-[0-9a-f]{8}$/);
    expect(sampleKey('POST', 'integrations/relevant/', {}, { entrez: [7124] })).not.toBe(one);
  });
});

describe('SampleClient', () => {
  it('tells a request with no recorded sample from a recorded not-found answer', async () => {
    const client = new SampleClient({ 'genes/1': async () => ({ status: 404, body: { detail: 'Not found.' } }) });
    const missing = await client.get('genes/2').catch((error: unknown) => error);
    expect(missing).toBeInstanceOf(SampleMissingError);
    expect((missing as ApiError).isNotFound).toBe(true);
    const recorded = await client.get('genes/1').catch((error: unknown) => error);
    expect(recorded).toBeInstanceOf(ApiError);
    expect(recorded).not.toBeInstanceOf(SampleMissingError);
  });

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

  it('rejects a request already cancelled', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(client.get('genes/3553/', {}, controller.signal)).rejects.toMatchObject({ name: 'AbortError' });
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
    expect(humanbase.examplesOnly).toBe(true);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('uses the API when it is on', () => {
    expect(Humanbase.fromConfig({ api: true, apiBase: '/api' }).examplesOnly).toBe(false);
  });
});
