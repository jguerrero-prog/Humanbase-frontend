import { scoreDetails } from './itemDetails';

describe('scoreDetails', () => {
  it('lists Location and Score, the fields humanbase.io shows for score tracks, with the value at full precision', () => {
    expect(scoreDetails('chr1', { start: 2_346_202, end: 2_346_202, value: 3.6189358234405518 })).toEqual([
      ['Location', 'chr1:2,346,202-2,346,202'],
      ['Score', '3.6189358234405518'],
    ]);
    expect(scoreDetails('chr1', { start: 2_411_616, end: 2_411_751, value: 0.8728139370302611 })).toEqual([
      ['Location', 'chr1:2,411,616-2,411,751'],
      ['Score', '0.8728139370302611'],
    ]);
  });
});
