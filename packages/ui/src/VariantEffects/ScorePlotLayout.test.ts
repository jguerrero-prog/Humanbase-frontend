import { scaleLinear } from 'd3-scale';
import { describe, expect, it } from 'vitest';
import { bandColor, pointColor, rankBandColor } from './plotColors';
import { clampWindow, windowShowing, zoomWindow } from './plotWindow';
import { ScorePlotLayout } from './ScorePlotLayout';
import type { Variant } from './Variant';

// The Sei example job 2e18fedf, as humanbase.io plotted it on October 22, 2026 at a 1,100px plot width.
const sei: Variant[] = (
  [
    ['chr3', 12598855, 0.211],
    ['chr3', 54158012, 0.204],
    ['chr5', 134871851, -0.819],
    ['chr6', 108879283, -0.238],
    ['chr7', 49813589, 2.012],
    ['chr8', 74206149, -0.779],
    ['chr10', 96305280, -0.491],
    ['chr11', 2435681, -0.153],
    ['chr11', 69593819, -0.33],
    ['chr17', 76352731, 0.838],
    ['chr19', 1854681, 0.272],
    ['chr19', 59070227, -0.521],
  ] as const
).map(([chromosome, position, value]) => ({ id: `${chromosome}-${position}`, chromosome, position, change: 'G>A', name: '', scores: { seqclass: value } }));
const width = 1100;
const pixels = (layout: ScorePlotLayout) => {
  const x = scaleLinear().domain(layout.domain(width)).range([0, width]);
  return layout.points.map((point) => Number(x(point.x).toFixed(2)));
};

describe('ScorePlotLayout, Genome', () => {
  const layout = ScorePlotLayout.genome([...sei].reverse(), 'seqclass');

  it('places each variant where humanbase.io does', () => {
    expect(pixels(layout)).toEqual([11.74, 240.24, 260.76, 281.29, 301.82, 322.34, 342.87, 363.4, 732.63, 753.16, 773.69, 1088.26]);
  });

  it('labels seven ticks with chromosome and position, the last one empty', () => {
    const domain = layout.domain(width);
    expect(ScorePlotLayout.ticks(domain).map((tick, index) => layout.tickLabel(tick, index))).toEqual(['chr3:12598855', 'chr3:43808307', 'chr11:3030508', 'chr11:36375968', 'chr11:69593819', 'chr19:27860774', '']);
  });

  it('names the nearer chromosome edge for a tick between chromosomes, and the ends outside them', () => {
    const [chr3, chr5] = layout.regions;
    if (!chr3 || !chr5) throw new Error('regions');
    expect(layout.tickLabel(chr3.end + 1, 0)).toBe('chr3:54158012');
    expect(layout.tickLabel(chr5.begin - 1, 0)).toBe('chr5:134871851');
    expect(layout.tickLabel(-5, 0)).toBe('chr3:12598855');
    expect(layout.tickLabel(1e12, 0)).toBe('chr19:59070227');
  });

  it('bands each chromosome in the overview, meeting halfway across each gap as humanbase.io’s gradient does', () => {
    const domain = layout.domain(width);
    const percent = scaleLinear().domain(domain).range([0, 100]);
    const edges = layout.bands(domain).map((band) => Number(percent(band.to).toFixed(4)));
    expect(edges).toEqual([22.7727, 24.6387, 26.5048, 28.3709, 30.2369, 32.103, 67.5359, 69.402, 100]);
    expect(layout.bands(domain)[0]?.from).toBe(domain[0]);
  });

  it('spans every score and 0 on the y axis', () => {
    expect(layout.scoreDomain()).toEqual([-0.819, 2.012]);
    expect(ScorePlotLayout.genome(sei.slice(0, 2), 'seqclass').scoreDomain()).toEqual([0, 0.211]);
  });
});

describe('ScorePlotLayout, Rank', () => {
  const layout = ScorePlotLayout.rank(sei, 'seqclass');

  it('puts the highest score first, 12px inside the plot', () => {
    expect(layout.points.map((point) => point.variant.position).slice(0, 3)).toEqual([49813589, 76352731, 1854681]);
    expect(pixels(layout)[0]).toBe(11.74);
    expect(pixels(layout).at(-1)).toBe(1088.26);
  });

  it('labels ticks by rank, as humanbase.io does', () => {
    const domain = layout.domain(width);
    expect(ScorePlotLayout.ticks(domain).map((tick, index) => layout.tickLabel(tick, index))).toEqual(['0', '2', '4', '6', '8', '10', '']);
    expect(layout.bands(domain)).toEqual([]);
  });

  it('keeps one variant inside the plot', () => {
    expect(ScorePlotLayout.rank(sei.slice(0, 1), 'seqclass').domain(width)).toEqual([0, 2]);
  });
});

describe('plot colors', () => {
  const [first] = sei;
  if (!first) throw new Error('fixture');

  it('colors points by chromosome, or by sequence class group', () => {
    expect(pointColor(first, 'chromosome')).toBe('--viz-chromosome-3');
    expect(pointColor({ ...first, topClass: 'E12 Erythroblast-like' }, 'sequence-class')).toBe('--viz-seqclass-enhancer');
    expect(pointColor({ ...first, chromosome: 'chrM' }, 'chromosome')).toBe('--viz-cat-other');
  });

  it('bands the overview by chromosome color, or alternates dark and light grey for sequence classes', () => {
    expect(bandColor('chr7', 4, 'chromosome')).toBe('--viz-chromosome-7');
    expect([0, 1, 2].map((index) => bandColor('chr7', index, 'sequence-class'))).toEqual(['--color-grey-500', '--color-grey-300', '--color-grey-500']);
    expect(rankBandColor).toBe('--color-grey-300');
  });
});

describe('plot window', () => {
  const full = [0, 100] as const;

  it('zooms around a value that stays in place', () => {
    expect(zoomWindow(full, full, 50, 0.5, 1000)).toEqual([25, 75]);
    expect(zoomWindow([20, 40], full, 20, 0.5, 1000)).toEqual([20, 30]);
  });

  it('never leaves the whole axis or grows past it', () => {
    expect(zoomWindow([0, 50], full, 0, 4, 1000)).toEqual([0, 100]);
    expect(clampWindow([90, 120], full, 1000)).toEqual([70, 100]);
    expect(clampWindow([-10, 10], full, 1000)).toEqual([0, 20]);
  });

  it('is never narrower than two overview pixels', () => {
    expect(clampWindow([50, 50], full, 100)).toEqual([50, 52]);
  });

  it('centers on a value out of view, and leaves one in view alone', () => {
    expect(windowShowing([0, 10], full, 5, 1000)).toEqual([0, 10]);
    expect(windowShowing([0, 10], full, 60, 1000)).toEqual([55, 65]);
  });
});
