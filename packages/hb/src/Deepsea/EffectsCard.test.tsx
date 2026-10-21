import { GenomeLocation, type FeatureEffect } from '@humanbase/data';
import { expressionEffects, zEffects } from '@humanbase/ui';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EffectsCard, type EffectsCardProps } from './EffectsCard';

const tissue = (feature: string, resource: string, value: number) => ({ feature, cell: resource, context: resource, label: feature, value, group: `${feature}, ${resource}` });
const effects = [tissue('Spleen', 'GTEx', 0.2), tissue('Spleen', 'Roadmap', 0.15), tissue('Liver', 'ENCODE', -0.12)];
const view = new GenomeLocation('chr5', 134_846_851, 134_896_851);
const one = (values: readonly FeatureEffect[]) => ({ location: view, variants: [{ key: 'chr5-134871851-G-A', name: 'chr5:134,871,851 G>A', position: 134_871_851, effects: values }], selected: 0 });

const renderCard = (props: Partial<EffectsCardProps> = {}) =>
  render(
    <EffectsCard
      label="chr5:134,871,851 G>A"
      effects={effects}
      inView={one(effects)}
      failed={false}
      onRetry={() => undefined}
      scale={expressionEffects}
      threshold={0.1}
      featureNoun="tissue"
      featurePlural="tissues"
      verb="expression"
      choice={{ label: 'Score', options: [{ value: 'expecto', label: 'Expression effect' }], value: 'expecto', onChange: () => undefined, name: 'Expression effect' }}
      {...props}
    />,
  );

const protein = (feature: string, value: number) => ({ feature, cell: 'K562', context: 'K562', label: `K562 / ${feature}`, value });
const at = (position: number, values: readonly number[]) => ({
  key: `chr1-${position}-G-T`,
  name: `chr1:${position.toLocaleString('en-US')} G>T`,
  position,
  effects: ['LIN28A', 'AGO', 'QKI'].map((feature, index) => protein(feature, values[index] ?? 0)),
});
const variants = [at(109_800_000, [0.5, 0.2, 0.1]), at(109_817_590, [1, -5, 3]), at(109_830_000, [2, 2, 2])];
const rowLabels = () => within(screen.getByRole('grid')).getAllByRole('rowheader').map((cell) => cell.textContent);

describe('EffectsCard', () => {
  it('narrows ExPecto tissues to one resource', async () => {
    renderCard({ inCellTypes: false });
    const resource = screen.getByRole('combobox', { name: 'Resource' });
    expect(resource).toHaveTextContent('All resources');
    expect(screen.getByText('Liver')).toBeInTheDocument();
    await userEvent.click(resource);
    await userEvent.click(screen.getByRole('option', { name: 'GTEx' }));
    expect(resource).toHaveTextContent('GTEx');
    expect(screen.queryByText('Liver')).not.toBeInTheDocument();
  });

  it('has no Resource filter where features are measured in cell types', () => {
    renderCard();
    expect(screen.queryByRole('combobox', { name: 'Resource' })).not.toBeInTheDocument();
  });

  it('shows every variant in view, ranking rows by the size of the center variant’s effect as humanbase.io does', async () => {
    const center = variants[1]?.effects ?? [];
    renderCard({ label: 'chr1:109,817,590 G>T', effects: center, inView: { location: new GenomeLocation('chr1', 109_792_590, 109_842_590), variants, selected: 1 }, scale: zEffects, featureNoun: 'protein', featurePlural: 'proteins', view: 'heatmap', choice: { label: 'Score', options: [{ value: 'zscore', label: 'z-score' }], value: 'zscore', onChange: () => undefined, name: 'z-score' } });
    expect(screen.getByText('z-score. Showing all 3 proteins, ranked by chr1:109,817,590 G>T.')).toBeInTheDocument();
    expect(rowLabels()).toEqual(['K562 / AGO', 'K562 / QKI', 'K562 / LIN28A']);
    expect(within(screen.getAllByRole('row')[0] as HTMLElement).getAllByRole('gridcell')).toHaveLength(3);
    expect(screen.getByRole('gridcell', { name: /^K562 \/ AGO, chr1:109,830,000 G>T: .*2/ })).toBeInTheDocument();
    expect(document.querySelector('.heatmap-selected-column')).toHaveStyle({ '--heatmap-at': '1' });
    await userEvent.click(screen.getByRole('checkbox', { name: 'Lowest first' }));
    expect(rowLabels()).toEqual(['K562 / LIN28A', 'K562 / QKI', 'K562 / AGO']);
  });

  it('starts from the smallest values for a score humanbase.io marks reverse_order, such as e-value', () => {
    const center = variants[1]?.effects ?? [];
    renderCard({ effects: center, inView: { location: new GenomeLocation('chr1', 109_792_590, 109_842_590), variants, selected: 1 }, reverseOrder: true, view: 'heatmap' });
    expect(rowLabels()).toEqual(['K562 / LIN28A', 'K562 / QKI', 'K562 / AGO']);
  });
});
