import type { NetworkViewOptions } from './Network';

export type NetworkDisplay = 'graph' | 'table';

export const networkTabs = ['network', 'expression', 'process', 'processes', 'diseases'] as const;
export type NetworkTab = (typeof networkTabs)[number];

/** The first network, or the one compared beside it. */
export type NetworkPane = 'main' | 'compare';

// Filters belong to one graph, so the compared graph keeps its own under prefixed keys.
const paneKeys = ['shown', 'confidence', 'unique', 'display'] as const;
const keyFor = (key: (typeof paneKeys)[number], pane: NetworkPane) => (pane === 'compare' ? `compare_${key}` : key);

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
    /** Which network the genes panel and detail follow when two are compared. */
    readonly focus: NetworkPane = 'main',
  ) {}

  static fromSearch(search: URLSearchParams, pane: NetworkPane = 'main'): NetworkView {
    const [low, high] = NetworkView.shownRange;
    const shown = Number(search.get(keyFor('shown', pane)));
    const confidence = Number(search.get(keyFor('confidence', pane)));
    return new NetworkView(
      Number.isInteger(shown) && shown >= low && shown <= high ? shown : NetworkView.defaultShown,
      search.has(keyFor('confidence', pane)) && confidence >= 0 && confidence <= 1 ? confidence : undefined,
      search.get(keyFor('unique', pane)) === '1',
      NetworkView.readSelection(search),
      search.get(keyFor('display', pane)) === 'table' ? 'table' : 'graph',
      search.get('expand') === '1',
      networkTabs.find((tab) => tab === search.get('tab')) ?? 'network',
      search.get('focus') === 'compare' ? 'compare' : 'main',
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

  with(changes: Partial<Pick<NetworkView, 'shown' | 'minConfidence' | 'prioritizeUniqueness' | 'selection' | 'display' | 'expanded' | 'tab' | 'focus'>>): NetworkView {
    const next = { ...this, ...changes };
    return new NetworkView(next.shown, next.minConfidence, next.prioritizeUniqueness, next.selection, next.display, next.expanded, next.tab, next.focus);
  }

  /** Writes the view into a copy of the page's search parameters. The compared graph's filters go under compare_ keys; selection, tab and focus are shared. */
  applyTo(search: URLSearchParams, pane: NetworkPane = 'main'): URLSearchParams {
    const next = new URLSearchParams(search);
    for (const key of paneKeys) next.delete(keyFor(key, pane));
    if (this.shown !== NetworkView.defaultShown) next.set(keyFor('shown', pane), String(this.shown));
    if (this.minConfidence !== undefined) next.set(keyFor('confidence', pane), String(this.minConfidence));
    if (this.prioritizeUniqueness) next.set(keyFor('unique', pane), '1');
    if (this.display === 'table') next.set(keyFor('display', pane), 'table');
    for (const key of ['gene', 'connection', 'expand', 'tab', 'focus']) next.delete(key);
    if (this.selection?.kind === 'gene') next.set('gene', String(this.selection.entrez));
    if (this.selection?.kind === 'connection') next.set('connection', `${this.selection.source}-${this.selection.target}`);
    if (this.expanded) next.set('expand', '1');
    if (this.tab !== 'network') next.set('tab', this.tab);
    if (this.focus === 'compare') next.set('focus', 'compare');
    return next;
  }
}
