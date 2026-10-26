import { describe, expect, it } from 'vitest';
import { latestUpdates, whatsNew } from './whatsNew';

describe('whatsNew', () => {
  it('keeps humanbase.io’s months, newest first', () => {
    expect(whatsNew.map((month) => month.month)).toEqual(['June 2026', 'February 2026', 'August 2025', 'October 2024', 'July 2024']);
  });

  it('gives the homepage the two latest updates, with their summaries', () => {
    expect(latestUpdates.map((update) => [update.date, update.title])).toEqual([
      ['June 2026', 'New example gene sets for functional module detection'],
      ['June 2026', 'Updated Data sources page'],
    ]);
  });
});
