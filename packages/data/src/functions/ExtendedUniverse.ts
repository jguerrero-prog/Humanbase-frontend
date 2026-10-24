import type { DataVersion } from '../genes/Gene';

/** How a page applies the URL's extended_universe flag: active, ignored on MAGE, or not asked for. */
export type ExtendedUniverseStatus = 'active' | 'ignored' | 'inactive';

const param = 'extended_universe';
const supports = (version: DataVersion): boolean => version === 'v1';

/**
 * The legacy cross-organism annotation universe, asked for with extended_universe=true as on humanbase.io.
 * Human-only annotations are the default; the API accepts the flag for GIANT only.
 */
export const ExtendedUniverse = {
  param,
  supports,
  requested: (search: URLSearchParams): boolean => search.get(param) === 'true',
  status: (requested: boolean, version: DataVersion): ExtendedUniverseStatus => (!requested ? 'inactive' : supports(version) ? 'active' : 'ignored'),
  /** The API query addition: the flag only when on, as humanbase.io sends it. */
  query: (on: boolean): { extended_universe?: true } => (on ? { extended_universe: true } : {}),
  /** A link that keeps the flag, the way humanbase.io carries it from page to page. */
  link: (path: string, on: boolean): string => (on ? `${path}${path.includes('?') ? '&' : '?'}${param}=true` : path),
};
