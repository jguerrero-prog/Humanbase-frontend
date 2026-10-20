import { withChr, type GenomeBrowserEngine, type GenomeMountOptions, type GenomeRegion } from '../GenomeBrowserEngine';
import { humanbaseAssemblies, humanbaseBrowserOptions, type BiodallianceAssembly } from './humanbaseConfig';

/** The parts of Biodalliance's Browser this engine calls. */
interface DallianceBrowser {
  setLocation(chr: string, min: number, max: number, callback?: (error?: unknown) => void): void;
  highlightRegion(chr: string, min: number, max: number): void;
  clearHighlights(): void;
  addViewListener(listener: (chr: string, min: number, max: number) => void): void;
  addInitListener(listener: () => void): void;
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

export const biodallianceRelease = 'https://www.biodalliance.org/release-0.13/';

let loading: Promise<DallianceConstructor> | undefined;

/** Loads Biodalliance once per page, from its own site or a fork's copy. */
export function loadBiodalliance(baseUrl = biodallianceRelease): Promise<DallianceConstructor> {
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
  #destroyed = false;

  constructor(private readonly options: BiodallianceOptions = {}) {}

  async mount(container: HTMLElement, { label, assembly, region, tracks, onRegionChange }: GenomeMountOptions): Promise<void> {
    const baseUrl = this.options.baseUrl ?? biodallianceRelease;
    const Browser = await loadBiodalliance(baseUrl);
    // The page may have moved on while the script loaded.
    if (this.#destroyed) return;
    const setup = (this.options.assemblies ?? humanbaseAssemblies)[assembly];
    if (!setup) throw new Error(`No Biodalliance setup for ${assembly}.`);
    // Biodalliance draws into an element it finds by id.
    const holder = document.createElement('div');
    holder.id = `humanbase-dalliance-${++nextId}`;
    container.setAttribute('role', 'region');
    container.setAttribute('aria-label', label);
    container.append(holder);
    this.#holder = holder;
    this.#images = markImagesDecorative(holder);
    this.#shown = region;
    const browser = new Browser({
      pageName: holder.id,
      prefix: baseUrl,
      cookieKey: `human-grc_${assembly}`,
      ...humanbaseBrowserOptions,
      ...this.options.browserOptions,
      chr: withChr(region.chrom),
      viewStart: region.start,
      viewEnd: region.end,
      coordSystem: setup.coordSystem,
      sources: [...setup.sources, ...tracks.map((track) => ({ name: track.name, bwgURI: track.bigWigUrl, pinned: true, ...(track.style ? { style: [track.style] } : {}) }))],
    });
    this.#browser = browser;
    await new Promise<void>((resolve, reject) => {
      const late = setTimeout(() => reject(new Error('Biodalliance didn’t finish loading its tracks.')), this.options.readyMs ?? 30_000);
      browser.addInitListener(() => {
        clearTimeout(late);
        resolve();
      });
    });
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
    this.#images?.disconnect();
    this.#holder?.remove();
    this.#browser = undefined;
  }
}
