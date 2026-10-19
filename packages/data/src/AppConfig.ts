export interface AppConfig {
  /** false turns the API completely off: screens show bundled sample data and nothing calls an API. */
  api: boolean;
  apiBase: string;
}

const defaults: AppConfig = { api: true, apiBase: '/api' };

export async function loadAppConfig(url = '/config.json'): Promise<AppConfig> {
  const response = await fetch(url);
  if (!response.ok) return defaults;
  return { ...defaults, ...((await response.json()) as Partial<AppConfig>) };
}
