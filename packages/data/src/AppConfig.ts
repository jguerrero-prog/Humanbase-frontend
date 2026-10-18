export interface AppConfig {
  apiBase: string;
}

const defaults: AppConfig = { apiBase: '/api' };

export async function loadAppConfig(url = '/config.json'): Promise<AppConfig> {
  const response = await fetch(url);
  if (!response.ok) return defaults;
  return { ...defaults, ...((await response.json()) as Partial<AppConfig>) };
}
