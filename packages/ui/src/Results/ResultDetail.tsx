import { useState, type CSSProperties, type ReactNode } from 'react';
import { Badge } from '../Badge/Badge';
import { DrawerSection } from '../Drawer/Drawer';
import { Icon } from '../Icon/Icon';
import { SegmentedControl } from '../SegmentedControl/SegmentedControl';
import { Skeleton } from '../Skeleton/Skeleton';
import { Cell, HeaderCell, ScoreCell, Table, TableSkeleton } from '../Table/Table';
import { ValueFormat } from '../Table/ValueFormat';
import type { GeneIdLink } from './GeneIdsMenu';
import { RankedAnnotationTable, type RankedAnnotation } from './RankedAnnotationTable';
import './Results.css';

const format = new ValueFormat();
const width = (value: number) => ({ '--score': `${Math.max(0, Math.min(1, value)) * 100}%` }) as CSSProperties;

export function ScoreMeter({ label, value, text }: { label: string; value: number; text: string }) {
  return (
    <DrawerSection label={label}>
      <p className="score-meter">
        <strong>{format.score(value)}</strong>
        <span className="score-meter-bar" style={width(value)} aria-hidden="true" />
      </p>
      <p className="result-detail-text">{text}</p>
    </DrawerSection>
  );
}

export interface AnnotationSource {
  value: string;
  label: string;
  /** Undefined while the terms load. */
  rows: readonly RankedAnnotation[] | undefined;
}

export interface GeneDetailProps {
  /** Facts from where the gene was found, such as its location in a genome browser's genes track; they come first. */
  facts?: readonly { label: string; value: string }[];
  /** Left out for a query gene, which has no connection score to itself. */
  score?: { label: string; value: number; text: string };
  aliases?: readonly string[];
  ids?: readonly GeneIdLink[];
  annotations?: { label: string; sources: readonly AnnotationSource[] };
  /** The aliases and IDs are still on their way, so their sections show skeleton lines. */
  loading?: boolean;
}

const idSkeletonWidths = ['52%', '44%', '60%', '40%'];

export function GeneDetail({ facts = [], score, aliases = [], ids = [], annotations, loading = false }: GeneDetailProps) {
  const [chosen, setChosen] = useState<string>();
  const source = annotations?.sources.find((item) => item.value === chosen) ?? annotations?.sources[0];
  return (
    <>
      {facts.map(({ label, value }) => (
        <DrawerSection key={label} label={label}>
          <p className="result-detail-text">{value}</p>
        </DrawerSection>
      ))}
      {score && <ScoreMeter {...score} />}
      {loading && (
        <>
          <DrawerSection label="Also known as">
            <p className="result-detail-text" aria-busy="true">
              <Skeleton width="48%" />
            </p>
          </DrawerSection>
          <DrawerSection label="Gene IDs">
            <ul className="result-detail-ids" aria-busy="true">
              {idSkeletonWidths.map((width) => (
                <li key={width}>
                  <Skeleton width={width} />
                </li>
              ))}
            </ul>
          </DrawerSection>
        </>
      )}
      {aliases.length > 0 && (
        <DrawerSection label="Also known as">
          <p className="result-detail-text">{aliases.join(', ')}</p>
        </DrawerSection>
      )}
      {ids.length > 0 && (
        <DrawerSection label="Gene IDs">
          <ul className="result-detail-ids">
            {ids.map((link) => (
              <li key={link.source}>
                <a href={link.href} target="_blank" rel="noreferrer">
                  {link.source} <span className="gene-ids-value">{link.id}</span>
                  <Icon name="external-link" size={16} label={`opens ${link.site} in a new tab`} />
                </a>
              </li>
            ))}
          </ul>
        </DrawerSection>
      )}
      {annotations && source && (
        <DrawerSection label={annotations.label}>
          <SegmentedControl label="Annotation source" hideLabel size="small" segments={annotations.sources.map(({ value, label }) => ({ value, label }))} value={source.value} onChange={setChosen} />
          {source.rows?.length === 0 ? (
            <p className="result-detail-text">No {source.label} terms for this gene.</p>
          ) : (
            <RankedAnnotationTable narrow caption={`${source.label} terms`} termLabel="Term" scoreLabel="Confidence" rows={source.rows} />
          )}
        </DrawerSection>
      )}
    </>
  );
}

export interface EvidenceRow {
  dataset: string;
  dataType: string;
  contribution: number;
}

export function EvidenceTable({ rows, note, loading = false }: { rows: readonly EvidenceRow[]; note: ReactNode; loading?: boolean }) {
  return (
    <DrawerSection label="Evidence by dataset">
      <Table caption="Evidence by dataset" density="compact" columnWidths={['112px', 'auto', '136px']} busy={loading}>
        <thead>
          <tr>
            <HeaderCell>Contribution</HeaderCell>
            <HeaderCell>Dataset</HeaderCell>
            <HeaderCell>Data type</HeaderCell>
          </tr>
        </thead>
        <tbody>
          {loading && <TableSkeleton columns={3} rows={6} />}
          {rows.map((row) => (
            <tr key={row.dataset}>
              <Cell type="number">
                <span className="contribution">
                  {row.contribution < 0.01 ? '< 0.01' : format.score(row.contribution)}
                  <span className="contribution-bar" style={width(row.contribution)} aria-hidden="true" />
                </span>
              </Cell>
              <Cell>{row.dataset}</Cell>
              <Cell>
                <Badge size="small">{row.dataType}</Badge>
              </Cell>
            </tr>
          ))}
        </tbody>
      </Table>
      <p className="result-detail-text">{note}</p>
    </DrawerSection>
  );
}

export interface NetworkWeight {
  network: string;
  weight: number;
}

// Bar heights, as a share of the chart, that a loading histogram shows.
const skeletonBars = [0.8, 0.45, 0.3, 0.2, 0.25, 0.15, 0.3, 0.2, 0.35, 0.5];

export function WeightHistogram({ counts, current, caption, loading = false }: { counts: readonly number[]; current: number; caption: string; loading?: boolean }) {
  if (loading) {
    return (
      <figure className="weight-histogram">
        <div className="weight-histogram-skeleton" aria-hidden="true">
          {skeletonBars.map((share, index) => (
            <Skeleton key={index} width="100%" height={`${share * 100}%`} />
          ))}
        </div>
        <p className="weight-histogram-axis" aria-hidden="true">
          <span>0</span>
          <span>1</span>
        </p>
        <figcaption>{caption}</figcaption>
      </figure>
    );
  }
  const tallest = Math.max(...counts, 1);
  const bin = Math.min(counts.length - 1, Math.floor(current * counts.length));
  return (
    <figure className="weight-histogram">
      <svg viewBox={`0 0 ${counts.length * 10} 60`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
        {counts.map((count, index) => {
          const height = (count / tallest) * 56;
          return <rect key={index} className={index === bin ? 'weight-histogram-current' : undefined} x={index * 10 + 1} y={60 - height} width="8" height={height} />;
        })}
      </svg>
      <p className="weight-histogram-axis" aria-hidden="true">
        <span>0</span>
        <span>1</span>
      </p>
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

export function NetworkWeightTable({ rows, loading = false }: { rows: readonly NetworkWeight[]; loading?: boolean }) {
  return (
    <Table caption="Connection weight in each network, strongest first" density="compact" columnWidths={['auto', '160px']} busy={loading}>
      <thead>
        <tr>
          <HeaderCell>Network</HeaderCell>
          <HeaderCell align="end">Weight</HeaderCell>
        </tr>
      </thead>
      <tbody>
        {loading && <TableSkeleton columns={2} rows={8} />}
        {rows.map((row) => (
          <tr key={row.network}>
            <Cell>{row.network}</Cell>
            <ScoreCell value={row.weight} />
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
