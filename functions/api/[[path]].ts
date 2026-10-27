// Cloudflare Pages Function: forwards /api/* to the Humanbase API, as the dev server's proxy does.
import { apiOrigin } from '../../packages/data/src/origins';

interface Context {
  request: Request;
  env: { HB_API_PROXY_TARGET?: string };
}

export async function onRequest({ request, env }: Context): Promise<Response> {
  const incoming = new URL(request.url);
  const target = new URL(incoming.pathname + incoming.search, apiOrigin(env.HB_API_PROXY_TARGET));
  const headers = new Headers(request.headers);
  headers.delete('host');
  return fetch(target, {
    method: request.method,
    headers,
    body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
    redirect: 'manual',
  });
}
