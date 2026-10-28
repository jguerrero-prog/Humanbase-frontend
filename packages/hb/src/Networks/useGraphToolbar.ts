import type { NetworkGraphHandle } from '@humanbase/graph';
import type { GraphAction } from '@humanbase/ui';
import type { RefObject } from 'react';

const zoomStep = 1.3;

export interface GraphToolbarOptions {
  /** True while the table stands in for the drawing. */
  asTable: boolean;
  /** Adds Expand, pressed while the graph fills the page. */
  expand?: { expanded: boolean; onToggle: () => void } | undefined;
}

/** The graph toolbar's buttons. Zoom and fit only apply to the drawing, so the table keeps just Expand. */
export function useGraphToolbar(graph: RefObject<NetworkGraphHandle | null>, { asTable, expand }: GraphToolbarOptions): GraphAction[][] {
  const expandAction: GraphAction[] = expand ? [{ label: 'Expand', icon: 'maximize', pressed: expand.expanded, onSelect: expand.onToggle }] : [];
  if (asTable) return expand ? [expandAction] : [];
  return [
    [
      { label: 'Zoom in', icon: 'zoom-in', onSelect: () => graph.current?.zoomBy(zoomStep) },
      { label: 'Zoom out', icon: 'zoom-out', onSelect: () => graph.current?.zoomBy(1 / zoomStep) },
      { label: 'Fit to screen', icon: 'fit', onSelect: () => graph.current?.fit() },
      ...expandAction,
    ],
  ];
}
