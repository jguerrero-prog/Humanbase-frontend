import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AllFeaturesPlot } from './AllFeaturesPlot';
import { EffectGroups, type EffectExperiment } from './EffectGroups';
import { EffectsHeatmap } from './EffectsHeatmap';
import { rangeEffects } from './EffectScale';
import { chromosomeColor } from './ChromosomeColor';
import { sequenceClassColor } from './SequenceClass';
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
  const score = { key: 'impact', label: 'Disease impact score' };
  const three: Variant[] = [...variants, { id: 'c', chromosome: 'chr16', position: 85900000, change: 'A>C', name: 'GSE1', scores: { impact: -0.4 } }];
  const point = (name: RegExp) => screen.getByRole('button', { name });

  it('describes the plot in words and marks the selected variant', () => {
    render(<VariantScorePlot variants={variants} score={score} selected="b" summary="2 variants." />);
    expect(screen.getByRole('figure')).toHaveAccessibleName('2 variants.');
    expect(point(/^chr1:109,817,590 G>T/)).toHaveAttribute('aria-pressed', 'true');
    expect(point(/^chr1:109,817,590 G>T/)).toHaveAccessibleName('chr1:109,817,590 G>T, [known_CEBP_binding_increase], Disease impact score 1.00');
    expect(point(/^chr16/)).toHaveAttribute('aria-pressed', 'false');
  });

  it('titles the x axis Genome or Rank and keeps negative scores inside the plot', () => {
    const { container, rerender } = render(<VariantScorePlot variants={three} score={score} summary="3 variants." />);
    expect(screen.getByText('Genome')).toBeInTheDocument();
    const cys = [...container.querySelectorAll('.variant-plot-point')].map((dot) => Number(dot.getAttribute('cy')));
    expect(cys.every((cy) => cy >= 18 && cy <= 232)).toBe(true);
    expect(screen.getByText('chr1:109817590')).toBeInTheDocument();
    rerender(<VariantScorePlot variants={three} score={score} by="rank" summary="3 variants." />);
    expect(screen.getByText('Rank')).toBeInTheDocument();
    expect(screen.queryByText('chr1:109817590')).not.toBeInTheDocument();
  });

  it('colors points by chromosome, or by sequence class', () => {
    const classed = variants.map((variant) => ({ ...variant, topClass: 'P Promoter' }));
    const { container, rerender } = render(<VariantScorePlot variants={classed} score={score} summary="2 variants." />);
    expect(container.querySelector('.variant-plot-point')?.getAttribute('style')).toContain('--point-color: var(--viz-chromosome-1)');
    expect(container.querySelector('.variant-plot-band')?.getAttribute('style')).toContain('--point-color: var(--viz-chromosome-1)');
    rerender(<VariantScorePlot variants={classed} score={score} colorBy="sequence-class" summary="2 variants." />);
    expect(container.querySelector('.variant-plot-point')?.getAttribute('style')).toContain('--point-color: var(--viz-seqclass-promoter)');
    expect(container.querySelector('.variant-plot-band')?.getAttribute('style')).toContain('--point-color: var(--viz-band-dark)');
  });

  it('selects on click and moves between variants with the keyboard, showing each one’s tooltip', async () => {
    const onSelect = vi.fn();
    render(<VariantScorePlot variants={three} score={score} selected="b" onSelect={onSelect} summary="3 variants." />);
    await userEvent.click(point(/^chr16:85,833,314/));
    expect(onSelect).toHaveBeenLastCalledWith('a');
    await userEvent.unhover(point(/^chr16:85,833,314/));
    point(/^chr1:/).focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(point(/^chr16:85,833,314/)).toHaveFocus();
    expect(screen.getByRole('tooltip')).toHaveTextContent('chr16:85,833,314 G>T');
    await userEvent.keyboard('{End}{Enter}');
    expect(onSelect).toHaveBeenLastCalledWith('c');
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('zooms with + and - and draws the window in the overview', async () => {
    const { container } = render(<VariantScorePlot variants={three} score={score} summary="3 variants." />);
    const window = () => Number(container.querySelector('.variant-plot-window')?.getAttribute('width'));
    const whole = window();
    point(/^chr1:/).focus();
    await userEvent.keyboard('+');
    expect(window()).toBeLessThan(whole);
    await userEvent.keyboard('---');
    expect(window()).toBeCloseTo(whole);
  });
});

describe('AllFeaturesPlot', () => {
  const values = [
    { label: 'K562 / QKI', value: 0.0027 },
    { label: 'H9 / LIN28A', value: 0.000086 },
    { value: 0.98 },
  ];

  it('names the point nearest the pointer and its score, as humanbase.io does, until the pointer leaves or Escape', () => {
    const { container } = render(<AllFeaturesPlot values={values} summary="3 proteins." scale={rangeEffects('e-value', [0, 0.05], { reversed: true })} />);
    const svg = container.querySelector('svg') as SVGSVGElement;
    svg.getBoundingClientRect = () => ({ left: 0, top: 0, width: 485, height: 190 }) as DOMRect;
    fireEvent.pointerMove(svg, { clientX: 28 });
    expect(screen.getByRole('tooltip')).toHaveTextContent('H9 / LIN28Ae-value8.6 × 10⁻⁵');
    fireEvent.pointerMove(svg, { clientX: 252 });
    expect(screen.getByRole('tooltip')).toHaveTextContent('K562 / QKI');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('tooltip')).toBeNull();
    fireEvent.pointerMove(svg, { clientX: 477 });
    expect(screen.queryByRole('tooltip')).toBeNull();
    fireEvent.pointerMove(svg, { clientX: 252 });
    fireEvent.pointerLeave(svg);
    expect(screen.queryByRole('tooltip')).toBeNull();
  });
});

describe('chromosomeColor', () => {
  it('gives each of the 24 chromosomes its own color, as humanbase.io does', () => {
    expect(chromosomeColor('chr3')).toBe('--viz-chromosome-3');
    expect(chromosomeColor('chrX')).toBe('--viz-chromosome-x');
    expect(chromosomeColor('chr22')).toBe('--viz-chromosome-22');
    expect(chromosomeColor('chrM')).toBeUndefined();
    expect(chromosomeColor('chr23')).toBeUndefined();
  });
});

describe('sequenceClassColor', () => {
  it('matches a Sei class to its group by name, as humanbase.io does', () => {
    expect(sequenceClassColor('PC1 Polycomb / Heterochromatin')).toBe('--viz-seqclass-polycomb');
    expect(sequenceClassColor('P Promoter')).toBe('--viz-seqclass-promoter');
    expect(sequenceClassColor('E12 Erythroblast-like')).toBe('--viz-seqclass-enhancer');
    expect(sequenceClassColor('CTCF CTCF-Cohesin')).toBe('--viz-seqclass-ctcf');
    expect(sequenceClassColor('HET5 Centromere')).toBe('--viz-seqclass-heterochromatin');
    expect(sequenceClassColor('TN4 Transcription')).toBe('--viz-seqclass-transcription');
    expect(sequenceClassColor('TF3 FOXA1 / AR / ESR1')).toBe('--viz-seqclass-tf');
    expect(sequenceClassColor('L7 Low signal')).toBe('--viz-seqclass-low');
    expect(sequenceClassColor(undefined)).toBeUndefined();
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
    expect(screen.getByText('No protein is lowered by 2 or more')).toBeInTheDocument();
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
