// The Pages function's test lives here: Cloudflare would serve any file under functions/ as a route.
import { onRequest } from '../functions/api/[[path]]';

const forwarded = vi.fn<typeof fetch>();

beforeEach(() => {
  forwarded.mockReset().mockResolvedValue(new Response('{}'));
  vi.stubGlobal('fetch', forwarded);
});

afterEach(() => vi.unstubAllGlobals());

const sent = () => forwarded.mock.calls[0] as [URL, RequestInit];

describe('the /api Pages function', () => {
  it('forwards the path and query of a GET to the API, without a body or the host header', async () => {
    const request = new Request('https://humanbase-frontend.pages.dev/api/genes/3553/?organism=homo-sapiens', { headers: { host: 'humanbase-frontend.pages.dev', accept: 'application/json' } });
    await onRequest({ request, env: { HB_API_PROXY_TARGET: 'https://api.example.org/' } });
    const [target, init] = sent();
    expect(target.href).toBe('https://api.example.org/api/genes/3553/?organism=homo-sapiens');
    expect(init).toMatchObject({ method: 'GET', body: null, redirect: 'manual' });
    expect(new Headers(init.headers).get('host')).toBeNull();
    expect(new Headers(init.headers).get('accept')).toBe('application/json');
  });

  it('forwards the method and body of a POST', async () => {
    const request = new Request('https://humanbase-frontend.pages.dev/api/genes/search/multi/', { method: 'POST', body: '{"q":"IL1B"}' });
    await onRequest({ request, env: { HB_API_PROXY_TARGET: 'https://api.example.org' } });
    const [, init] = sent();
    expect(init.method).toBe('POST');
    expect(await new Response(init.body).text()).toBe('{"q":"IL1B"}');
  });

  it('falls back to the public API when the target is unset or empty', async () => {
    for (const env of [{}, { HB_API_PROXY_TARGET: '' }]) {
      forwarded.mockClear();
      await onRequest({ request: new Request('https://humanbase-frontend.pages.dev/api/integrations/'), env });
      expect(sent()[0].href).toBe('https://hb.flatironinstitute.org/api/integrations/');
    }
  });
});
