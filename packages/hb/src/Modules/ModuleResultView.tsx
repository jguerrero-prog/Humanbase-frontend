import { dataVersionNames, useModuleGenes, type GeneHit, type Integration, type ModuleResult, type ModuleView } from '@humanbase/data';
import { NetworkGraph, type GraphData, type GraphFocus, type GraphLink, type GraphRendererFactory, type GraphSelection, type NetworkGraphHandle } from '@humanbase/graph';
import { ActionMenu, Button, Checkbox, DataTooltip, genesWord, GraphToolbar, HeaderCell, KeyLegend, ResultHeader, ResultLayout, SearchField, Select, Table, TableSkeleton, TextInput } from '@humanbase/ui';
import { useMemo, useRef, useState, type ReactNode } from 'react';
import { ModuleDrawer } from './ModuleDrawer';
import { colorOf, moduleColors } from './moduleColors';
import { useModuleDownloads } from './moduleExport';
import { ModuleGeneRow, moduleGenes, ModuleGenesTable } from './ModuleGenesTable';
import { ModulesTable } from './ModulesTable';
import { useGraphToolbar } from '../Networks/useGraphToolbar';
import { tooltipAt } from '../Networks/graphTooltip';
import '../Networks/Networks.css';
import './Modules.css';

export interface ModuleResultViewProps {
  result: ModuleResult;
  title: string;
  view: ModuleView;
  /** Tissue networks for the result's data version; changing the tissue starts a new job. */
  tissues: readonly Integration[];
  starting: boolean;
  /** Shown under the header, such as which annotations the result used. */
  notice?: ReactNode;
  onViewChange: (view: ModuleView) => void;
  onRename: () => void;
  onEditGenes: () => void;
  onTissueChange: (slug: string) => void;
  renderer?: GraphRendererFactory | undefined;
}

const linksOf = (result: ModuleResult, entrez: number): GraphLink[] => result.neighbors(entrez).map((neighbor) => ({ source: String(entrez), target: String(neighbor.entrez), weight: neighbor.weight }));

export function ModuleResultView({ result, title, view, tissues, starting, notice, onViewChange, onRename, onEditGenes, onTissueChange, renderer }: ModuleResultViewProps) {
  const graph = useRef<NetworkGraphHandle>(null);
  const [find, setFind] = useState('');
  const names = useModuleGenes(result);
  const database = view.databaseFor(result);
  const { minimumSize, hideUnenriched } = view;
  const shown = useMemo(() => result.shown(database, { minimumSize, hideUnenriched }), [result, database, minimumSize, hideUnenriched]);
  const colors = useMemo(() => moduleColors(result.modules), [result]);
  const geneModule = view.gene === undefined ? undefined : result.moduleOf(view.gene);
  const open = geneModule ?? (view.module === undefined ? undefined : result.module(view.module));
  const openGene = geneModule && view.gene;
  // A gene hovered in the graph carries where its tooltip goes; one hovered in a table doesn't.
  const [hovered, setHovered] = useState<{ entrez: number; tooltip?: { x: number; y: number } }>();
  const [hoveredLink, setHoveredLink] = useState<{ source: number; target: number; tooltip: { x: number; y: number } }>();
  // A module hovered in the graph or in the modules table; both show it.
  const [hoveredGroup, setHoveredGroup] = useState<number>();
  const graphArea = useRef<HTMLDivElement>(null);
  const selectModule = (id: number) => {
    setHovered(undefined);
    onViewChange(view.with({ module: id, gene: undefined }));
  };
  const selectGene = (entrez: number) => {
    const module = result.moduleOf(entrez);
    setHovered(undefined);
    if (module) onViewChange(view.with({ module: module.id, gene: entrez }));
  };

  const connections = useMemo(() => result.connectionCounts(shown.flatMap((module) => module.genes)), [result, shown]);
  const data = useMemo<GraphData>(() => {
    const inShown = new Set(shown.flatMap((module) => module.genes));
    return {
      groups: shown.map((module) => ({ id: String(module.id), label: module.label, ...colorOf(colors, module.id) })),
      nodes: shown.flatMap((module) =>
        module.genes.map((entrez) => ({ id: String(entrez), label: names.data?.get(entrez)?.symbol ?? String(entrez), query: false, group: String(module.id), size: connections.get(entrez) ?? 1 })),
      ),
      links: result.edges.filter(([source, target]) => inShown.has(source) && inShown.has(target)).map(([source, target, weight]) => ({ source: String(source), target: String(target), weight })),
      linksHidden: !view.showEdges,
    };
  }, [shown, colors, names.data, view.showEdges, result.edges, connections]);

  const selection = useMemo<GraphSelection>(() => {
    if (openGene) return { kind: 'node', id: String(openGene), links: linksOf(result, openGene) };
    return open ? { kind: 'group', id: String(open.id) } : null;
  }, [open, openGene, result]);
  const hover = useMemo<GraphFocus | null>(
    () => (hovered ? { id: String(hovered.entrez), links: hovered.tooltip ? linksOf(result, hovered.entrez) : [] } : null),
    [hovered, result],
  );

  const suggestions = useMemo(() => {
    const text = find.trim().toLowerCase();
    if (!text || !names.data) return [];
    return [...names.data.values()].filter((gene) => gene.symbol.toLowerCase().startsWith(text) && result.moduleOf(gene.entrez)).slice(0, 8);
  }, [find, names.data, result]);

  const asTable = view.display === 'table';
  const downloads = useModuleDownloads({ result, modules: shown, database, tissues, graph: asTable ? undefined : graph });
  const toolbar = useGraphToolbar(graph, { asTable, expand: { expanded: view.expanded, onToggle: () => onViewChange(view.with({ expanded: !view.expanded })) } });

  const enriched = result.enrichedCount(database);
  const colored = shown.filter((module) => colors.get(module.id));
  const legendItems = [
    ...colored.map((module) => ({ label: module.label, ...colorOf(colors, module.id) })),
    ...(colored.length < shown.length ? [{ label: 'Other modules', ...colorOf(colors, Number.NaN) }] : []),
  ];
  const summary = `Showing ${shown.length} ${view.hideUnenriched ? 'enriched ' : ''}${shown.length === 1 ? 'module' : 'modules'} of ${view.minimumSize === 1 ? '1 gene' : `${view.minimumSize} genes`} or more. ${view.showEdges ? 'Edges shown.' : 'Edges hidden.'}`;

  const header = (
    <>
      <ResultHeader
        crumbs={[{ label: 'Modules', href: '/?analysis=modules' }, { label: title }]}
        title={title}
        context={[
          { name: 'Data version', value: dataVersionNames[result.version] },
          { name: 'Modules', value: `${enriched} enriched` },
        ]}
        actions={
          <>
            <Button variant="ghost" size="small" onClick={onRename}>
              Rename
            </Button>
            <Button variant="ghost" size="small" icon="plus" onClick={onEditGenes}>
              Edit genes
            </Button>
          </>
        }
        settingsLabel="Module settings"
        settings={
          <>
            <Select
              label="Tissue"
              options={tissues.map((network) => ({ value: network.slug, label: network.name }))}
              value={result.integration}
              searchable
              filterLabel="Filter tissues"
              disabled={starting}
              onChange={(slug) => slug !== result.integration && onTissueChange(slug)}
            />
            <SearchField
              label="Find a gene"
              placeholder="Symbol, shows its module"
              size="medium"
              value={find}
              disabled={!names.data}
              onChange={(event) => setFind(event.target.value)}
              onClear={() => setFind('')}
              suggestions={suggestions.map((gene: GeneHit) => ({ id: String(gene.entrez), label: gene.symbol, description: gene.name, details: result.moduleOf(gene.entrez)?.label ?? '' }))}
              onSuggestionSelect={(suggestion) => {
                const module = result.moduleOf(Number(suggestion.id));
                setFind('');
                if (module) onViewChange(view.with({ module: module.id, hideUnenriched: view.hideUnenriched && result.isEnriched(module.id, database), minimumSize: Math.min(view.minimumSize, module.genes.length) }));
              }}
            />
            <ActionMenu label="Download" trigger="text" items={downloads} />
          </>
        }
        tabs={[
          { value: 'modules', label: 'Modules' },
          { value: 'genes', label: 'Genes' },
        ]}
        tabsLabel={`Views of ${title}`}
        tab={view.tab}
        onTabChange={(tab) => onViewChange(view.with({ tab: tab === 'genes' ? 'genes' : 'modules' }))}
      />
      {notice}
    </>
  );

  const hoverNode = (id: string | null, anchor?: DOMRect) => {
    const tooltip = anchor && tooltipAt(graphArea.current, anchor);
    setHovered(id === null || !tooltip ? undefined : { entrez: Number(id), tooltip });
  };
  const hoverLink = (link: { source: string; target: string; anchor: DOMRect } | null) => {
    const tooltip = link && tooltipAt(graphArea.current, link.anchor);
    setHoveredLink(link && tooltip ? { source: Number(link.source), target: Number(link.target), tooltip } : undefined);
  };
  const symbolOf = (entrez: number) => names.data?.get(entrez)?.symbol ?? result.symbol(entrez) ?? String(entrez);
  const linkWeight = hoveredLink && result.neighbors(hoveredLink.source).find((neighbor) => neighbor.entrez === hoveredLink.target)?.weight;
  const linkTooltip = hoveredLink && !hovered?.tooltip && (
    <DataTooltip
      title={`${symbolOf(hoveredLink.source)} and ${symbolOf(hoveredLink.target)}`}
      subtitle={[result.moduleOf(hoveredLink.source)?.label, result.moduleOf(hoveredLink.target)?.label].filter((label, index, labels) => label && labels.indexOf(label) === index).join(' and ')}
      rows={linkWeight === undefined ? [] : [['Confidence', linkWeight.toFixed(2)]]}
      position={hoveredLink.tooltip}
    />
  );
  const hoveredModule = hovered && result.moduleOf(hovered.entrez);
  const tooltip = hovered?.tooltip && (
    <DataTooltip
      title={names.data?.get(hovered.entrez)?.symbol ?? result.symbol(hovered.entrez) ?? String(hovered.entrez)}
      subtitle={names.data?.get(hovered.entrez)?.name ?? ''}
      rows={[
        ['Module', hoveredModule?.label ?? ''],
        ['Entrez', String(hovered.entrez)],
      ]}
      hint="Click for details"
      position={hovered.tooltip}
    />
  );

  const main = (
    <>
      <GraphToolbar label="Graph controls" groups={toolbar} tableLabel={asTable ? 'View as graph' : 'View as table'} onViewTable={() => onViewChange(view.with({ display: asTable ? 'graph' : 'table' }))} />
      {asTable ? (
        <Table className="module-graph-table" caption={`Genes in the modules of ${title}`} density="compact" columnWidths={['88px', 'auto']} busy={!names.data}>
          <thead>
            <tr>
              <HeaderCell>Module</HeaderCell>
              <HeaderCell>Gene</HeaderCell>
            </tr>
          </thead>
          <tbody>
            {names.data ? (
              moduleGenes(shown, names.data).map((row) => <ModuleGeneRow key={row.gene.entrez} {...row} colors={colors} onSelectModule={selectModule} onSelectGene={selectGene} />)
            ) : (
              <TableSkeleton columns={2} rows={8} />
            )}
          </tbody>
        </Table>
      ) : (
        <div className="graph-area" ref={graphArea}>
          <NetworkGraph
            ref={graph}
            data={data}
            label={`Modules of ${title}`}
            selection={selection}
            hover={hover}
            renderer={renderer}
            onSelectGroup={(id) => selectModule(Number(id))}
            onSelectNode={(id) => selectGene(Number(id))}
            onHoverNode={hoverNode}
            onHoverLink={hoverLink}
            hoverGroup={hoveredGroup === undefined ? null : String(hoveredGroup)}
            onHoverGroup={(id) => setHoveredGroup(id === null ? undefined : Number(id))}
            onClearSelection={() => onViewChange(view.with({ module: undefined, gene: undefined }))}
          />
          {tooltip}
          {linkTooltip}
        </div>
      )}
      <div className="graph-meta">
        <KeyLegend title="Module" items={legendItems} />
        <p className="result-line" role="status">
          {summary}
        </p>
      </div>
      <div className="module-filters">
        <Checkbox label="Show edges" checked={view.showEdges} onChange={(event) => onViewChange(view.with({ showEdges: event.target.checked }))} />
        <Checkbox label="Hide modules with no enriched terms" checked={view.hideUnenriched} onChange={(event) => onViewChange(view.with({ hideUnenriched: event.target.checked }))} />
        <TextInput
          label="Minimum module size"
          type="number"
          inputMode="numeric"
          min={1}
          value={view.minimumSize}
          onChange={(event) => {
            const size = Number(event.target.value);
            if (Number.isInteger(size) && size >= 1) onViewChange(view.with({ minimumSize: size }));
          }}
        />
      </div>
    </>
  );

  const companion =
    view.tab === 'genes' ? (
      <ModuleGenesTable modules={shown} genes={names.data} colors={colors} onSelectModule={selectModule} />
    ) : (
      <>
        <Select
          label="Terms from"
          options={result.databases.map((slug) => ({ value: slug, label: result.databaseName(slug) }))}
          value={database}
          onChange={(slug) => onViewChange(view.with({ database: slug }))}
        />
        <ModulesTable result={result} modules={shown} database={database} colors={colors} selected={view.module} hovered={hoveredGroup} onSelectModule={selectModule} onHoverModule={setHoveredGroup} />
      </>
    );

  return (
    <>
      <ResultLayout header={header} mainLabel="Module graph" main={main} companion={companion} companionLabel={view.tab === 'genes' ? 'Genes' : 'Modules'} expanded={view.expanded} />
      {open && (
        <ModuleDrawer
          result={result}
          module={open}
          gene={openGene}
          database={database}
          genes={names.data}
          integration={result.integration}
          version={result.version}
          onSelectGene={selectGene}
          onHoverGene={(entrez) => setHovered(entrez === undefined ? undefined : { entrez })}
          onBack={() => selectModule(open.id)}
          onClose={() => {
            setHovered(undefined);
            onViewChange(view.with({ module: undefined, gene: undefined }));
          }}
        />
      )}
      {names.isError && <p className="module-muted">Gene names couldn’t load, so genes show their Entrez IDs. {genesWord(result.entrez.length)} are in this result.</p>}
    </>
  );
}
