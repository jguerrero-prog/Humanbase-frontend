import type { FileProblem } from './VariantFileCheck';

export type GwasFormat = 'vegas' | 'magma' | 'two-column';

export interface GwasCheckResult {
  format: GwasFormat | undefined;
  /** Genes with a usable p-value. */
  count: number;
  /** Each gene's p-value, so the form can count GWAS hits below the threshold without reading the file again. */
  pValues: readonly number[];
  problems: FileProblem[];
  summary: string;
}

const formatNames: Record<GwasFormat, string> = { vegas: 'VEGAS', magma: 'MAGMA', 'two-column': '2-column' };
// Where each format keeps the gene and the p-value, from the API's description of the upload.
const columns: Record<GwasFormat, { gene: number; p: number }> = { vegas: { gene: 1, p: 7 }, magma: { gene: 0, p: 8 }, 'two-column': { gene: 0, p: 1 } };
const chromosome = /^(chr)?([1-9]|1\d|2[0-2]|X|Y|MT?)$/i;
const number = new Intl.NumberFormat('en-US');

/** Applies the NetWAS upload rules in the browser, so a file is fixed before it is sent. */
export class GwasFileCheck {
  static readonly maxBytes = 3 * 1024 ** 2;
  static readonly extensions = ['.txt', '.csv', '.tsv', '.out'];

  static formatName(format: GwasFormat | string | undefined): string {
    if (!format) return '';
    const known = format.toLowerCase().replace(/[^a-z]/g, '');
    if (known === 'vegas' || known === 'vegas2') return formatNames.vegas;
    if (known === 'magma') return formatNames.magma;
    if (known === '2column' || known === 'twocolumn') return formatNames['two-column'];
    return format;
  }

  /** Why the API would refuse this file before reading it, if it would. */
  static refuse(name: string, bytes: number): string | undefined {
    if (!GwasFileCheck.extensions.some((extension) => name.toLowerCase().endsWith(extension))) return 'Use a .txt, .csv, .tsv or .out file.';
    if (bytes >= GwasFileCheck.maxBytes) return 'This file is 3 MB or larger. NetWAS takes files under 3 MB; keep only the gene and p-value columns to make it smaller.';
    return undefined;
  }

  static split(line: string): string[] {
    return line.trim().split(/[\s,]+/);
  }

  static detect(rows: readonly string[][]): GwasFormat | undefined {
    const first = rows[0];
    if (!first) return undefined;
    if (first.length === 2) return 'two-column';
    if (first.length < 8) return undefined;
    const header = first.map((cell) => cell.toLowerCase());
    if (header[0] === 'gene' && header[8] === 'p') return 'magma';
    if (header[0] === 'chr' && header[1] === 'gene') return 'vegas';
    // Without a header, VEGAS starts with the chromosome and MAGMA with the gene.
    if (first.length === 9 && !chromosome.test(first[0] ?? '') && chromosome.test(first[1] ?? '')) return 'magma';
    return 'vegas';
  }

  check(text: string): GwasCheckResult {
    const lines = text.split(/\r?\n/).map((line, index) => ({ line: index + 1, cells: GwasFileCheck.split(line) }));
    const rows = lines.filter(({ cells }) => cells[0] && !cells[0].startsWith('#'));
    const format = GwasFileCheck.detect(rows.map(({ cells }) => cells));
    if (!format) {
      const problems = rows.length ? [{ line: rows[0]?.line ?? 1, rule: 'Use VEGAS, MAGMA or 2-column: a gene and its p-value on each line.' }] : [];
      return { format, count: 0, pValues: [], problems, summary: 'No genes with p-values' };
    }
    const { gene, p } = columns[format];
    const pValues: number[] = [];
    const problems: FileProblem[] = [];
    rows.forEach(({ line, cells }, index) => {
      const value = Number(cells[p]);
      // The header row is optional, so a first row without a number is a header, not a problem.
      if (index === 0 && Number.isNaN(value)) return;
      if (!cells[gene]) problems.push({ line, rule: 'Add the gene symbol or Entrez ID.' });
      else if (Number.isNaN(value) || value < 0 || value > 1) problems.push({ line, rule: `Use a p-value between 0 and 1 in column ${p + 1}.` });
      else pValues.push(value);
    });
    const summary = `${number.format(pValues.length)} ${pValues.length === 1 ? 'gene' : 'genes'} with p-values, ${formatNames[format]} format`;
    return { format, count: pValues.length, pValues, problems, summary };
  }

  static below(result: GwasCheckResult, threshold: number): number {
    return result.pValues.filter((value) => value < threshold).length;
  }
}
