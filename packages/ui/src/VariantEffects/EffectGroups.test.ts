import { EffectGroups } from './EffectGroups';
import { rangeEffects } from './EffectScale';

const effects = new EffectGroups([
  { feature: 'LIN28A', cell: 'H9', context: 'H9', label: 'H9 / LIN28A', value: 28 },
  { feature: 'LARP4', cell: 'K562', context: 'K562 rep 2', label: 'K562 / LARP4', value: 4.4 },
  { feature: 'LARP4', cell: 'HepG2', context: 'HepG2 rep 1', label: 'HepG2 / LARP4', value: 4.4 },
  { feature: 'LARP4', cell: 'K562', context: 'K562 rep 1', label: 'K562 / LARP4', value: 2.8 },
  { feature: 'QKI', cell: 'K562', context: 'K562', label: 'K562 / QKI', value: 3.9 },
  { feature: 'PUM2', cell: 'K562', context: 'K562', label: 'K562 / PUM2', value: -2.4 },
  { feature: 'XRN2', cell: 'K562', context: 'K562', label: 'K562 / XRN2', value: 1.2 },
]);

describe('EffectGroups', () => {
  it('counts effects by strength', () => {
    expect(effects.counts()).toEqual({ strong: 1, moderate: 3, weak: 1, lowered: 1 });
  });

  it('folds repeat experiments of a feature into one group with their range', () => {
    const [first, second] = effects.groups('raises');
    expect(first?.feature).toBe('LIN28A');
    expect(second).toMatchObject({ feature: 'LARP4', low: 2.8, high: 4.4, peak: 4.4 });
    expect(second?.experiments).toHaveLength(3);
    expect(second?.cells).toEqual(['K562', 'HepG2']);
  });

  it('keeps experiments apart when they name their own group', () => {
    const tissues = new EffectGroups([
      { feature: 'Spleen', cell: 'GTEx', context: 'GTEx', label: 'Spleen', value: 0.4, group: 'Spleen, GTEx' },
      { feature: 'Spleen', cell: 'Roadmap', context: 'Roadmap', label: 'Spleen', value: 0.3, group: 'Spleen, Roadmap' },
    ]);
    expect(tissues.groups('raises').map((group) => [group.id, group.feature, group.experiments.length])).toEqual([
      ['Spleen, GTEx', 'Spleen', 1],
      ['Spleen, Roadmap', 'Spleen', 1],
    ]);
  });

  it('keeps lowers apart from raises and filters by threshold', () => {
    expect(effects.groups('lowers').map((group) => group.feature)).toEqual(['PUM2']);
    expect(effects.atLeast(3).groups('raises').map((group) => group.feature)).toEqual(['LIN28A', 'LARP4', 'QKI']);
    expect(effects.atLeast(3).groups('lowers')).toEqual([]);
    expect(effects.atLeast(null).experiments).toHaveLength(7);
  });

  it('counts nothing for a score without strength bins', () => {
    const ranked = new EffectGroups(effects.experiments, rangeEffects('e-value', [0, 0.05], { reversed: true }));
    expect(ranked.counts()).toEqual({ strong: 0, moderate: 0, weak: 0, lowered: 0 });
  });
});

describe('rangeEffects', () => {
  it('steps a three-stop range like a diverging legend, outer edges at its ends', () => {
    const diffs = rangeEffects('Probability diffs', [-0.3, 0, 0.3], { insignificant: [-0.01, 0.01] });
    expect(diffs.legend).toMatchObject({ kind: 'diverging', words: ['Lowers', 'Raises'] });
    expect(diffs.legend.edges.map((edge) => Number(edge.toFixed(3)))).toEqual([-0.3, -0.2, -0.1, 0.1, 0.2, 0.3]);
    expect(diffs.bins).toBeUndefined();
    expect(diffs).toMatchObject({ insignificant: [-0.01, 0.01], digits: 3 });
  });

  it('draws a reversed score such as e-value darkest at its smallest values', () => {
    const evalue = rangeEffects('e-value', [0, 0.05], { reversed: true });
    expect(evalue.legend).toMatchObject({ kind: 'sequential', ends: [0.05, 0], words: ['Weaker', 'Stronger'] });
    expect(evalue.legend.edges.map((edge) => Number(edge.toFixed(3)))).toEqual([0.04, 0.03, 0.02, 0.01]);
    expect(evalue).toMatchObject({ reversed: true, digits: 4 });
  });
});
