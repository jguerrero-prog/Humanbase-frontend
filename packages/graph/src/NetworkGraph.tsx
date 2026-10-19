import { useEffect, useImperativeHandle, useLayoutEffect, useRef, type Ref } from 'react';
import { ForceGraphRenderer } from './ForceGraphRenderer';
import type { GraphData, GraphRenderer, GraphRendererFactory, GraphSelection } from './GraphRenderer';
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
  onSelectNode?: (id: string) => void;
  onSelectLink?: (source: string, target: string) => void;
  /** Swap in another renderer, such as the live site's. Defaults to the plain force-directed one. */
  renderer?: GraphRendererFactory | undefined;
  className?: string;
  ref?: Ref<NetworkGraphHandle>;
}

const defaultRenderer: GraphRendererFactory = () => new ForceGraphRenderer();

export function NetworkGraph({ data, label, selection = null, onSelectNode, onSelectLink, renderer, className, ref }: NetworkGraphProps) {
  const container = useRef<HTMLDivElement>(null);
  const instance = useRef<GraphRenderer | null>(null);
  const events = useRef({ onSelectNode, onSelectLink });
  useLayoutEffect(() => {
    events.current = { onSelectNode, onSelectLink };
  });

  useEffect(() => {
    if (!container.current) return;
    const graph = (renderer ?? defaultRenderer)();
    graph.mount(container.current, {
      label,
      onSelectNode: (id) => events.current.onSelectNode?.(id),
      onSelectLink: (source, target) => events.current.onSelectLink?.(source, target),
    });
    instance.current = graph;
    return () => {
      graph.destroy();
      instance.current = null;
    };
  }, [renderer, label]);

  useEffect(() => instance.current?.render(data), [data, renderer, label]);
  useEffect(() => instance.current?.select(selection), [selection, data, renderer, label]);

  useImperativeHandle(ref, () => ({
    zoomBy: (factor) => instance.current?.zoomBy(factor),
    fit: () => instance.current?.fit(),
    exportSvg: () => instance.current?.exportSvg() ?? new Blob([], { type: 'image/svg+xml' }),
  }));

  return <div ref={container} className={['network-graph', className].filter(Boolean).join(' ')} />;
}
