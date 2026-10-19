import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EffectGroups, type EffectExperiment } from './EffectGroups';
import { EffectsHeatmap } from './EffectsHeatmap';
import { StrongestEffects } from './StrongestEffects';
import type { Variant } from './Variant';
import { VariantScorePlot } from './VariantScorePlot';
import { VariantsTable } from './VariantsTable';

const variants: Variant[] = [
  { id: 'a', chromosome: 'chr16', position: 85833314, change: 'G>T', name: 'COX4I1', scores: { impact: 2.05 } },
  { id: 'b', chromosome: 'chr1', position: 109817590, change: 'G>T', name: '[known_CEBP_binding_increase]', scores: { impact: 1 } },
];

const experiment = (feature: string, cell: string, value: number): EffectExperiment => ({ feature, cell, context: cell, label: `${cell} / ${feature}`, value });

describe('VariantsTable', () => {
  it('sorts by the score and reports the variant people pick', async () => {
    const onSelect = vi.fn();
    render(<VariantsTable variants={variants} scores={[{ key: 'impact', label: 'Disease impact' }]} sortBy="impact" selected="b" onSelect={onSelect} />);
    const picks = screen.getAllByRole('button', { name: /^chr/ });
    expect(picks[0]).toHaveAccessibleName('chr16:85,833,314 G>T, COX4I1');
    expect(picks[1]).toHaveAttribute('aria-pressed', 'true');
    const [first] = picks;
    if (first) await userEvent.click(first);
    expect(onSelect).toHaveBeenCalledWith('a');
  });
});

describe('VariantScorePlot', () => {
  it('names the selected variant and describes the plot in words', () => {
    render(<VariantScorePlot variants={variants} score={{ key: 'impact', label: 'Disease impact score' }} selected="b" summary="2 variants." />);
    expect(screen.getByRole('figure')).toHaveAccessibleName('2 variants.');
    expect(screen.getByText('chr1:109,817,590 G>T')).toBeInTheDocument();
  });
});

describe('StrongestEffects', () => {
  const effects = new EffectGroups([experiment('LIN28A', 'H9', 28), experiment('LARP4', 'K562', 4.4), experiment('LARP4', 'HepG2', 2.8), experiment('QKI', 'K562', 3.9)]);

  it('names only the first three cell types when a feature has many experiments', () => {
    const many = new EffectGroups(['H9', 'K562', 'HepG2', 'GM12878', 'A549'].map((cell, index) => experiment('H3K27me3', cell, 6 - index * 0.1)));
    render(<StrongestEffects effects={many} threshold={2} />);
    expect(screen.getByText('5 experiments: H9, K562, HepG2 and 2 more')).toBeInTheDocument();
  });

  it('folds repeats, opens them on request and says when nothing is lowered', async () => {
    const onToggle = vi.fn();
    render(<StrongestEffects effects={effects} threshold={2} onToggle={onToggle} limit={2} />);
    expect(screen.getByText('2 experiments: K562, HepG2')).toBeInTheDocument();
    expect(screen.getByText('2.8 to 4.4')).toBeInTheDocument();
    expect(screen.getByText('No feature is lowered by 2 or more')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show 1 more proteins' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /LARP4/ }));
    expect(onToggle).toHaveBeenCalledWith('LARP4');
  });

  it('lists the experiments of an open feature', () => {
    render(<StrongestEffects effects={effects} threshold={2} expanded={['LARP4']} />);
    expect(screen.getByRole('button', { name: /LARP4/ })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('HepG2')).toBeInTheDocument();
  });
});

describe('EffectsHeatmap', () => {
  it('puts the lowest first when asked', () => {
    const rows = [experiment('LIN28A', 'H9', 28), experiment('QKI', 'K562', 3.9)].map((item) => ({ experiment: item, values: [item.value] }));
    render(<EffectsHeatmap variants={['chr1:109,817,590 G>T']} rows={rows} total={232} lowestFirst />);
    const headers = screen.getAllByRole('rowheader').map((cell) => cell.textContent);
    expect(headers.slice(0, 2)).toEqual(['K562 / QKI', 'H9 / LIN28A']);
    expect(screen.getByText('Showing the top 2 of 232 features for this variant.', { selector: 'p' })).toBeInTheDocument();
  });
});
