import { ApiError, useGene, useHumanbase, useTissueVariants, type EffectRow, type GenePosition, type TissueDatabase, type TissueEffects, type TissueVariants } from '@humanbase/data';
import { Alert, Button, EmptyState, Heatmap, ResultHeader, saveFile, ScoreScale, SearchField, SegmentedControl, Select, Skeleton, type HeatmapCellDetail, type ScaleSpec, useLinkHref } from '@humanbase/ui';
import { useMemo } from 'react';
import { useCopyLink } from '../Jobs/useCopyLink';
import { geneExpressionTools, type GeneExpressionTool } from './geneExpressionTools';
import './Expecto.css';

export type GeneExpressionView = 'groups' | 'members';

export interface GeneExpressionState {
  view: GeneExpressionView;
  group?: string | undefined;
  resource?: string | undefined;
  find?: string | undefined;
}

export interface GeneExpressionProps {
  tool: GeneExpressionTool;
  entrez: number;
  state: GeneExpressionState;
  /** The page keeps the view and filters in its URL. */
  onStateChange: (state: GeneExpressionState) => void;
}

const counts = new Intl.NumberFormat('en-US');
const article = (noun: string) => (/^[aeiou]/i.test(noun) ? 'an' : 'a');

type DetailedRow = EffectRow & { details?: readonly (HeatmapCellDetail | undefined)[] };

const bases = ['A', 'C', 'G', 'T'];

/** Every allele at a position, the reference marked and the strongest noted, as the heatmap tooltip lists them. */
function allelesAt(tissue: TissueEffects, index: number, position: GenePosition | undefined, decimals: number): HeatmapCellDetail['rows'] {
  const alleles = tissue.alleles[index] ?? {};
  const strongest = tissue.values[index];
  return bases.flatMap((base): HeatmapCellDetail['rows'] => {
    const value = alleles[base];
    // ExPecto SC lists one entry per variant, so its scored allele can share the position's ref letter.
    if (value === undefined) return base === position?.ref ? [[base, 'Reference']] : [];
    const shown = ScoreScale.number(Number(value.toFixed(decimals)));
    return [value === strongest ? [base, value > 0 ? `+${shown}` : shown, 'strongest, shown in the cell'] : [base, value > 0 ? `+${shown}` : shown]];
  });
}

const nameOf = (tissue: TissueEffects, withResource: boolean) => (withResource ? `${tissue.title}, ${tissue.resource}` : tissue.title);

function matching<T extends EffectRow>(rows: readonly T[], find: string | undefined): T[] {
  const term = find?.trim().toLowerCase();
  return term ? rows.filter((row) => row.label.toLowerCase().includes(term)) : [...rows];
}

function download(rows: readonly EffectRow[], table: TissueVariants, fileName: string) {
  const header = ['row', ...table.positions.map((item) => `${item.chromosome}:${item.position}:${item.ref}`)].join('\t');
  const lines = rows.map((row) => [row.label, ...row.values.map((value) => (value === null ? '' : String(value)))].join('\t'));
  saveFile([header, ...lines].join('\n'), fileName, 'text/tab-separated-values');
}

/** One gene's predicted expression effects by position: tissue systems or organs, then each tissue or cell type. */
export function GeneExpression({ tool: toolId, entrez, state, onStateChange }: GeneExpressionProps) {
  const linkHref = useLinkHref();
  const tool = geneExpressionTools[toolId];
  const api = useHumanbase();
  const gene = useGene(entrez);
  const effects = useTissueVariants(entrez, tool.database satisfies TissueDatabase);
  const { copyButton, toastRegion } = useCopyLink();
  const table = effects.data;
  const symbol = gene.data?.symbol ?? '…';
  const change = (next: Partial<GeneExpressionState>) => onStateChange({ ...state, ...next });

  const members = useMemo<DetailedRow[]>(
    () =>
      table?.tissuesIn(state.group, state.resource).map((tissue) => ({
        label: nameOf(tissue, tool.resourceFilter),
        values: tissue.values,
        details: tissue.values.map((_, index) => ({ rows: allelesAt(tissue, index, table.positions[index], tool.decimals) })),
      })) ?? [],
    [table, state.group, state.resource, tool.resourceFilter, tool.decimals],
  );
  const groupRows = useMemo<DetailedRow[]>(
    () =>
      table?.groupRows().map((row) => ({
        ...row,
        details: (row.sources ?? []).map((tissue, index) => (tissue ? { rows: allelesAt(tissue, index, table.positions[index], tool.decimals), hint: `Strongest ${tool.members.singular}: ${nameOf(tissue, tool.resourceFilter)}` } : undefined)),
      })) ?? [],
    [table, tool.decimals, tool.members.singular, tool.resourceFilter],
  );
  const rows = matching(state.view === 'groups' ? groupRows : members, state.find);
  const fileName = `${symbol}_${toolId}_${state.view === 'groups' ? tool.groups.plural : tool.members.plural}.tsv`.toLowerCase().replaceAll(' ', '_');

  const header = (
    <ResultHeader
      crumbs={[{ label: 'Sequence analysis', href: '/sequence-tools/' }, { label: tool.name, href: tool.home }, { label: symbol }]}
      title={symbol}
      context={[
        { name: 'Name', value: gene.data?.name ?? '…' },
        { name: 'Genome', value: 'GRCh37/hg19' },
        { name: 'Positions', value: table ? `${counts.format(table.positions.length)} ${tool.positionsNote}` : '…' },
        { name: tool.groups.label, value: table ? String(table.groups.length) : '…' },
      ]}
      settingsLabel="Gene actions"
      settings={
        <>
          {copyButton}
          <Button variant="secondary" icon="download" disabled={!table} onClick={() => table && download(rows, table, fileName)}>
            Download
          </Button>
        </>
      }
    />
  );

  if (effects.isError) {
    const missing = effects.error instanceof ApiError && effects.error.isNotFound;
    return (
      <>
        {header}
        {missing ? (
          <EmptyState
            title={`${tool.name} has no predictions for ${symbol}`}
            text={api.showsSamples ? `This copy of Humanbase shows sample data, which covers ${tool.examples[0]} only. Turn the API on to see every gene.` : `${tool.name} scores positions near a gene’s start; this gene isn’t in its set. Try another gene.`}
            actions={
              <a className="button button-secondary" href={linkHref(tool.home)}>
                Search another gene
              </a>
            }
          />
        ) : (
          <Alert tone="error" title="The predictions couldn’t load" action={{ label: 'Try again', onSelect: () => void effects.refetch() }}>
            Humanbase didn’t answer. Trying again is safe.
          </Alert>
        )}
      </>
    );
  }

  const unit = tool.scale.title.replace(/^Expression effect, /, '');
  const groupsView = state.view === 'groups';
  const noun = groupsView ? tool.groups : tool.members;
  const shownOf = !groupsView && table ? `: ${counts.format(rows.length)} of ${counts.format(table.tissues.length)} ${tool.members.plural}` : '';
  const axis = table?.axis();
  const strongest = table?.strongest();

  return (
    <div className="gene-expression-page">
      <title>{`${symbol} · ${tool.name} · Humanbase`}</title>
      {header}
      <section className="gene-expression" aria-labelledby="gene-expression-title">
        <div className="gene-expression-head">
          <h2 id="gene-expression-title">
            Predicted effect on {symbol} expression, {unit}
            {shownOf}
          </h2>
          <SegmentedControl
            label="Show"
            hideLabel
            size="small"
            value={state.view}
            onChange={(value) => change({ view: value as GeneExpressionView, find: undefined })}
            segments={[
              { value: 'groups', label: tool.groups.label },
              { value: 'members', label: tool.members.label },
            ]}
          />
        </div>
        <div className="gene-expression-filters">
          {!groupsView && tool.resourceFilter && table && (
            <Select label="Resource" size="small" value={state.resource ?? ''} onChange={(value) => change({ resource: value || undefined })} options={[{ value: '', label: 'All resources' }, ...table.resources.map((value) => ({ value, label: value }))]} />
          )}
          {!groupsView && table && (
            <Select label={tool.groups.single} size="small" value={state.group ?? ''} onChange={(value) => change({ group: value || undefined })} options={[{ value: '', label: `All ${tool.groups.plural}` }, ...table.groups.map((value) => ({ value, label: value }))]} />
          )}
          <SearchField label={`Find ${article(noun.singular)} ${noun.singular}`} placeholder={`Find ${article(noun.singular)} ${noun.singular}`} size="medium" value={state.find ?? ''} onChange={(event) => change({ find: event.target.value || undefined })} onClear={() => change({ find: undefined })} disabled={!table} />
        </div>
        {!table || !axis ? (
          <Skeleton width="100%" height="320px" />
        ) : rows.length === 0 ? (
          <Alert tone="info" title={`No ${noun.plural} match`}>
            {state.find ? `Nothing matches “${state.find.trim()}”. Check the spelling, or clear the search.` : 'Change the filters to see more.'}
          </Alert>
        ) : (
          <Heatmap
            title={`${noun.label} by position`}
            summary={summaryOf(table, rows.length, noun.plural, symbol, strongest)}
            scale={tool.scale satisfies ScaleSpec}
            columns={table.positions.map((item) => ({ label: `${item.chromosome}:${item.position} ${item.ref}`, position: item.position }))}
            rows={rows}
            rowHeader={noun.label.replace(/s$/, '')}
            columnHeader="Position"
            axis={{ title: `Position on ${axis.chromosome}, GRCh37/hg19`, offset: axis.offset, ticks: axis.ticks }}
            decimals={tool.decimals}
            columnWidth="auto"
          />
        )}
      </section>
      {toastRegion}
    </div>
  );
}

function summaryOf(table: TissueVariants, shown: number, plural: string, symbol: string, strongest: ReturnType<TissueVariants['strongest']>): string {
  const lead = `Predicted effects of ${counts.format(table.positions.length)} positions near ${symbol} in ${counts.format(shown)} ${plural}.`;
  if (!strongest) return lead;
  const direction = strongest.value < 0 ? 'a decrease' : 'an increase';
  return `${lead} The strongest is ${direction} of ${Math.abs(strongest.value).toFixed(2)} at ${counts.format(strongest.position.position)}, in ${strongest.tissue}.`;
}
