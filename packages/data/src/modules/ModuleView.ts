import { ModuleResult, type ModuleFilter } from './ModuleResult';

export type ModuleTab = 'modules' | 'genes';
export type ModuleDisplay = 'graph' | 'table';

interface ModuleViewFields {
  tab: ModuleTab;
  /** The module open in the drawer. */
  module: number | undefined;
  showEdges: boolean;
  hideUnenriched: boolean;
  minimumSize: number;
  /** Where the terms come from; undefined means the result's first database. */
  database: string | undefined;
  display: ModuleDisplay;
  expanded: boolean;
}

const keys = ['tab', 'module', 'edges', 'all', 'min', 'db', 'display', 'expand'];

// How a module result is shown, kept in the URL beside the job's body_tag so a link or refresh shows the same view.
export class ModuleView implements ModuleViewFields {
  readonly tab: ModuleTab = 'modules';
  readonly module: number | undefined = undefined;
  readonly showEdges: boolean = false;
  readonly hideUnenriched: boolean = ModuleResult.defaultFilter.hideUnenriched;
  readonly minimumSize: number = ModuleResult.defaultFilter.minimumSize;
  readonly database: string | undefined = undefined;
  readonly display: ModuleDisplay = 'graph';
  readonly expanded: boolean = false;

  constructor(fields: Partial<ModuleViewFields> = {}) {
    Object.assign(this, Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== undefined)));
  }

  static fromSearch(search: URLSearchParams): ModuleView {
    const module = Number(search.get('module'));
    const minimum = Number(search.get('min'));
    return new ModuleView({
      tab: search.get('tab') === 'genes' ? 'genes' : 'modules',
      module: Number.isInteger(module) && module > 0 ? module : undefined,
      showEdges: search.get('edges') === '1',
      hideUnenriched: search.get('all') !== '1',
      minimumSize: Number.isInteger(minimum) && minimum >= 1 ? minimum : ModuleResult.defaultFilter.minimumSize,
      database: search.get('db') ?? undefined,
      display: search.get('display') === 'table' ? 'table' : 'graph',
      expanded: search.get('expand') === '1',
    });
  }

  get filter(): ModuleFilter {
    return { minimumSize: this.minimumSize, hideUnenriched: this.hideUnenriched };
  }

  /** The database the terms come from, falling back to the result's first. */
  databaseFor(result: ModuleResult): string {
    return this.database && result.databases.includes(this.database) ? this.database : (result.databases[0] ?? 'gene-ontology-bp');
  }

  with(changes: Partial<ModuleViewFields>): ModuleView {
    return new ModuleView({ ...this, ...changes });
  }

  applyTo(search: URLSearchParams): URLSearchParams {
    const next = new URLSearchParams(search);
    for (const key of keys) next.delete(key);
    if (this.tab === 'genes') next.set('tab', 'genes');
    if (this.module !== undefined) next.set('module', String(this.module));
    if (this.showEdges) next.set('edges', '1');
    if (!this.hideUnenriched) next.set('all', '1');
    if (this.minimumSize !== ModuleResult.defaultFilter.minimumSize) next.set('min', String(this.minimumSize));
    if (this.database) next.set('db', this.database);
    if (this.display === 'table') next.set('display', 'table');
    if (this.expanded) next.set('expand', '1');
    return next;
  }
}
