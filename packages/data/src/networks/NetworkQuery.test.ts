import { NetworkQuery } from './NetworkQuery';

describe('NetworkQuery', () => {
  it('reads genes, tissue and version from the URL', () => {
    const query = NetworkQuery.fromSearch(new URLSearchParams('entrez=3553&entrez=7124&entrez=3553&tissue=blood-vessel&version=v3'));
    expect(query.entrez).toEqual([3553, 7124]);
    expect(query.tissue).toBe('blood-vessel');
    expect(query.versionName).toBe('MAGE');
  });

  it('ignores IDs that are not genes and defaults to GIANT', () => {
    const query = NetworkQuery.fromSearch(new URLSearchParams('entrez=abc&entrez=-2&version=v9'));
    expect(query.isEmpty).toBe(true);
    expect(query.version).toBe('v1');
  });

  it('writes the same URL back', () => {
    expect(new NetworkQuery([3553, 7124]).href).toBe('/networks/?entrez=3553&entrez=7124&version=v1');
  });
});
