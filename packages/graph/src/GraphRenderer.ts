export interface GraphNode {
  id: string;
  label: string;
  /** Query genes are drawn larger and in ink. */
  query: boolean;
  /** The group, such as a module, the gene belongs to. */
  group?: string;
  /** What the circle's area grows with, such as 1 plus a module gene's connections; drawn between the node and query gene sizes. */
  size?: number;
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

/** A gene with its own connections, drawn even when the graph's links are hidden. */
export interface GraphFocus {
  id: string;
  links: readonly GraphLink[];
}

/** A node selection with links draws them and keeps their genes and the node's group at full strength. */
export type GraphSelection = { kind: 'node'; id: string; links?: readonly GraphLink[] } | { kind: 'link'; source: string; target: string } | { kind: 'group'; id: string } | null;

export interface GraphEvents {
  onSelectNode?: (id: string) => void;
  onSelectLink?: (source: string, target: string) => void;
  onSelectGroup?: (id: string) => void;
  /** A gene is hovered or focused, with where it is on screen, or null when it no longer is. */
  onHoverNode?: (id: string | null, anchor?: DOMRect) => void;
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
  /** Lays the graph out again only when its genes, groups or connections change; new names alone keep every position. */
  render(data: GraphData): void;
  /** Renames the graph for screen readers without redrawing it. */
  setLabel(label: string): void;
  select(selection: GraphSelection): void;
  /** Rings a gene with a dashed ring and draws its links; null clears it. */
  hover(focus: GraphFocus | null): void;
  /** Rings each set's genes in its color, in the order given, and shades the area around them. An empty list clears it. */
  highlight(sets: readonly GraphHighlight[]): void;
  zoomBy(factor: number): void;
  fit(): void;
  /** A standalone SVG file of what is drawn, with colors resolved. */
  exportSvg(): Blob;
  destroy(): void;
}

export type GraphRendererFactory = () => GraphRenderer;
