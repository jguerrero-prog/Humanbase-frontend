import type { NetworkViewOptions } from './Network';

export type NetworkDisplay = 'graph' | 'table';

export const networkTabs = ['network', 'expression', 'process', 'processes', 'diseases'] as const;
export type NetworkTab = (typeof networkTabs)[number];

export type NetworkSelection = { kind: 'gene'; entrez: number } | { kind: 'connection'; source: number; target: number };

// How a network is shown: filters applied in the browser, kept in the URL beside the request.
export class NetworkView {
  static readonly defaultShown = 15;
  static readonly shownRange = [5, 50] as const;

  constructor(
    readonly shown = NetworkView.defaultShown,
    /** Undefined until someone moves the slider, so each network starts at its own suggested cutoff. */
    readonly minConfidence: number | undefined = undefined,
    readonly prioritizeUniqueness = false,
    readonly selection: NetworkSelection | undefined = undefined,
    /** The graph, or the same connections as a table. */
    readonly display: NetworkDisplay = 'graph',
    /** The graph takes the full width and the genes panel moves below it. */
    readonly expanded = false,
    readonly tab: NetworkTab = 'network',
  ) {}

  static fromSearch(search: URLSearchParams): NetworkView {
    const [low, high] = NetworkView.shownRange;
    const shown = Number(search.get('shown'));
    const confidence = Number(search.get('confidence'));
    return new NetworkView(
      Number.isInteger(shown) && shown >= low && shown <= high ? shown : NetworkView.defaultShown,
      search.has('confidence') && confidence >= 0 && confidence <= 1 ? confidence : undefined,
      search.get('unique') === '1',
      NetworkView.readSelection(search),
      search.get('display') === 'table' ? 'table' : 'graph',
      search.get('expand') === '1',
      networkTabs.find((tab) => tab === search.get('tab')) ?? 'network',
    );
  }

  private static readSelection(search: URLSearchParams): NetworkSelection | undefined {
    const gene = Number(search.get('gene'));
    if (Number.isInteger(gene) && gene > 0) return { kind: 'gene', entrez: gene };
    const [source, target] = (search.get('connection') ?? '').split('-').map(Number);
    if (source && target) return { kind: 'connection', source, target };
    return undefined;
  }

  options(suggestedConfidence: number): NetworkViewOptions {
    return { shown: this.shown, minConfidence: this.minConfidence ?? suggestedConfidence, prioritizeUniqueness: this.prioritizeUniqueness };
  }

  with(changes: Partial<Pick<NetworkView, 'shown' | 'minConfidence' | 'prioritizeUniqueness' | 'selection' | 'display' | 'expanded' | 'tab'>>): NetworkView {
    const next = { ...this, ...changes };
    return new NetworkView(next.shown, next.minConfidence, next.prioritizeUniqueness, next.selection, next.display, next.expanded, next.tab);
  }

  /** Writes the view into a copy of the page's search parameters. */
  applyTo(search: URLSearchParams): URLSearchParams {
    const next = new URLSearchParams(search);
    for (const key of ['shown', 'confidence', 'unique', 'gene', 'connection', 'display', 'expand', 'tab']) next.delete(key);
    if (this.shown !== NetworkView.defaultShown) next.set('shown', String(this.shown));
    if (this.minConfidence !== undefined) next.set('confidence', String(this.minConfidence));
    if (this.prioritizeUniqueness) next.set('unique', '1');
    if (this.selection?.kind === 'gene') next.set('gene', String(this.selection.entrez));
    if (this.selection?.kind === 'connection') next.set('connection', `${this.selection.source}-${this.selection.target}`);
    if (this.display === 'table') next.set('display', 'table');
    if (this.expanded) next.set('expand', '1');
    if (this.tab !== 'network') next.set('tab', this.tab);
    return next;
  }
}
