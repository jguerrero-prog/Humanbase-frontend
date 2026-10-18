import { ScoreScale } from './ScoreScale';

describe('ScoreScale', () => {
  const zScore = new ScoreScale({ title: 'z-score', kind: 'diverging', edges: [-5, -3, -2, 2, 3, 5], words: ['Lowers', 'Raises'] });
  const expression = new ScoreScale({ title: 'ExPecto', kind: 'diverging', edges: [-1, -0.3, -0.1, 0.1, 0.3, 1], words: ['Decreases', 'Increases'] });
  const eValue = new ScoreScale({ title: 'e-value', kind: 'one-sided', edges: [0.05, 0.01, 0.001], words: ['Weaker', 'Stronger evidence'] });
  const confidence = new ScoreScale({ title: 'Confidence', kind: 'sequential', edges: [0.5, 0.7, 0.8, 0.9], ends: [0, 1], words: ['Lower', 'Higher'] });

  it('bins values into steps, with the middle step neutral', () => {
    expect(zScore.step(0)).toBe(4);
    expect(zScore.step(2.5)).toBe(5);
    expect(zScore.step(28)).toBe(7);
    expect(zScore.step(-4)).toBe(2);
    expect(zScore.step(null)).toBeNull();
  });

  it('reads one-sided scales where smaller is stronger', () => {
    expect(eValue.step(0.2)).toBe(1);
    expect(eValue.step(0.02)).toBe(2);
    expect(eValue.step(0.0004)).toBe(4);
    expect(eValue.range(2)).toBe('0.01 to 0.05');
    expect(eValue.range(1)).toBe('above 0.05');
  });

  it('says when a value is past the end of the legend', () => {
    expect(expression.describe(-1.42)).toBe('−1.42, past the end of the legend (−1)');
    expect(expression.describe(0.2)).toBe('0.2');
    expect(confidence.pastEnd(0.95)).toBeUndefined();
    expect(expression.describe(null)).toBe('Not available');
  });

  it('names step ranges and colors', () => {
    expect(confidence.range(1)).toBe('below 0.5');
    expect(confidence.range(5)).toBe('0.9 and up');
    expect(zScore.range(3)).toBe('−3 to −2');
    expect(confidence.color(5)).toBe('--viz-seq-7');
  });
});
