import { ApiClient } from './ApiClient';
import { ApiError } from './ApiError';

const jsonResponse = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

describe('ApiClient', () => {
  it('joins the base path and repeats array parameters', () => {
    const client = new ApiClient('/api/');
    expect(client.url('/integrations/global/network/', { entrez: [3553, 7124], giant_version: 'v1', prior: undefined })).toBe(
      '/api/integrations/global/network/?entrez=3553&entrez=7124&giant_version=v1',
    );
  });

  it('returns parsed JSON for a successful GET', async () => {
    const fetcher = vi.fn().mockResolvedValue(jsonResponse({ entrez: 3553 }));
    const client = new ApiClient('/api', fetcher);
    await expect(client.get('genes/3553/')).resolves.toEqual({ entrez: 3553 });
    expect(fetcher).toHaveBeenCalledWith('/api/genes/3553/', expect.objectContaining({ method: 'GET' }));
  });

  it('throws an ApiError that knows a missing record', async () => {
    const client = new ApiClient('/api', vi.fn().mockResolvedValue(jsonResponse({ detail: 'Not found.' }, 404)));
    const error = await client.get('genes/0/').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).isNotFound).toBe(true);
  });

  it('sends a JSON body with POST', async () => {
    const fetcher = vi.fn().mockResolvedValue(jsonResponse([]));
    await new ApiClient('/api', fetcher).post('integrations/relevant/', { entrez: [3553] });
    expect(fetcher.mock.calls[0]?.[1]).toMatchObject({ method: 'POST', body: '{"entrez":[3553]}' });
  });
});
