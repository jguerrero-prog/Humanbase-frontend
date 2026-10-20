import { GeneFunction, type FunctionEvidence } from '@humanbase/data';
import type { AnnotationEvidence, RankedAnnotation } from '@humanbase/ui';

const months = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });

function toEvidence(item: FunctionEvidence): AnnotationEvidence {
  const pub = item.publication;
  const evidence = { source: item.source, code: item.code, meaning: GeneFunction.evidenceName(item.code) };
  if (!pub) return evidence;
  return { ...evidence, publication: { title: pub.title, authors: pub.authors, journal: `${pub.journal}, ${months.format(new Date(pub.date))}`, href: `https://pubmed.ncbi.nlm.nih.gov/${pub.pmid}/` } };
}

/** One row per term across the query genes, with each gene's confidence and every source behind it. */
export function annotationRows(perGene: readonly (readonly GeneFunction[])[]): RankedAnnotation[] {
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
