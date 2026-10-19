// Not in the schema: an ASD variant as GET /api/variants/?labels__name=asd returns it, its columns as text.
export interface AsdRecord {
  chromosome: string;
  position: number;
  ref_allele: string;
  alt_allele: string;
  features: { asd?: Record<string, string> };
}

export interface AsdVariantRow {
  chromosome: string;
  position: number;
  ref: string;
  alt: string;
  individual: string;
  dnaScore: number | null;
  nearestGene: string;
  tssDistance: number | null;
  rnaScore: number | null;
  rnaGene: string;
  /** Every column the data has, by its name in the data, for the columns the table offers under Columns. */
  columns?: Readonly<Record<string, string>>;
}

const column = {
  individual: 'Individual ID',
  dnaScore: 'DNA Disease impact score',
  nearestGene: 'DNA gene symbol (nearest representative TSS-based)',
  tssDistance: 'Distance to representative TSS',
  rnaScore: 'RNA Disease impact score',
  rnaGene: 'RNA gene symbol',
};

const numberOrNull = (text: string | undefined) => (text === undefined || text.trim() === '' || Number.isNaN(Number(text)) ? null : Number(text));

const counts = new Intl.NumberFormat('en-US');

// One ASD Browser variant, written the way the table shows it.
export class AsdVariant {
  static readonly strong = 1.5;
  static readonly missing = 'Not available';

  constructor(readonly row: AsdVariantRow) {}

  /** The columns the table always shows; the rest stay in columns. */
  static readonly shownColumns: readonly string[] = ['Ref', 'Alt', 'Proband', ...Object.values(column)];

  static fromRecord(record: AsdRecord): AsdVariantRow {
    const values = record.features.asd ?? {};
    return {
      chromosome: record.chromosome,
      position: record.position,
      ref: record.ref_allele,
      alt: record.alt_allele,
      individual: values[column.individual] ?? '',
      dnaScore: numberOrNull(values[column.dnaScore]),
      nearestGene: values[column.nearestGene] ?? '',
      tssDistance: numberOrNull(values[column.tssDistance]),
      rnaScore: numberOrNull(values[column.rnaScore]),
      rnaGene: (values[column.rnaGene] ?? '').split('|').filter(Boolean).join(', '),
      columns: values,
    };
  }

  /** The value of any column by its name in the data, such as Exon junction proximal 200bp, in words. */
  columnValue(name: string): string {
    const value = this.row.columns?.[name]?.trim();
    if (!value) return AsdVariant.missing;
    if (value === 'TRUE') return 'Yes';
    if (value === 'FALSE') return 'No';
    return value;
  }

  /** A column name as the table writes it; the data has doubled spaces in some. */
  static columnLabel(name: string): string {
    return name.replace(/\s+/g, ' ').trim();
  }

  get position(): string {
    return `${this.row.chromosome}:${counts.format(this.row.position)}`;
  }

  get change(): string {
    return `${this.row.ref}>${this.row.alt}`;
  }

  get tssDistance(): string {
    return this.row.tssDistance === null ? AsdVariant.missing : counts.format(this.row.tssDistance);
  }

  get rnaGene(): string {
    return this.row.rnaGene || AsdVariant.missing;
  }

  static score(value: number | null): string {
    if (value === null) return AsdVariant.missing;
    const digits = Math.abs(value).toFixed(3);
    return value < 0 && Number(digits) !== 0 ? `−${digits}` : digits;
  }

  static isStrong(value: number | null): boolean {
    return value !== null && value >= AsdVariant.strong;
  }
}
