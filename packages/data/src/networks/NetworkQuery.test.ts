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

  it('keeps a compared network in the URL and requests it with the same genes and version', () => {
    const query = NetworkQuery.fromSearch(new URLSearchParams('entrez=3553&entrez=7124&version=v1&compare=mononuclear-phagocyte&compare_datatype=co-expression'));
    expect(query.compared?.slug).toBe('mononuclear-phagocyte');
    expect(query.compared?.dataTypes).toEqual(['co-expression']);
    expect(query.compared?.entrez).toEqual([3553, 7124]);
    expect(query.href).toBe('/networks/?entrez=3553&entrez=7124&version=v1&compare=mononuclear-phagocyte&compare_datatype=co-expression');
    expect(NetworkQuery.fromSearch(new URLSearchParams('entrez=3553&compare=global')).compared?.slug).toBe('global');
  });

  it('puts the compared network first when the first is removed, and ends a comparison when the version changes', () => {
    const query = new NetworkQuery([3553], undefined, 'v1', [], undefined, { tissue: 'kidney', dataTypes: [] });
    expect(query.withoutFirst().tissue).toBe('kidney');
    expect(query.withoutFirst().compare).toBeUndefined();
    expect(query.with({ tissue: 'liver' }).compare?.tissue).toBe('kidney');
    expect(query.with({ version: 'v3' }).compare).toBeUndefined();
  });
});
