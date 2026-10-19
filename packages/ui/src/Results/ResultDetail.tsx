import type { CSSProperties, ReactNode } from 'react';
import { Badge } from '../Badge/Badge';
import { DrawerSection } from '../Drawer/Drawer';
import { Icon } from '../Icon/Icon';
import { SegmentedControl } from '../SegmentedControl/SegmentedControl';
import { Cell, HeaderCell, ScoreCell, Table } from '../Table/Table';
import { ValueFormat } from '../Table/ValueFormat';
import type { GeneIdLink } from './GeneIdsMenu';
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

export interface GeneDetailProps {
  score: { label: string; value: number; text: string };
  aliases?: readonly string[];
  ids?: readonly GeneIdLink[];
  annotations?: { label: string; sources: readonly { value: string; label: string; terms: readonly string[] }[] };
}

export function GeneDetail({ score, aliases = [], ids = [], annotations }: GeneDetailProps) {
  const first = annotations?.sources[0];
  return (
    <>
      <ScoreMeter {...score} />
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
      {annotations && first && (
        <DrawerSection label={annotations.label}>
          <SegmentedControl label="Annotation source" hideLabel size="small" segments={annotations.sources.map(({ value, label }) => ({ value, label }))} defaultValue={first.value} />
          <ul className="result-detail-rows">
            {first.terms.map((term) => (
              <li key={term}>{term}</li>
            ))}
          </ul>
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

export function EvidenceTable({ rows, note }: { rows: readonly EvidenceRow[]; note: ReactNode }) {
  return (
    <DrawerSection label="Evidence by dataset">
      <Table caption="Evidence by dataset" density="compact" columnWidths={['112px', 'auto', '136px']}>
        <thead>
          <tr>
            <HeaderCell>Contribution</HeaderCell>
            <HeaderCell>Dataset</HeaderCell>
            <HeaderCell>Data type</HeaderCell>
          </tr>
        </thead>
        <tbody>
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

export function WeightHistogram({ counts, current, caption }: { counts: readonly number[]; current: number; caption: string }) {
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

export function NetworkWeightTable({ rows }: { rows: readonly NetworkWeight[] }) {
  return (
    <Table caption="Connection weight in each network, strongest first" density="compact" columnWidths={['auto', '160px']}>
      <thead>
        <tr>
          <HeaderCell>Network</HeaderCell>
          <HeaderCell align="end">Weight</HeaderCell>
        </tr>
      </thead>
      <tbody>
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
