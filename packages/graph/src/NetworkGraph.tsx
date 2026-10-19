import { useEffect, useImperativeHandle, useLayoutEffect, useRef, type Ref } from 'react';
import { ForceGraphRenderer } from './ForceGraphRenderer';
import type { GraphData, GraphHighlight, GraphRenderer, GraphRendererFactory, GraphSelection } from './GraphRenderer';
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
  onSelectNode?: (id: string) => void;
  onSelectLink?: (source: string, target: string) => void;
  onSelectGroup?: (id: string) => void;
  /** Swap in another renderer, such as the live site's. Defaults to the plain force-directed one. */
  renderer?: GraphRendererFactory | undefined;
  className?: string;
  ref?: Ref<NetworkGraphHandle>;
}

const defaultRenderer: GraphRendererFactory = () => new ForceGraphRenderer();
const noHighlights: readonly GraphHighlight[] = [];

export function NetworkGraph({ data, label, selection = null, highlights = noHighlights, onSelectNode, onSelectLink, onSelectGroup, renderer, className, ref }: NetworkGraphProps) {
  const container = useRef<HTMLDivElement>(null);
  const instance = useRef<GraphRenderer | null>(null);
  const events = useRef({ onSelectNode, onSelectLink, onSelectGroup });
  useLayoutEffect(() => {
    events.current = { onSelectNode, onSelectLink, onSelectGroup };
  });

  useEffect(() => {
    if (!container.current) return;
    const graph = (renderer ?? defaultRenderer)();
    graph.mount(container.current, {
      label,
      onSelectNode: (id) => events.current.onSelectNode?.(id),
      onSelectLink: (source, target) => events.current.onSelectLink?.(source, target),
      onSelectGroup: (id) => events.current.onSelectGroup?.(id),
    });
    instance.current = graph;
    return () => {
      graph.destroy();
      instance.current = null;
    };
  }, [renderer, label]);

  useEffect(() => instance.current?.render(data), [data, renderer, label]);
  useEffect(() => instance.current?.select(selection), [selection, data, renderer, label]);
  useEffect(() => instance.current?.highlight(highlights), [highlights, data, renderer, label]);

  useImperativeHandle(ref, () => ({
    zoomBy: (factor) => instance.current?.zoomBy(factor),
    fit: () => instance.current?.fit(),
    exportSvg: () => instance.current?.exportSvg() ?? new Blob([], { type: 'image/svg+xml' }),
  }));

  return <div ref={container} className={['network-graph', className].filter(Boolean).join(' ')} />;
}
