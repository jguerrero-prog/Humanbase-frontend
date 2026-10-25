import { useEffect, useImperativeHandle, useLayoutEffect, useRef, type Ref } from 'react';
import { ForceGraphRenderer } from './ForceGraphRenderer';
import type { GraphData, GraphFocus, GraphHighlight, GraphRenderer, GraphRendererFactory, GraphSelection } from './GraphRenderer';
import './graph.css';

export interface NetworkGraphHandle {
  zoomBy(factor: number): void;
  fit(): void;
  exportSvg(): Blob;
}

export interface NetworkGraphProps {
  data: GraphData;
  label: string;
  selection?: GraphSelection;
  /** Starred sets, ringed in their colors. */
  highlights?: readonly GraphHighlight[];
  /** The gene to ring with a dashed ring, with the links to draw from it. */
  hover?: GraphFocus | null;
  onSelectNode?: (id: string) => void;
  onSelectLink?: (source: string, target: string) => void;
  onSelectGroup?: (id: string) => void;
  onHoverNode?: (id: string | null, anchor?: DOMRect) => void;
  /** Swap in another renderer, such as the live site's. Defaults to the plain force-directed one. */
  renderer?: GraphRendererFactory | undefined;
  className?: string;
  ref?: Ref<NetworkGraphHandle>;
}

const defaultRenderer: GraphRendererFactory = () => new ForceGraphRenderer();
const noHighlights: readonly GraphHighlight[] = [];

export function NetworkGraph({ data, label, selection = null, highlights = noHighlights, hover = null, onSelectNode, onSelectLink, onSelectGroup, onHoverNode, renderer, className, ref }: NetworkGraphProps) {
  const container = useRef<HTMLDivElement>(null);
  const instance = useRef<GraphRenderer | null>(null);
  const events = useRef({ label, onSelectNode, onSelectLink, onSelectGroup, onHoverNode });
  useLayoutEffect(() => {
    events.current = { label, onSelectNode, onSelectLink, onSelectGroup, onHoverNode };
  });

  useEffect(() => {
    if (!container.current) return;
    const graph = (renderer ?? defaultRenderer)();
    graph.mount(container.current, {
      label: events.current.label,
      onSelectNode: (id) => events.current.onSelectNode?.(id),
      onSelectLink: (source, target) => events.current.onSelectLink?.(source, target),
      onSelectGroup: (id) => events.current.onSelectGroup?.(id),
      onHoverNode: (id, anchor) => events.current.onHoverNode?.(id, anchor),
    });
    instance.current = graph;
    return () => {
      graph.destroy();
      instance.current = null;
    };
  }, [renderer]);

  useEffect(() => instance.current?.setLabel(label), [label, renderer]);
  useEffect(() => instance.current?.render(data), [data, renderer]);
  useEffect(() => instance.current?.select(selection), [selection, data, renderer]);
  useEffect(() => instance.current?.highlight(highlights), [highlights, data, renderer]);
  useEffect(() => instance.current?.hover(hover), [hover, data, renderer]);

  useImperativeHandle(ref, () => ({
    zoomBy: (factor) => instance.current?.zoomBy(factor),
    fit: () => instance.current?.fit(),
    exportSvg: () => instance.current?.exportSvg() ?? new Blob([], { type: 'image/svg+xml' }),
  }));

  return <div ref={container} className={['network-graph', className].filter(Boolean).join(' ')} />;
}
