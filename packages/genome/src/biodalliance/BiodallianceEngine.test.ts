import { suggestedTracks } from '../genomeTrackList';
import { BiodallianceEngine, markImagesDecorative, resolveTokens } from './BiodallianceEngine';
import { chromHmm } from './humanbaseConfig';

class FakeTier {
  pinned = false;
  config: Record<string, unknown> = {};
  constructor(readonly dasSource: { name: string }) {}
  mergeConfig(config: Record<string, unknown>) {
    this.config = { ...this.config, ...config };
  }
}

class FakeBrowser {
  static last: FakeBrowser;
  /** When set, the browser waits to report it is ready until the test calls `ready`. */
  static held: { ready?: () => void } | undefined;
  views: ((chr: string, min: number, max: number) => void)[] = [];
  calls: string[] = [];
  orders: string[] = [];
  tiers: FakeTier[];
  constructor(readonly options: Record<string, unknown>) {
    FakeBrowser.last = this;
    this.tiers = (options.sources as { name: string; disabled?: boolean }[]).filter((source) => !source.disabled).map((source) => new FakeTier(source));
  }
  reorderTiers() {
    this.orders.push(this.tiers.map((tier) => tier.dasSource.name).join(', '));
  }
  addInitListener(listener: () => void) {
    if (FakeBrowser.held) FakeBrowser.held.ready = listener;
    else queueMicrotask(listener);
  }
  addViewListener(listener: (chr: string, min: number, max: number) => void) {
    this.views.push(listener);
  }
  setLocation(chr: string, min: number, max: number) {
    this.calls.push(`setLocation ${chr} ${min} ${max}`);
  }
  highlightRegion(chr: string, min: number, max: number) {
    this.calls.push(`highlight ${chr} ${min} ${max}`);
  }
  clearHighlights() {
    this.calls.push('clear');
  }
  resizeViewer() {
    this.calls.push('resize');
  }
  addTier(source: { name: string }) {
    this.calls.push(`add ${source.name}`);
  }
  removeTier(source: { name: string }) {
    this.calls.push(`remove ${source.name}`);
  }
  makeSVG(options: Record<string, unknown>) {
    this.calls.push(`svg ${JSON.stringify(options)}`);
    return new Blob(['<svg/>'], { type: 'image/svg+xml' });
  }
}

class FakeResizeObserver {
  static last: FakeResizeObserver | undefined;
  constructor(readonly resized: () => void) {
    FakeResizeObserver.last = this;
  }
  observe() {}
  disconnect() {}
}

const region = { chrom: 'chr1', start: 2_230_000, end: 2_440_000 };
const dna = { name: 'DNA Disease Impact Score', bigWigUrl: 'https://example.org/dis_dna.bw', style: { type: 'default' } };

describe('BiodallianceEngine', () => {
  beforeEach(() => {
    (globalThis as unknown as { Browser: unknown }).Browser = FakeBrowser;
    vi.stubGlobal('ResizeObserver', FakeResizeObserver);
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  });
  afterEach(() => {
    FakeBrowser.held = undefined;
    FakeResizeObserver.last = undefined;
    vi.useRealTimers();
    vi.unstubAllGlobals();
    delete (globalThis as unknown as { Browser?: unknown }).Browser;
  });

  it('starts Biodalliance with the live Humanbase tracks, the page’s tracks and no toolbar of its own', async () => {
    const container = document.createElement('div');
    document.body.append(container);
    await new BiodallianceEngine({ baseUrl: 'https://example.org/dalliance/' }).mount(container, { label: 'Genome browser', assembly: 'hg19', region, tracks: [dna] });
    const { options } = FakeBrowser.last;
    expect(options).toMatchObject({ chr: 'chr1', viewStart: 2_230_000, viewEnd: 2_440_000, prefix: 'https://example.org/dalliance/', noLocationField: true, useFetchWorkers: false, cookieKey: 'human-grc_hg19' });
    const names = (options.sources as { name: string }[]).map((source) => source.name);
    expect(names).toEqual(['Genome', 'GENCODE 19', 'DNA Disease Impact Score']);
    expect(container).toHaveAttribute('aria-label', 'Genome browser');
    expect(document.getElementById(options.pageName as string)).not.toBeNull();
    expect(options).toMatchObject({ noSourceCSS: true, noTrackEditor: true, rulerLocation: 'none' });
    expect(document.querySelectorAll('link[href="https://example.org/dalliance/css/dalliance-scoped.css"]')).toHaveLength(1);
  });

  it('reports a drag once it settles, and not the region the page just set', async () => {
    const onRegionChange = vi.fn();
    const engine = new BiodallianceEngine({ settleMs: 100 });
    await engine.mount(document.createElement('div'), { label: 'Genome browser', assembly: 'hg19', region, tracks: [], onRegionChange });
    const [view] = FakeBrowser.last.views;
    view?.('1', 2_230_000, 2_440_000);
    vi.advanceTimersByTime(150);
    expect(onRegionChange).not.toHaveBeenCalled();
    view?.('1', 2_300_000.4, 2_500_000);
    view?.('1', 2_310_000, 2_520_000);
    vi.advanceTimersByTime(150);
    expect(onRegionChange).toHaveBeenCalledExactlyOnceWith({ chrom: 'chr1', start: 2_310_000, end: 2_520_000 });
  });

  it('stops listening when it is destroyed while Biodalliance loads its tracks', async () => {
    const held: { ready?: () => void } = {};
    FakeBrowser.held = held;
    const engine = new BiodallianceEngine();
    const mounted = engine.mount(document.createElement('div'), { label: 'Genome browser', assembly: 'hg19', region, tracks: [], onRegionChange: vi.fn() });
    for (let tick = 0; tick < 20 && !held.ready; tick++) await Promise.resolve();
    engine.destroy();
    expect(vi.getTimerCount()).toBe(0);
    held.ready?.();
    await mounted;
    expect(FakeBrowser.last.views).toHaveLength(0);
    expect(FakeResizeObserver.last).toBeUndefined();
  });

  it('draws nothing when it is destroyed while Biodalliance loads', async () => {
    const container = document.createElement('div');
    const engine = new BiodallianceEngine();
    const mounting = engine.mount(container, { label: 'Genome browser', assembly: 'hg19', region, tracks: [] });
    engine.destroy();
    await mounting;
    expect(container.childElementCount).toBe(0);
  });

  it('moves to a region and marks one position', async () => {
    const engine = new BiodallianceEngine();
    await engine.mount(document.createElement('div'), { label: 'Genome browser', assembly: 'hg19', region, tracks: [] });
    engine.showRegion({ chrom: 'chr2', start: 166_095_911, end: 166_248_818 });
    engine.highlight({ chrom: 'chr2', position: 166_100_000 });
    engine.highlight(undefined);
    expect(FakeBrowser.last.calls).toEqual(['setLocation chr2 166095911 166248818', 'clear', 'highlight chr2 166100000 166100001', 'clear']);
  });

  it('starts hidden tracks disabled, shows and hides tracks by id, and exports its view', async () => {
    const engine = new BiodallianceEngine();
    await engine.mount(document.createElement('div'), { label: 'Genome browser', assembly: 'hg19', region, tracks: [dna], hidden: ['DNA Disease Impact Score'] });
    const sources = FakeBrowser.last.options.sources as { name: string; disabled?: boolean }[];
    expect(sources.find((source) => source.name === 'DNA Disease Impact Score')?.disabled).toBe(true);
    engine.showTracks(['genes']);
    engine.showTracks(['genes']);
    engine.showTracks([]);
    await engine.exportSvg({ width: 900, highlights: false, guideline: true, title: 'chr1:2,230,000-2,440,000' });
    expect(FakeBrowser.last.calls).toEqual(['remove GENCODE 19', 'add DNA Disease Impact Score', 'add GENCODE 19', 'svg {"highlights":false,"ruler":"center","width":900,"banner":false,"region":true}']);
  });

  it('draws the tracks in the page’s order and gives score tracks their height and range', async () => {
    const engine = new BiodallianceEngine();
    await engine.mount(document.createElement('div'), { label: 'Genome browser', assembly: 'hg19', region, tracks: [dna] });
    const { tiers, orders } = FakeBrowser.last;
    expect(orders).toEqual(['Genome, DNA Disease Impact Score, GENCODE 19']);
    expect(tiers.every((tier) => tier.pinned)).toBe(true);
    engine.arrangeTracks({ order: ['genes', 'sequence'], settings: { 'DNA Disease Impact Score': { height: 120, range: [-1, 4] } } });
    expect(orders.at(-1)).toBe('GENCODE 19, Genome, DNA Disease Impact Score');
    expect(tiers.find((tier) => tier.dasSource.name === 'DNA Disease Impact Score')?.config).toEqual({ height: 120, forceMin: -1, forceMax: 4 });
    engine.arrangeTracks({ order: [], settings: {} });
    expect(orders.at(-1)).toBe('Genome, DNA Disease Impact Score, GENCODE 19');
    expect(tiers.find((tier) => tier.dasSource.name === 'DNA Disease Impact Score')?.config).toEqual({ height: undefined, forceMin: undefined, forceMax: undefined });
  });

  it('draws GM12878 ChromHMM with the live site’s style, off until turned on', async () => {
    const engine = new BiodallianceEngine();
    await engine.mount(document.createElement('div'), { label: 'Genome browser', assembly: 'hg19', region, tracks: suggestedTracks.hg19, hidden: ['Conservation', 'GM12878 ChromHMM'] });
    const sources = FakeBrowser.last.options.sources as Record<string, unknown>[];
    expect(sources.find((source) => source.name === 'GM12878 ChromHMM')).toEqual({ name: 'GM12878 ChromHMM', bwgURI: 'https://s3-us-west-2.amazonaws.com/humanbase/tracks/gm12878.ChromHMM.bb', pinned: true, style: chromHmm.style, disabled: true });
    engine.showTracks(['Conservation']);
    expect(FakeBrowser.last.calls).toEqual(['add GM12878 ChromHMM']);
  });

  it('keeps the region it shows when the page resizes', async () => {
    const engine = new BiodallianceEngine();
    await engine.mount(document.createElement('div'), { label: 'Genome browser', assembly: 'hg19', region, tracks: [] });
    engine.showRegion(region);
    FakeResizeObserver.last?.resized();
    expect(FakeBrowser.last.calls.slice(-2)).toEqual(['resize', 'setLocation chr1 2230000 2440000']);
  });
});

describe('resolveTokens', () => {
  it('turns token references into the values the page computes, at any depth', () => {
    const element = document.createElement('div');
    element.style.setProperty('--viz-seq-6', 'rgb(1, 2, 3)');
    document.body.append(element);
    expect(resolveTokens({ style: { BGCOLOR: 'var(--viz-seq-6)', HEIGHT: 50 }, colors: ['var(--viz-seq-6)', 'red'] }, element)).toEqual({ style: { BGCOLOR: 'rgb(1, 2, 3)', HEIGHT: 50 }, colors: ['rgb(1, 2, 3)', 'red'] });
    expect(resolveTokens('var(--missing)', element)).toBe('var(--missing)');
  });
});

describe('markImagesDecorative', () => {
  it('gives Biodalliance’s images an empty alt, including ones added later', async () => {
    const root = document.createElement('div');
    const spinner = document.createElement('img');
    root.append(spinner);
    const observer = markImagesDecorative(root);
    expect(spinner).toHaveAttribute('alt', '');
    const later = document.createElement('img');
    root.append(later);
    await Promise.resolve();
    expect(later).toHaveAttribute('alt', '');
    const named = Object.assign(document.createElement('img'), { alt: 'Zoom in' });
    root.append(named);
    await Promise.resolve();
    expect(named).toHaveAttribute('alt', 'Zoom in');
    observer.disconnect();
  });
});
