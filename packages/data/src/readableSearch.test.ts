import { readableSearch } from './readableSearch';

describe('readableSearch', () => {
  it('keeps genome places readable and still encodes what a query string needs encoded', () => {
    expect(readableSearch({ location: 'chr5:150,200,000-150,250,000', variant: 'chr5:150226123' })).toBe('location=chr5:150,200,000-150,250,000&variant=chr5:150226123');
    expect(readableSearch(new URLSearchParams({ gene: 'A&B c' }))).toBe('gene=A%26B+c');
  });

  it('reads back to the same values', () => {
    const text = readableSearch({ location: 'chr1:1,000-2,000', title: 'a:b, c' });
    expect(Object.fromEntries(new URLSearchParams(text))).toEqual({ location: 'chr1:1,000-2,000', title: 'a:b, c' });
  });
});
