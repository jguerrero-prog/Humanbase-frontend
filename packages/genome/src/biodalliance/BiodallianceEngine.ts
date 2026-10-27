import { isSegmentTrack, trackFile, withChr, type GenomeBrowserEngine, type GenomeExportOptions, type GenomeMountOptions, type GenomeRegion, type GenomeTrackArrangement, type GenomeTrackLayout } from '../GenomeBrowserEngine';
import { genesTrack, genomeTrackList, inOrder, noArrangement, sequenceTrack } from '../genomeTrackList';
import { humanbaseAssemblies, humanbaseBrowserOptions, type BiodallianceAssembly } from './humanbaseConfig';

/** The parts of Biodalliance's Browser this engine calls. */
interface DallianceBrowser {
  setLocation(chr: string, min: number, max: number, callback?: (error?: unknown) => void): void;
  highlightRegion(chr: string, min: number, max: number): void;
  clearHighlights(): void;
  addViewListener(listener: (chr: string, min: number, max: number) => void): void;
  addInitListener(listener: () => void): void;
  addTierListener(listener: () => void): void;
  resizeViewer(): void;
  addTier(source: Record<string, unknown>): void;
  removeTier(source: Record<string, unknown>): void;
  makeSVG(options: { highlights: boolean; ruler: string; width: number; banner: boolean; region: boolean }): Blob;
  reorderTiers(): void;
  tiers: DallianceTier[];
}

interface DallianceTier {
  row: HTMLElement;
  dasSource: { name?: string; title?: string; desc?: string };
  /** Pinned tiers are drawn first, in the tiers' order. */
  pinned: boolean;
  /** height, forceMin and forceMax override the source's; undefined puts the source's back. */
  mergeConfig(config: { height?: number | undefined; forceMin?: number | undefined; forceMax?: number | undefined }): void;
}

type DallianceConstructor = new (options: Record<string, unknown>) => DallianceBrowser;

export interface BiodallianceOptions {
  /** Where Biodalliance's compiled script, stylesheet and images live, ending in a slash. */
  baseUrl?: string;
  assemblies?: Record<string, BiodallianceAssembly>;
  browserOptions?: Record<string, unknown>;
  /** Waits this long after the last drag or zoom before reporting the region. */
  settleMs?: number;
  /** Gives up when the tracks haven't loaded after this long. */
  readyMs?: number;
}

/** The vendored copy the web app serves from its own origin (packages/genome/vendor). */
export const biodallianceBaseUrl = `${import.meta.env.BASE_URL}biodalliance/`;

let loading: Promise<DallianceConstructor> | undefined;

/** Loads Biodalliance once per page, from our vendored copy or a fork's own. */
export function loadBiodalliance(baseUrl = biodallianceBaseUrl): Promise<DallianceConstructor> {
  const global = globalThis as unknown as { Browser?: DallianceConstructor };
  if (global.Browser) return Promise.resolve(global.Browser);
  loading ??= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `${baseUrl}dalliance-compiled.js`;
    script.async = true;
    script.onload = () => (global.Browser ? resolve(global.Browser) : reject(new Error('Biodalliance loaded without a Browser.')));
    script.onerror = () => {
      loading = undefined;
      reject(new Error(`Biodalliance couldn’t load from ${baseUrl}.`));
    };
    document.head.append(script);
  });
  return loading;
}

/** Biodalliance draws on a canvas, which can't read CSS variables, so token colors such as var(--viz-seq-6) become their values. */
export function resolveTokens<T>(value: T, element: Element): T {
  if (typeof value === 'string') {
    const token = /^var\((--[\w-]+)\)$/.exec(value)?.[1];
    return (token ? getComputedStyle(element).getPropertyValue(token).trim() || value : value) as T;
  }
  if (Array.isArray(value)) return value.map((item: unknown) => resolveTokens(item, element)) as T;
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, resolveTokens(item, element)])) as T;
  return value;
}

/** With noSourceCSS, Biodalliance injects nothing, so its layout stylesheet is added once; its Bootstrap and Font Awesome never load. */
function loadLayoutStyles(baseUrl: string): void {
  const href = `${baseUrl}css/dalliance-scoped.css`;
  if (document.querySelector(`link[href="${href}"]`)) return;
  document.head.append(Object.assign(document.createElement('link'), { rel: 'stylesheet', href }));
}

let nextId = 0;

/** Biodalliance's images (spinners, toggles) carry no meaning of their own, so they get an empty alt as they appear. */
export function markImagesDecorative(root: HTMLElement): MutationObserver {
  const mark = () => root.querySelectorAll('img:not([alt])').forEach((image) => image.setAttribute('alt', ''));
  mark();
  const observer = new MutationObserver(mark);
  observer.observe(root, { childList: true, subtree: true });
  return observer;
}

/** Biodalliance with the live Humanbase site's tracks and settings. */
export class BiodallianceEngine implements GenomeBrowserEngine {
  #browser: DallianceBrowser | undefined;
  #shown: GenomeRegion | undefined;
  #settle: ReturnType<typeof setTimeout> | undefined;
  #holder: HTMLElement | undefined;
  #images: MutationObserver | undefined;
  #layout: ResizeObserver | undefined;
  #resize: ResizeObserver | undefined;
  /** The sources a page can show or hide, by track id, and the ids shown now. */
  readonly #toggled = new Map<string, Record<string, unknown>>();
  readonly #shownTracks = new Set<string>();
  #arrangement = noArrangement;
  /** Track ids in their usual order: sequence, the page's tracks, then genes. */
  #usualOrder: readonly string[] = [];
  #destroyed = false;
  #late: ReturnType<typeof setTimeout> | undefined;

  constructor(private readonly options: BiodallianceOptions = {}) {}

  async mount(container: HTMLElement, { label, assembly, region, tracks, hidden = [], arrangement = noArrangement, onRegionChange, onTrackLayout }: GenomeMountOptions): Promise<void> {
    // Biodalliance drops the port from a path-only prefix, so give it an absolute URL.
    const baseUrl = new URL(this.options.baseUrl ?? biodallianceBaseUrl, document.baseURI).href;
    const Browser = await loadBiodalliance(baseUrl);
    // The page may have moved on while the script loaded.
    if (this.#destroyed) return;
    const setup = (this.options.assemblies ?? humanbaseAssemblies)[assembly];
    if (!setup) throw new Error(`No Biodalliance setup for ${assembly}.`);
    // Biodalliance draws into an element it finds by id.
    const holder = document.createElement('div');
    holder.id = `humanbase-dalliance-${++nextId}`;
    if (!container.hasAttribute('role')) container.setAttribute('role', 'region');
    container.setAttribute('aria-label', label);
    container.append(holder);
    this.#holder = holder;
    this.#images = markImagesDecorative(holder);
    this.#shown = region;
    const options = resolveTokens({ ...humanbaseBrowserOptions, ...this.options.browserOptions }, container);
    if (options.noSourceCSS) loadLayoutStyles(baseUrl);
    const browser = new Browser({
      pageName: holder.id,
      prefix: baseUrl,
      cookieKey: `human-grc_${assembly}`,
      ...options,
      chr: withChr(region.chrom),
      viewStart: region.start,
      viewEnd: region.end,
      coordSystem: setup.coordSystem,
      sources: this.#sources(setup, tracks, hidden, container),
    });
    this.#browser = browser;
    await new Promise<void>((resolve, reject) => {
      this.#late = setTimeout(() => reject(new Error('Biodalliance didn’t finish loading its tracks.')), this.options.readyMs ?? 30_000);
      browser.addInitListener(() => {
        clearTimeout(this.#late);
        resolve();
      });
    });
    if (this.#destroyed) return;
    this.#usualOrder = genomeTrackList(assembly, tracks).map((track) => track.id);
    this.arrangeTracks(arrangement);
    if (onTrackLayout) this.#reportLayout(browser, holder, tracks, onTrackLayout);
    // Biodalliance's own shortcuts run only while its root has focus; a focusable page element keeps focus instead.
    if (container.tabIndex >= 0) holder.querySelector<HTMLElement>('.dalliance-root')?.addEventListener('focus', () => container.focus());
    // Biodalliance sizes itself once and keeps its scale on resize, so the page's region is put back afterwards.
    this.#resize = new ResizeObserver(() => {
      browser.resizeViewer();
      if (this.#shown) browser.setLocation(withChr(this.#shown.chrom), this.#shown.start, this.#shown.end);
    });
    this.#resize.observe(container);
    browser.addViewListener((chr, min, max) => {
      const moved = { chrom: withChr(chr), start: Math.round(min), end: Math.round(max) };
      clearTimeout(this.#settle);
      this.#settle = setTimeout(() => {
        if (this.#shown && moved.chrom === withChr(this.#shown.chrom) && moved.start === this.#shown.start && moved.end === this.#shown.end) return;
        this.#shown = moved;
        onRegionChange?.(moved);
      }, this.options.settleMs ?? 400);
    });
  }

  /** Reports each track's place whenever Biodalliance adds, resizes or reorders tracks. */
  #reportLayout(browser: DallianceBrowser, holder: HTMLElement, tracks: GenomeMountOptions['tracks'], report: (layout: readonly GenomeTrackLayout[]) => void): void {
    const metaOf = new Map(tracks.map((track) => [track.name, track.meta]));
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (this.#destroyed) return;
        const origin = holder.getBoundingClientRect().top;
        const layout = browser.tiers
          .filter((tier) => tier.row.isConnected && tier.row.offsetHeight > 0)
          .map((tier) => {
            const box = tier.row.getBoundingClientRect();
            const name = tier.dasSource.name ?? '';
            return { id: this.#idOf(tier) ?? name, name: tier.dasSource.title ?? name, meta: metaOf.get(name) ?? tier.dasSource.desc, top: Math.round(box.top - origin), height: Math.round(box.height) };
          })
          .sort((a, b) => a.top - b.top);
        report(layout);
      });
    };
    this.#layout = new ResizeObserver(measure);
    this.#layout.observe(holder);
    browser.tiers.forEach((tier) => this.#layout?.observe(tier.row));
    browser.addTierListener(measure);
    measure();
  }

  /** Biodalliance's sources, with the ones a page can toggle remembered by id; hidden ones start disabled. */
  #sources(setup: BiodallianceAssembly, tracks: GenomeMountOptions['tracks'], hidden: readonly string[], container: HTMLElement): Record<string, unknown>[] {
    const data = tracks.map((track) => ({
      name: track.name,
      bwgURI: trackFile(track),
      pinned: true,
      ...(!isSegmentTrack(track) && { zeroLine: 'var(--border-subtle)' }),
      ...(track.style && { style: Array.isArray(track.style) ? track.style : [track.style] }),
    }));
    const idOf = (source: Record<string, unknown>) =>
      source.twoBitURI ? sequenceTrack : source.title === 'Genes' && !source.disabled ? genesTrack : tracks.some((track) => track.name === source.name) ? String(source.name) : undefined;
    return resolveTokens([...setup.sources, ...data], container).map((source) => {
      const id = idOf(source);
      if (!id) return source;
      const shown = !hidden.includes(id);
      this.#toggled.set(id, source);
      if (shown) this.#shownTracks.add(id);
      return shown ? source : { ...source, disabled: true };
    });
  }

  /** The page's id for a tier, matched by its source's name. */
  #idOf(tier: DallianceTier): string | undefined {
    for (const [id, source] of this.#toggled) if (source.name === tier.dasSource.name) return id;
    return undefined;
  }

  arrangeTracks(arrangement: GenomeTrackArrangement): void {
    this.#arrangement = arrangement;
    const browser = this.#browser;
    if (!browser) return;
    const order = inOrder(this.#usualOrder, arrangement.order);
    const rank = (tier: DallianceTier, index: number) => {
      const at = order.indexOf(this.#idOf(tier) ?? '');
      return at === -1 ? order.length + index : at;
    };
    const ordered = browser.tiers.map((tier, index) => ({ tier, rank: rank(tier, index) })).sort((a, b) => a.rank - b.rank).map(({ tier }) => tier);
    const moved = ordered.some((tier, index) => tier !== browser.tiers[index] || !tier.pinned);
    for (const tier of ordered) {
      const { height, range } = arrangement.settings[this.#idOf(tier) ?? ''] ?? {};
      tier.mergeConfig({ height, forceMin: range?.[0], forceMax: range?.[1] });
    }
    if (!moved) return;
    browser.tiers.splice(0, browser.tiers.length, ...ordered);
    // Biodalliance draws pinned tiers first, so every tier is pinned to keep the page's order.
    ordered.forEach((tier) => (tier.pinned = true));
    browser.reorderTiers();
  }

  showTracks(hidden: readonly string[]): void {
    const browser = this.#browser;
    if (!browser) return;
    for (const [id, source] of this.#toggled) {
      const shown = !hidden.includes(id);
      if (shown === this.#shownTracks.has(id)) continue;
      if (shown) {
        browser.addTier(source);
        this.#shownTracks.add(id);
      } else {
        browser.removeTier(source);
        this.#shownTracks.delete(id);
      }
    }
    this.arrangeTracks(this.#arrangement);
  }

  exportSvg({ width, highlights, guideline, title }: GenomeExportOptions): Promise<Blob> {
    if (!this.#browser) return Promise.reject(new Error('Biodalliance hasn’t started yet.'));
    // Biodalliance writes its own location line, so a title only turns that line on.
    return Promise.resolve(this.#browser.makeSVG({ highlights, ruler: guideline ? 'center' : 'none', width, banner: false, region: Boolean(title) }));
  }

  showRegion(region: GenomeRegion): void {
    this.#shown = region;
    this.#browser?.setLocation(withChr(region.chrom), region.start, region.end);
  }

  highlight(position: { chrom: string; position: number } | undefined): void {
    this.#browser?.clearHighlights();
    if (position) this.#browser?.highlightRegion(withChr(position.chrom), position.position, position.position + 1);
  }

  destroy(): void {
    this.#destroyed = true;
    clearTimeout(this.#settle);
    clearTimeout(this.#late);
    this.#images?.disconnect();
    this.#layout?.disconnect();
    this.#resize?.disconnect();
    this.#holder?.remove();
    this.#browser = undefined;
  }
}
