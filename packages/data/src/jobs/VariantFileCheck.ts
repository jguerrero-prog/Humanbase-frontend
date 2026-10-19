export type InputKind = 'vcf' | 'bed' | 'fasta';
export type VariantModel = 'sei' | 'beluga' | 'seqweaver';

export interface FileProblem {
  line: number;
  rule: string;
}

export interface FileCheckResult {
  count: number;
  problems: FileProblem[];
  summary: string;
  limit?: string;
  otherKind?: string;
}

const modelNames: Record<VariantModel, string> = { sei: 'Sei', beluga: 'Beluga', seqweaver: 'Seqweaver' };
const kindNames: Record<InputKind, string> = { vcf: 'Variants (VCF)', bed: 'Regions (BED)', fasta: 'Sequences (FASTA)' };
const nouns: Record<InputKind, [string, string]> = { vcf: ['variant', 'variants'], bed: ['region', 'regions'], fasta: ['sequence', 'sequences'] };
const bases = /^[ACGT]+$/;
const whole = /^\d+$/;
const number = new Intl.NumberFormat('en-US');

// Applies today's input rules in the browser, so a file is fixed before it is uploaded.
export class VariantFileCheck {
  static readonly maxVariants = 20000;
  static readonly sequenceLength: Record<VariantModel, number> = { sei: 4096, beluga: 2000, seqweaver: 1000 };

  constructor(
    readonly kind: InputKind,
    readonly model: VariantModel,
  ) {}

  check(text: string): FileCheckResult {
    const lines = text.split(/\r?\n/);
    const otherKind = VariantFileCheck.guess(lines);
    const { count, problems, chromosomes } = this.kind === 'fasta' ? this.checkFasta(lines) : this.checkTable(lines);
    const result: FileCheckResult = { count, problems, summary: this.summary(count, chromosomes) };
    if (count > VariantFileCheck.maxVariants) {
      result.limit = `This file has ${number.format(count)} ${nouns[this.kind][1]}; Humanbase runs up to ${number.format(VariantFileCheck.maxVariants)} per job. Split it into two files.`;
    }
    if (otherKind && otherKind !== this.kind) result.otherKind = `This looks like a ${otherKind.toUpperCase()} file. Switch to ${kindNames[otherKind]} to use it.`;
    return result;
  }

  static guess(lines: readonly string[]): InputKind | undefined {
    const first = lines.find((line) => line.trim() && !line.startsWith('#'));
    if (!first) return undefined;
    if (first.startsWith('>')) return 'fasta';
    const columns = first.split('\t');
    if (columns.length >= 5) return 'vcf';
    if (columns.length >= 3 && whole.test(columns[1] ?? '') && whole.test(columns[2] ?? '')) return 'bed';
    return undefined;
  }

  private checkTable(lines: readonly string[]) {
    const problems: FileProblem[] = [];
    const chromosomes = new Set<string>();
    let count = 0;
    lines.forEach((line, index) => {
      if (!line.trim() || line.startsWith('##')) return;
      const lineNumber = index + 1;
      if (line.startsWith('#')) {
        if (this.kind === 'vcf' && !/^#CHROM\tPOS\tID\tREF\tALT/.test(line)) problems.push({ line: lineNumber, rule: 'The header starts with #CHROM POS ID REF ALT.' });
        return;
      }
      count += 1;
      const columns = line.split('\t');
      const rule = this.kind === 'vcf' ? this.vcfRule(columns) : this.bedRule(columns);
      if (rule) problems.push({ line: lineNumber, rule });
      else chromosomes.add(columns[0] ?? '');
    });
    return { count, problems, chromosomes };
  }

  private vcfRule(columns: readonly string[]): string | undefined {
    const [, position = '', , ref = '', alt = '', strand] = columns;
    if (columns.length < 5) return 'Needs 5 tab-separated columns: chromosome, position, ID, REF and ALT.';
    if (!whole.test(position) || position === '0') return `Position is ${position || 'empty'}. Use a whole number from 1.`;
    for (const [name, value] of [['REF', ref], ['ALT', alt]] as const) {
      if (!bases.test(value)) return `${name} is ${value || 'empty'}. Use A, C, G or T.`;
      if (value.length > 100) return `${name} is ${number.format(value.length)} bases. Use up to 100.`;
    }
    if (this.model === 'seqweaver') {
      if (strand === undefined) return 'No strand column. Seqweaver needs + or - in column 6.';
      if (strand !== '+' && strand !== '-') return `Strand is ${strand || 'empty'}. Use + or -.`;
    }
    return undefined;
  }

  private bedRule(columns: readonly string[]): string | undefined {
    const [, start = '', end = ''] = columns;
    if (columns.length < 3) return 'Needs 3 tab-separated columns: chromosome, start and end.';
    if (!whole.test(start) || !whole.test(end)) return 'Start and end are whole numbers, 0 or more.';
    if (Number(end) <= Number(start)) return `End is ${end}. Use a number greater than the start, ${start}.`;
    return undefined;
  }

  private checkFasta(lines: readonly string[]) {
    const length = VariantFileCheck.sequenceLength[this.model];
    const problems: FileProblem[] = [];
    let count = 0;
    let header = 0;
    let sequence = '';
    let orphan = false;
    const close = () => {
      if (header && sequence.length !== length) {
        problems.push({ line: header, rule: `The sequence is ${number.format(sequence.length)} bp; ${modelNames[this.model]} reads ${number.format(length)} bp.` });
      }
    };
    lines.forEach((line, index) => {
      const text = line.trim();
      if (!text) return;
      if (text.startsWith('>')) {
        close();
        count += 1;
        header = index + 1;
        sequence = '';
        return;
      }
      if (!header) {
        if (!orphan) problems.push({ line: index + 1, rule: 'Each sequence starts with a > line.' });
        orphan = true;
        return;
      }
      const upper = text.toUpperCase();
      const wrong = upper.match(/[^ACGT]/);
      if (wrong) problems.push({ line: index + 1, rule: `${wrong[0]} isn’t a base. Use A, C, G or T.` });
      sequence += upper;
    });
    close();
    return { count, problems, chromosomes: new Set<string>() };
  }

  private summary(count: number, chromosomes: ReadonlySet<string>): string {
    const [one, many] = nouns[this.kind];
    const counted = `${number.format(count)} ${count === 1 ? one : many}`;
    if (this.kind === 'fasta') return `${counted}, ${number.format(VariantFileCheck.sequenceLength[this.model])} bp each`;
    const names = VariantFileCheck.chromosomeList(chromosomes);
    return names ? `${counted} on ${names}` : counted;
  }

  // "chromosomes 1 to 22 and X": numbered chromosomes as runs, then named ones.
  static chromosomeList(chromosomes: ReadonlySet<string>): string {
    const names = [...chromosomes].map((name) => name.replace(/^chr/i, '')).filter(Boolean);
    if (!names.length) return '';
    const numbers = [...new Set(names.filter((name) => whole.test(name)).map(Number))].sort((a, b) => a - b);
    const runs: string[] = [];
    for (let i = 0; i < numbers.length; ) {
      let j = i;
      while (j + 1 < numbers.length && numbers[j + 1] === (numbers[j] ?? 0) + 1) j += 1;
      runs.push(j > i + 1 ? `${numbers[i]} to ${numbers[j]}` : numbers.slice(i, j + 1).join(', '));
      i = j + 1;
    }
    const parts = [...runs, ...[...new Set(names.filter((name) => !whole.test(name)))].sort()];
    const list = parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}` : (parts[0] ?? '');
    return `${names.length === 1 ? 'chromosome' : 'chromosomes'} ${list}`;
  }
}
