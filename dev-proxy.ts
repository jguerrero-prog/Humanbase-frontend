const publicApi = 'https://hb.flatironinstitute.org';

export function apiProxy(target = process.env.HB_API_PROXY_TARGET ?? publicApi) {
  return { '/api': { target, changeOrigin: true } };
}
