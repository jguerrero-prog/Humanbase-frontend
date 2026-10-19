import { GeneFunction, type FunctionEvidence } from '@humanbase/data';
import { Alert, Button, IconButton, RankedAnnotationTable, saveFile, SearchField, Skeleton, type AnnotationEvidence, type RankedAnnotation } from '@humanbase/ui';
import { useMemo, useState } from 'react';
import type { QueryGene } from './expressionRows';

export type AssociationKind = 'processes' | 'diseases';

export interface GeneAssociationsProps {
  kind: AssociationKind;
  genes: readonly QueryGene[];
  /** One list per query gene; undefined while any of them loads. */
  perGene: readonly (readonly GeneFunction[])[] | undefined;
  failed: boolean;
  onRetry: () => void;
  queryNames: string;
  fileName: string;
}

const copy = {
  processes: { noun: 'processes', term: 'Process', heading: 'Biological processes linked to', what: 'processes' },
  diseases: { noun: 'diseases', term: 'Disease', heading: 'Diseases linked to', what: 'disease associations' },
};
const firstRows = 50;
const months = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });

function toEvidence(item: FunctionEvidence): AnnotationEvidence {
  const pub = item.publication;
  const evidence = { source: item.source, code: item.code, meaning: GeneFunction.evidenceName(item.code) };
  if (!pub) return evidence;
  return { ...evidence, publication: { title: pub.title, authors: pub.authors, journal: `${pub.journal}, ${months.format(new Date(pub.date))}`, href: `https://pubmed.ncbi.nlm.nih.gov/${pub.pmid}/` } };
}

/** One row per term across the query genes, with each gene's confidence and every source behind it. */
function mergeRows(perGene: readonly (readonly GeneFunction[])[]): RankedAnnotation[] {
  const rows = new Map<string, RankedAnnotation & { confidences: (number | null)[]; evidence: AnnotationEvidence[] }>();
  perGene.forEach((functions, column) => {
    for (const item of functions) {
      const row = rows.get(item.identifier) ?? { name: item.name, identifier: item.identifier, confidence: 0, confidences: perGene.map(() => null), sources: 0, evidence: [] };
      row.confidences[column] = item.confidence;
      row.confidence = Math.max(row.confidence, item.confidence);
      row.sources = (row.sources ?? 0) + item.evidence.length;
      row.evidence.push(...item.evidence.map(toEvidence));
      rows.set(item.identifier, row);
    }
  });
  const average = (row: { confidences: readonly (number | null)[] }) => row.confidences.reduce<number>((sum, value) => sum + (value ?? 0), 0);
  return [...rows.values()].sort((a, b) => b.confidence - a.confidence || average(b) - average(a) || a.name.localeCompare(b.name));
}

export function GeneAssociations({ kind, genes, perGene, failed, onRetry, queryNames, fileName }: GeneAssociationsProps) {
  const [filter, setFilter] = useState('');
  const [visible, setVisible] = useState(firstRows);
  const text = copy[kind];
  const rows = useMemo(() => (perGene ? mergeRows(perGene) : undefined), [perGene]);
  const term = filter.trim().toLowerCase();
  const shown = rows?.filter((row) => !term || row.name.toLowerCase().includes(term) || row.identifier.toLowerCase().includes(term));
  const heading = `${text.heading} ${queryNames}`;
  const more = shown ? Math.min(firstRows, shown.length - visible) : 0;

  const download = () => {
    if (!rows) return;
    const header = ['term', 'identifier', ...genes.map((gene) => `${gene.symbol}_confidence`), 'sources'].join('\t');
    const lines = rows.map((row) => [row.name, row.identifier, ...(row.confidences ?? []).map((value) => (value === null ? '' : value.toFixed(3))), row.sources ?? 0].join('\t'));
    saveFile([header, ...lines].join('\n'), `${fileName}_${kind}.tsv`, 'text/tab-separated-values');
  };

  return (
    <div className="gene-associations">
      <h2 className="tab-heading">{heading}</h2>
      <p className="result-note">
        Experimentally associated and computationally predicted {text.what} for each gene. Open a row to see the evidence and publications behind it.
        {genes.length > 1 && ' Sources count every gene.'}
      </p>
      <div className="companion-search">
        <SearchField label={`Filter ${text.noun}`} placeholder={`Filter ${text.noun}`} size="medium" value={filter} onChange={(event) => setFilter(event.target.value)} onClear={() => setFilter('')} disabled={!rows} />
        <IconButton label={`Download ${text.noun}`} icon="download" onClick={download} disabled={!rows} />
      </div>
      {failed ? (
        <Alert tone="error" title={`The ${text.noun} couldn’t load`} action={{ label: 'Try again', onSelect: onRetry }}>
          The network tabs are unaffected.
        </Alert>
      ) : !shown ? (
        <p aria-busy="true">
          <Skeleton width="100%" height="200px" />
        </p>
      ) : shown.length === 0 ? (
        <Alert tone="info" title={term ? `No ${text.noun} match “${filter.trim()}”` : `No ${text.noun} for ${queryNames}`}>
          {term ? 'Check the spelling, or clear the filter.' : 'Humanbase has no annotations or predictions above 0.05 for these genes.'}
        </Alert>
      ) : (
        <>
          <RankedAnnotationTable
            caption={heading}
            termLabel={text.term}
            scoreLabel={`${genes[0]?.symbol ?? 'Gene'} confidence`}
            scoreLabels={genes.map((gene) => `${gene.symbol} confidence`)}
            rows={shown.slice(0, visible)}
          />
          {more > 0 && (
            <Button variant="ghost" size="small" icon="chevron-down" onClick={() => setVisible(visible + firstRows)}>
              {`Show ${more} more ${text.noun}`}
            </Button>
          )}
          <p className="result-note" role="status">
            Showing {Math.min(visible, shown.length)} of {shown.length} {text.noun}
          </p>
        </>
      )}
    </div>
  );
}
