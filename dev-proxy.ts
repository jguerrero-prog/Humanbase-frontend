import { apiOrigin } from './packages/data/src/origins.ts';

export function apiProxy(target = apiOrigin(process.env.HB_API_PROXY_TARGET)) {
  return { '/api': { target, changeOrigin: true } };
}
