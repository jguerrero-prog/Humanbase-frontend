export interface GraphNode {
  id: string;
  label: string;
  /** Query genes are drawn larger and in ink. */
  query: boolean;
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
}

export type GraphSelection = { kind: 'node'; id: string } | { kind: 'link'; source: string; target: string } | null;

export interface GraphEvents {
  onSelectNode?: (id: string) => void;
  onSelectLink?: (source: string, target: string) => void;
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
  zoomBy(factor: number): void;
  fit(): void;
  /** A standalone SVG file of what is drawn, with colors resolved. */
  exportSvg(): Blob;
  destroy(): void;
}

export type GraphRendererFactory = () => GraphRenderer;
