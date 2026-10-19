import { PageWindow } from './PageWindow';

describe('PageWindow', () => {
  const datasets = (page: number) => new PageWindow(7463, 25, page);

  it('keeps seven slots with the first and last page', () => {
    expect(datasets(2).slots()).toEqual([1, 2, 3, 4, 5, 'gap', 299]);
    expect(datasets(49).slots()).toEqual([1, 'gap', 48, 49, 50, 'gap', 299]);
    expect(datasets(298).slots()).toEqual([1, 'gap', 295, 296, 297, 298, 299]);
  });

  it('lists every page when there are seven or fewer', () => {
    expect(new PageWindow(120, 25, 3).slots()).toEqual([1, 2, 3, 4, 5]);
  });

  it('says the range, position and announcement in words', () => {
    expect(datasets(49).range('datasets')).toBe('1,201 to 1,225 of 7,463 datasets');
    expect(datasets(49).position()).toBe('Page 49 of 299');
    expect(datasets(49).announcement('datasets')).toBe('Page 49 of 299, datasets 1,201 to 1,225');
    expect(datasets(299).last).toBe(7463);
  });

  it('clamps the page to the ones that exist', () => {
    expect(datasets(400).page).toBe(299);
    expect(datasets(0).hasPrevious).toBe(false);
  });
});
