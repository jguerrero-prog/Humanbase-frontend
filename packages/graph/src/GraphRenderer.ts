export interface GraphNode {
  id: string;
  label: string;
  /** Query genes are drawn larger and in ink. */
  query: boolean;
  /** The group, such as a module, the gene belongs to. */
  group?: string;
}

/** A cluster of genes drawn together, such as a module. */
export interface GraphGroup {
  id: string;
  label: string;
  /** A color custom property, such as `--viz-cat-1`. */
  color: string;
}

export interface GraphLink {
  source: string;
  target: string;
  /** Confidence from 0 to 1. */
  weight: number;
}

export interface GraphData {
  nodes: readonly GraphNode[];
  links: readonly GraphLink[];
  /** When present, genes are drawn as one labeled cluster per group. */
  groups?: readonly GraphGroup[];
}

/** A starred set of genes, such as a tissue or process, highlighted in the graph. */
export interface GraphHighlight {
  id: string;
  label: string;
  /** A color custom property, such as `--viz-cat-1`. */
  color: string;
  /** Node ids; genes not in the graph are ignored. */
  nodes: readonly string[];
}

export type GraphSelection ={ kind: 'node'; id: string } | { kind: 'link'; source: string; target: string } | { kind: 'group'; id: string } | null;

export interface GraphEvents {
  onSelectNode?: (id: string) => void;
  onSelectLink?: (source: string, target: string) => void;
  onSelectGroup?: (id: string) => void;
}

export interface MountOptions extends GraphEvents {
  /** Names the graph for screen readers, such as "Network of IL1B and 15 related genes". */
  label: string;
}

/**
 * Anything that can draw a Humanbase network. The front end only talks to this interface,
 * so a fork can swap in another renderer, such as the one the live site uses.
 */
export interface GraphRenderer {
  mount(container: HTMLElement, options: MountOptions): void;
  render(data: GraphData): void;
  select(selection: GraphSelection): void;
  /** Rings each set's genes in its color, in the order given, and shades the area around them. An empty list clears it. */
  highlight(sets: readonly GraphHighlight[]): void;
  zoomBy(factor: number): void;
  fit(): void;
  /** A standalone SVG file of what is drawn, with colors resolved. */
  exportSvg(): Blob;
  destroy(): void;
}

export type GraphRendererFactory = () => GraphRenderer;
