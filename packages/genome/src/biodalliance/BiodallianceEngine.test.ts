import { BiodallianceEngine, markImagesDecorative } from './BiodallianceEngine';

class FakeBrowser {
  static last: FakeBrowser;
  views: ((chr: string, min: number, max: number) => void)[] = [];
  calls: string[] = [];
  constructor(readonly options: Record<string, unknown>) {
    FakeBrowser.last = this;
  }
  addInitListener(listener: () => void) {
    queueMicrotask(listener);
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
}

const region = { chrom: 'chr1', start: 2_230_000, end: 2_440_000 };
const dna = { name: 'DNA Disease Impact Score', bigWigUrl: 'https://example.org/dis_dna.bw', style: { type: 'default' } };

describe('BiodallianceEngine', () => {
  beforeEach(() => {
    (globalThis as unknown as { Browser: unknown }).Browser = FakeBrowser;
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  });
  afterEach(() => {
    vi.useRealTimers();
    delete (globalThis as unknown as { Browser?: unknown }).Browser;
  });

  it('starts Biodalliance with the live Humanbase tracks, the page’s tracks and no toolbar of its own', async () => {
    const container = document.createElement('div');
    document.body.append(container);
    await new BiodallianceEngine({ baseUrl: 'https://example.org/dalliance/' }).mount(container, { label: 'Genome browser', assembly: 'hg19', region, tracks: [dna] });
    const { options } = FakeBrowser.last;
    expect(options).toMatchObject({ chr: 'chr1', viewStart: 2_230_000, viewEnd: 2_440_000, prefix: 'https://example.org/dalliance/', noLocationField: true, useFetchWorkers: false, cookieKey: 'human-grc_hg19' });
    const names = (options.sources as { name: string }[]).map((source) => source.name);
    expect(names).toEqual(['Genome', 'GENCODE 19', 'Conservation', 'GM12878 ChromHMM', 'DNA Disease Impact Score']);
    expect(container).toHaveAttribute('aria-label', 'Genome browser');
    expect(document.getElementById(options.pageName as string)).not.toBeNull();
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
