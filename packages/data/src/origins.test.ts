import { apiOrigin, publicApi } from './origins';

describe('apiOrigin', () => {
  it('uses the given origin without its trailing slash', () => {
    expect(apiOrigin('https://api.example.org/')).toBe('https://api.example.org');
  });

  it('falls back to the public API when the origin is unset or empty', () => {
    expect(apiOrigin()).toBe(publicApi);
    expect(apiOrigin('')).toBe(publicApi);
  });
});
