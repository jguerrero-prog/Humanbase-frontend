import type { Network, NetworkEdge, NetworkSubset, NetworkView } from '@humanbase/data';
import { edgeBands, NetworkGraph, type GraphData, type GraphRendererFactory, type GraphSelection, type NetworkGraphHandle } from '@humanbase/graph';
import { ActionMenu, Checkbox, GraphToolbar, KeyLegend, Slider, Spinner, useExportMenu, useImageFormats, type ActionMenuItem, type GraphAction } from '@humanbase/ui';
import { useMemo, useRef, type ReactNode } from 'react';
import { ConnectionsTable } from './ConnectionsTable';
import { networkFileName, networkText } from './networkExport';
import { useStarredHighlights } from './starredSets';

const legendItems = [...edgeBands].reverse().map(({ label, color, width }) => ({ label, color, width }));
const zoomStep = 1.3;
const pngWidth = 1080;

export interface GraphPanelProps {
  /** The whole response, whose genes the starred sets are looked up for. */
  network: Network | undefined;
  /** Undefined while the network loads. */
  subset: NetworkSubset | undefined;
  view: NetworkView;
  minConfidence: number;
  label: string;
  /** Names the connections table that replaces the graph in View as table. */
  tableCaption: string;
  /** Names the downloads, as the live site does: "global", "adipose_tissue". */
  networkTitle: string;
  selection: GraphSelection;
  loading: ReactNode;
  /** Off when two networks are compared, since neither can take the full width. */
  canExpand?: boolean;
  onViewChange: (view: NetworkView) => void;
  onSelectGene: (entrez: number) => void;
  onSelectConnection: (source: number, target: number) => void;
  renderer?: GraphRendererFactory | undefined;
}

export function GraphPanel({ network, subset, view, minConfidence, label, tableCaption, networkTitle, selection, loading, canExpand = true, onViewChange, onSelectGene, onSelectConnection, renderer }: GraphPanelProps) {
  const graph = useRef<NetworkGraphHandle>(null);
  const data = useMemo<GraphData | undefined>(
    () =>
      subset && {
        nodes: subset.genes.map((gene) => ({ id: String(gene.entrez), label: gene.symbol, query: gene.isQuery })),
        links: subset.edges.map((edge) => ({ source: String(edge.source.entrez), target: String(edge.target.entrez), weight: edge.weight })),
      },
    [subset],
  );
  const highlights = useStarredHighlights(network, subset?.genes, view.starred);
  const starredItems: ActionMenuItem[] = highlights.length
    ? [
        ...highlights.map((set) => ({
          label: `Remove ${set.label}`,
          description: `${set.nodes.length} ${set.nodes.length === 1 ? 'gene' : 'genes'} in the graph`,
          swatch: set.color,
          onSelect: () => onViewChange(view.toggleStar(set.id)),
        })),
        { label: 'Clear all starred sets', dividerBefore: true, onSelect: () => onViewChange(view.with({ starred: [] })) },
      ]
    : [{ label: 'Star a process or tissue to highlight its genes', disabled: true }];
  const shown = subset?.genes.length ?? 0;
  const total = network?.genes.length ?? 0;

  const asTable = view.display === 'table';
  const expand: GraphAction[] = canExpand ? [{ label: 'Expand', icon: 'maximize', pressed: view.expanded, onSelect: () => onViewChange(view.with({ expanded: !view.expanded })) }] : [];
  const images = useImageFormats(asTable ? undefined : graph, pngWidth);
  const text = (edges: readonly NetworkEdge[] | undefined) => ({ extension: 'txt', type: 'text/plain', disabled: !edges, make: () => networkText(edges ?? []) });
  const downloads = useExportMenu(
    () => networkFileName(networkTitle),
    [
      ...images,
      { label: 'Download visible network as text', ...text(subset?.edges) },
      { label: 'Download entire network as text', ...text(network?.edges) },
    ],
  );
  // Zoom and fit only apply to the drawing, so the table keeps just Expand.
  const groups: GraphAction[][] = asTable
    ? [expand]
    : [
        [
          { label: 'Zoom in', icon: 'zoom-in', onSelect: () => graph.current?.zoomBy(zoomStep) },
          { label: 'Zoom out', icon: 'zoom-out', onSelect: () => graph.current?.zoomBy(1 / zoomStep) },
          { label: 'Fit to screen', icon: 'fit', onSelect: () => graph.current?.fit() },
          ...expand,
        ],
      ];
  const toolbar = groups.filter((group) => group.length > 0);

  return (
    <>
      <GraphToolbar label="Graph controls" groups={toolbar} tableLabel={asTable ? 'View as graph' : 'View as table'} onViewTable={() => onViewChange(view.with({ display: asTable ? 'graph' : 'table' }))}>
        <ActionMenu label="Download network" icon="download" items={downloads} />
        {!asTable && <ActionMenu label={highlights.length ? `Starred sets, ${highlights.length}` : 'Starred sets'} icon="star" items={starredItems} />}
      </GraphToolbar>
      {asTable && subset ? (
        <ConnectionsTable
          edges={subset.edges}
          caption={tableCaption}
          selected={selection?.kind === 'link' ? { source: Number(selection.source), target: Number(selection.target) } : undefined}
          onSelectConnection={onSelectConnection}
        />
      ) : (
      <div className="graph-area" aria-busy={!data || undefined}>
        {data ? (
          <NetworkGraph
            ref={graph}
            data={data}
            label={label}
            selection={selection}
            highlights={highlights}
            renderer={renderer}
            onSelectNode={(id) => onSelectGene(Number(id))}
            onSelectLink={(source, target) => onSelectConnection(Number(source), Number(target))}
          />
        ) : (
          loading
        )}
      </div>
      )}
      <div className="graph-meta">
        <KeyLegend title="Connection" mark="line" items={legendItems} />
        {subset && (
          <p className="result-line" role="status">
            Showing {shown === total ? `all ${shown}` : `${shown} of ${total}`} genes, {subset.edges.length} connections at {minConfidence.toFixed(2)} or more
          </p>
        )}
      </div>
      <div className="graph-filters">
        <Slider label="Minimum confidence" min={0} max={1} step={0.01} value={minConfidence} onChange={(value) => onViewChange(view.with({ minConfidence: value }))} />
        <Slider label="Genes shown" min={5} max={50} step={1} value={view.shown} onChange={(value) => onViewChange(view.with({ shown: value }))} />
      </div>
      <Checkbox label="Prioritize by uniqueness to the query genes" checked={view.prioritizeUniqueness} onChange={(event) => onViewChange(view.with({ prioritizeUniqueness: event.target.checked }))} />
    </>
  );
}

export function GraphLoading({ title, text, note }: { title?: string | undefined; text?: string | undefined; note?: string | undefined }) {
  return (
    <div className="graph-loading" role="status">
      {title ? (
        <>
          <p className="graph-loading-title">{title}</p>
          {text && <p>{text}</p>}
          <Spinner size={20} />
          {note && <p className="result-note">{note}</p>}
        </>
      ) : (
        <p className="graph-loading-inline">
          <Spinner size={16} /> Building the network…
        </p>
      )}
    </div>
  );
}
