import type { Network, NetworkEdge, NetworkSubset, NetworkView } from '@humanbase/data';
import { edgeBandsFrom, NetworkGraph, type GraphData, type GraphFocus, type GraphRendererFactory, type GraphSelection, type NetworkGraphHandle } from '@humanbase/graph';
import { ActionMenu, Checkbox, DataTooltip, GraphToolbar, KeyLegend, Slider, Spinner, useExportMenu, useImageFormats, type ActionMenuItem, type GraphAction } from '@humanbase/ui';
import { useMemo, useRef, useState, type ReactNode } from 'react';
import { ConnectionsTable } from './ConnectionsTable';
import { tooltipAt } from './graphTooltip';
import { networkFileName, networkText } from './networkExport';
import { useStarredHighlights } from './starredSets';

const zoomStep = 1.3;
const count = (n: number, noun: string) => `${n} ${noun}${n === 1 ? '' : 's'}`;

function resultLine({ genes, edges, hidden }: NetworkSubset, total: number, minConfidence: number): string {
  const query = genes.filter((gene) => gene.isQuery).length;
  const showing = genes.length === total ? `all ${genes.length}` : `${genes.length} of ${total}`;
  const split = `${count(query, 'query gene')} and ${count(genes.length - query, 'related gene')}`;
  const line = `Showing ${showing} genes: ${split}, ${count(edges.length, 'connection')} above ${minConfidence.toFixed(2)}.`;
  return hidden ? `${line} Genes with no connection above the cutoff are hidden.` : line;
}
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
  /** Starred sets use cross-organism annotation counts, for extended_universe on GIANT. */
  extendedUniverse?: boolean;
  onViewChange: (view: NetworkView) => void;
  onSelectGene: (entrez: number) => void;
  onSelectConnection: (source: number, target: number) => void;
  /** Empty space in the graph is clicked, or Escape is pressed there. */
  onClearSelection?: () => void;
  renderer?: GraphRendererFactory | undefined;
}

type Hovered = { kind: 'gene'; entrez: number; at: { x: number; y: number } } | { kind: 'connection'; source: number; target: number; at: { x: number; y: number } };

export function GraphPanel({ network, subset, view, minConfidence, label, tableCaption, networkTitle, selection, loading, canExpand = true, extendedUniverse = false, onViewChange, onSelectGene, onSelectConnection, onClearSelection, renderer }: GraphPanelProps) {
  const graph = useRef<NetworkGraphHandle>(null);
  const graphArea = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<Hovered>();
  const hover = useMemo<GraphFocus | null>(() => (hovered?.kind === 'gene' ? { id: String(hovered.entrez), links: [] } : null), [hovered]);
  const data = useMemo<GraphData | undefined>(
    () =>
      subset && {
        nodes: subset.genes.map((gene) => ({ id: String(gene.entrez), label: gene.symbol, query: gene.isQuery })),
        links: subset.edges.map((edge) => ({ source: String(edge.source.entrez), target: String(edge.target.entrez), weight: edge.weight })),
      },
    [subset],
  );
  const legendItems = useMemo(() => [...edgeBandsFrom(minConfidence)].reverse().map(({ label, color, width, opacity }) => ({ label, color, width, opacity })), [minConfidence]);
  const highlights = useStarredHighlights(network, subset?.genes, view.starred, extendedUniverse);
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
      <div className="graph-area" ref={graphArea} aria-busy={!data || undefined}>
        {data ? (
          <>
            <NetworkGraph
              ref={graph}
              data={data}
              label={label}
              selection={selection}
              highlights={highlights}
              hover={hover}
              renderer={renderer}
              onSelectNode={(id) => {
                setHovered(undefined);
                onSelectGene(Number(id));
              }}
              onSelectLink={(source, target) => {
                setHovered(undefined);
                onSelectConnection(Number(source), Number(target));
              }}
              onHoverNode={(id, anchor) => {
                const at = anchor && tooltipAt(graphArea.current, anchor);
                setHovered(id !== null && at ? { kind: 'gene', entrez: Number(id), at } : undefined);
              }}
              onHoverLink={(link) => {
                const at = link && tooltipAt(graphArea.current, link.anchor);
                setHovered(link && at ? { kind: 'connection', source: Number(link.source), target: Number(link.target), at } : undefined);
              }}
              {...(onClearSelection && { onClearSelection })}
            />
            {hovered && network && <GraphTooltip hovered={hovered} network={network} />}
          </>
        ) : (
          loading
        )}
      </div>
      )}
      <div className="graph-meta">
        <KeyLegend title="Connection" mark="line" items={legendItems} />
        {subset && (
          <p className="result-line" role="status">
            {resultLine(subset, total, minConfidence)}
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

function GraphTooltip({ hovered, network }: { hovered: Hovered; network: Network }) {
  if (hovered.kind === 'gene') {
    const found = network.genes.find((gene) => gene.entrez === hovered.entrez);
    if (!found) return null;
    return (
      <DataTooltip
        title={found.symbol}
        subtitle={found.name}
        rows={[found.isQuery ? ['Query gene', 'Yes'] : ['Score', Number.isNaN(found.score) ? 'None' : found.score.toFixed(2)]]}
        hint="Click for details"
        position={hovered.at}
      />
    );
  }
  const edge = network.edgeBetween(hovered.source, hovered.target);
  if (!edge) return null;
  return <DataTooltip title={`${edge.source.symbol} and ${edge.target.symbol}`} rows={[['Confidence', edge.weight.toFixed(2)]]} hint="Click for evidence" position={hovered.at} />;
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
