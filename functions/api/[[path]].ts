// Cloudflare Pages Function: forwards /api/* to the Humanbase API, as the dev server's proxy does.
interface Context {
  request: Request;
  env: { HB_API_PROXY_TARGET?: string };
}

const publicApi = 'https://hb.flatironinstitute.org';

export async function onRequest({ request, env }: Context): Promise<Response> {
  const incoming = new URL(request.url);
  const target = new URL(incoming.pathname + incoming.search, env.HB_API_PROXY_TARGET ?? publicApi);
  const headers = new Headers(request.headers);
  headers.delete('host');
  return fetch(target, {
    method: request.method,
    headers,
    body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
    redirect: 'manual',
  });
}
