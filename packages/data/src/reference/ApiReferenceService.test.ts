import { ApiError, SampleMissingError } from '../ApiError';
import type { DataClient, Query } from '../DataClient';
import { ApiReferenceService } from './ApiReferenceService';

class FakeClient implements DataClient {
  readonly calls: unknown[][] = [];

  constructor(private readonly answer: () => Promise<unknown>) {}

  get<T>(path: string, query?: Query): Promise<T> {
    this.calls.push(['GET', path, query]);
    return this.answer() as Promise<T>;
  }

  post<T>(path: string, body: unknown, query?: Query): Promise<T> {
    this.calls.push(['POST', path, body, query]);
    return this.answer() as Promise<T>;
  }

  text(): Promise<string> {
    return Promise.reject(new Error('not used'));
  }
}

describe('ApiReferenceService.send', () => {
  it('sends a GET with its query and a POST with its body, and returns the answer', async () => {
    const client = new FakeClient(() => Promise.resolve({ count: 1 }));
    const service = new ApiReferenceService(client);
    expect(await service.send({ method: 'GET', route: 'genes/', query: { title: 'IL1B' } })).toEqual({ ok: true, body: { count: 1 } });
    expect(await service.send({ method: 'POST', route: 'genes/check/', query: {}, body: { genes: ['IL1B'] } })).toEqual({ ok: true, body: { count: 1 } });
    expect(client.calls).toEqual([
      ['GET', 'genes/', { title: 'IL1B' }],
      ['POST', 'genes/check/', { genes: ['IL1B'] }, {}],
    ]);
  });

  it('keeps an API error’s status and body to show instead of throwing', async () => {
    const service = new ApiReferenceService(new FakeClient(() => Promise.reject(new ApiError(400, 'genes/', { title: ['Required.'] }))));
    expect(await service.send({ method: 'GET', route: 'genes/', query: {} })).toEqual({ ok: false, status: 400, body: { title: ['Required.'] }, sampleMissing: false });
  });

  it('says when no sample was recorded for the request', async () => {
    const service = new ApiReferenceService(new FakeClient(() => Promise.reject(new SampleMissingError('genes/'))));
    expect(await service.send({ method: 'GET', route: 'genes/', query: {} })).toEqual({ ok: false, status: 404, body: null, sampleMissing: true });
  });

  it('throws errors that aren’t from the API', async () => {
    const service = new ApiReferenceService(new FakeClient(() => Promise.reject(new TypeError('offline'))));
    await expect(service.send({ method: 'GET', route: 'genes/', query: {} })).rejects.toThrow('offline');
  });
});
