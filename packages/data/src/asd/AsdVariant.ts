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
}

const counts = new Intl.NumberFormat('en-US');

// One ASD Browser variant, written the way the table shows it.
export class AsdVariant {
  static readonly strong = 1.5;
  static readonly missing = 'Not available';

  constructor(readonly row: AsdVariantRow) {}

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
