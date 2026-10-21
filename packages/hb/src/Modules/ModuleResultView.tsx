import { dataVersionNames, useModuleGenes, type GeneHit, type Integration, type ModuleResult, type ModuleView } from '@humanbase/data';
import { NetworkGraph, type GraphData, type GraphRendererFactory, type NetworkGraphHandle } from '@humanbase/graph';
import { ActionMenu, Button, Cell, Checkbox, GraphToolbar, HeaderCell, KeyLegend, ResultHeader, ResultLayout, SearchField, Select, Table, TextInput, type GraphAction } from '@humanbase/ui';
import { useMemo, useRef, useState } from 'react';
import { ModuleDrawer } from './ModuleDrawer';
import { moduleColors } from './moduleColors';
import { useModuleDownloads } from './moduleExport';
import { ModuleGenesTable } from './ModuleGenesTable';
import { ModulesTable, ModuleSwatch } from './ModulesTable';
import '../Networks/Networks.css';
import './Modules.css';

export interface ModuleResultViewProps {
  result: ModuleResult;
  title: string;
  view: ModuleView;
  /** Tissue networks for the result's data version; changing the tissue starts a new job. */
  tissues: readonly Integration[];
  starting: boolean;
  onViewChange: (view: ModuleView) => void;
  onRename: () => void;
  onEditGenes: () => void;
  onTissueChange: (slug: string) => void;
  renderer?: GraphRendererFactory | undefined;
}

const zoomStep = 1.3;
const genesWord = (count: number) => (count === 1 ? '1 gene' : `${count} genes`);

export function ModuleResultView({ result, title, view, tissues, starting, onViewChange, onRename, onEditGenes, onTissueChange, renderer }: ModuleResultViewProps) {
  const graph = useRef<NetworkGraphHandle>(null);
  const [find, setFind] = useState('');
  const names = useModuleGenes(result);
  const database = view.databaseFor(result);
  const { minimumSize, hideUnenriched } = view;
  const shown = useMemo(() => result.shown(database, { minimumSize, hideUnenriched }), [result, database, minimumSize, hideUnenriched]);
  const colors = useMemo(() => moduleColors(shown), [shown]);
  const open = view.module === undefined ? undefined : result.module(view.module);
  const selectModule = (id: number) => onViewChange(view.with({ module: id }));

  const data = useMemo<GraphData>(() => {
    const inShown = new Set(shown.flatMap((module) => module.genes));
    return {
      groups: shown.map((module) => ({ id: String(module.id), label: module.label, color: colors.get(module.id) ?? '--viz-cat-other' })),
      nodes: shown.flatMap((module) => module.genes.map((entrez) => ({ id: String(entrez), label: names.data?.get(entrez)?.symbol ?? String(entrez), query: false, group: String(module.id) }))),
      links: view.showEdges ? result.edges.filter(([source, target]) => inShown.has(source) && inShown.has(target)).map(([source, target, weight]) => ({ source: String(source), target: String(target), weight })) : [],
    };
  }, [shown, colors, names.data, view.showEdges, result.edges]);

  const suggestions = useMemo(() => {
    const text = find.trim().toLowerCase();
    if (!text || !names.data) return [];
    return [...names.data.values()].filter((gene) => gene.symbol.toLowerCase().startsWith(text) && result.moduleOf(gene.entrez)).slice(0, 8);
  }, [find, names.data, result]);

  const asTable = view.display === 'table';
  const downloads = useModuleDownloads({ result, modules: shown, database, tissues, graph: asTable ? undefined : graph });
  const expand: GraphAction = { label: 'Expand', icon: 'maximize', pressed: view.expanded, onSelect: () => onViewChange(view.with({ expanded: !view.expanded })) };
  const toolbar: GraphAction[][] = asTable
    ? [[expand]]
    : [
        [
          { label: 'Zoom in', icon: 'zoom-in', onSelect: () => graph.current?.zoomBy(zoomStep) },
          { label: 'Zoom out', icon: 'zoom-out', onSelect: () => graph.current?.zoomBy(1 / zoomStep) },
          { label: 'Fit to screen', icon: 'fit', onSelect: () => graph.current?.fit() },
          expand,
        ],
      ];

  const enriched = result.enrichedCount(database);
  const summary = `Showing ${shown.length} ${view.hideUnenriched ? 'enriched ' : ''}${shown.length === 1 ? 'module' : 'modules'} of ${view.minimumSize === 1 ? '1 gene' : `${view.minimumSize} genes`} or more. ${view.showEdges ? 'Edges shown.' : 'Edges hidden.'}`;

  const header = (
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
  );

  const main = (
    <>
      <GraphToolbar label="Graph controls" groups={toolbar} tableLabel={asTable ? 'View as graph' : 'View as table'} onViewTable={() => onViewChange(view.with({ display: asTable ? 'graph' : 'table' }))} />
      {asTable ? (
        <Table caption={`Genes in the modules of ${title}`} density="compact" columnWidths={['88px', 'auto']}>
          <thead>
            <tr>
              <HeaderCell>Module</HeaderCell>
              <HeaderCell>Genes</HeaderCell>
            </tr>
          </thead>
          <tbody>
            {shown.map((module) => (
              <tr key={module.id}>
                <Cell rowHeader>
                  <button type="button" className="result-gene-button module-button" onClick={() => selectModule(module.id)}>
                    <ModuleSwatch color={colors.get(module.id)} />
                    {module.label}
                  </button>
                </Cell>
                <Cell>{module.genes.map((entrez) => names.data?.get(entrez)?.symbol ?? entrez).join(', ')}</Cell>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <div className="graph-area">
          <NetworkGraph
            ref={graph}
            data={data}
            label={`Modules of ${title}`}
            selection={open ? { kind: 'group', id: String(open.id) } : null}
            renderer={renderer}
            onSelectGroup={(id) => selectModule(Number(id))}
            onSelectNode={(id) => {
              const module = result.moduleOf(Number(id));
              if (module) selectModule(module.id);
            }}
          />
        </div>
      )}
      <div className="graph-meta">
        <KeyLegend title="Module" items={shown.slice(0, 6).map((module) => ({ label: module.label, color: colors.get(module.id) ?? '--viz-cat-other' }))} />
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
        <ModulesTable result={result} modules={shown} database={database} colors={colors} selected={view.module} onSelectModule={selectModule} />
      </>
    );

  return (
    <>
      <ResultLayout header={header} mainLabel="Module graph" main={main} companion={companion} companionLabel={view.tab === 'genes' ? 'Genes' : 'Modules'} expanded={view.expanded} />
      {open && (
        <ModuleDrawer
          key={open.id}
          result={result}
          module={open}
          database={database}
          genes={names.data}
          integration={result.integration}
          version={result.version}
          onClose={() => onViewChange(view.with({ module: undefined }))}
        />
      )}
      {names.isError && <p className="module-muted">Gene names couldn’t load, so genes show their Entrez IDs. {genesWord(result.entrez.length)} are in this result.</p>}
    </>
  );
}
