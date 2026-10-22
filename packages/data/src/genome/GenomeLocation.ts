import chromosomeSizes from './chromosomeSizes.json';

export type Assembly = 'hg19' | 'hg38';

export const assemblyNames: Record<Assembly, string> = { hg19: 'GRCh37/hg19', hg38: 'GRCh38/hg38' };

const count = new Intl.NumberFormat('en-US');
const range = /^(?:chr)?([0-9]{1,2}|X|Y|M|MT):([\d,]+)(?:-|\.\.)([\d,]+)$/i;
const geneName = /^[A-Za-z][A-Za-z0-9.-]*$/;

export class GenomeLocation {
  static readonly zoomStops = [200, 2_000, 50_000, 500_000] as const;
  static readonly readAhead = 50_000;

  constructor(
    readonly chrom: string,
    readonly start: number,
    readonly end: number,
    readonly assembly: Assembly = 'hg19',
  ) {}

  // Reads "chr1:109,792,590-109,842,590", today's "1:109,767,590..109,867,590", or a gene name.
  static parse(text: string, assembly: Assembly = 'hg19'): GenomeLocation | { gene: string } | undefined {
    const typed = text.trim();
    const match = range.exec(typed.replace(/\s+/g, ''));
    if (match) {
      const [, chrom = '', from = '', to = ''] = match;
      const [start, end] = [from, to].map((value) => Number(value.replaceAll(',', ''))) as [number, number];
      const name = chrom.toUpperCase() === 'MT' ? 'M' : chrom.toUpperCase();
      return new GenomeLocation(`chr${name}`, Math.min(start, end), Math.max(start, end), assembly);
    }
    return geneName.test(typed) ? { gene: typed } : undefined;
  }

  /** The main chromosomes' lengths in bases, recorded from UCSC by scripts/record-chrom-sizes.mjs. */
  static chromosomes(assembly: Assembly): Readonly<Record<string, number>> {
    return chromosomeSizes[assembly];
  }

  static widthInWords(bases: number): string {
    if (bases >= 1_000_000) return `${Number((bases / 1_000_000).toFixed(1))} Mb`;
    if (bases >= 1_000) return `${Number((bases / 1_000).toFixed(1))} kb`;
    return `${bases} bp`;
  }

  static geneNotFound(name: string, assembly: Assembly = 'hg19'): string {
    return `No gene named “${name}” on ${assemblyNames[assembly]}. Check the spelling, or enter a position such as chr2:113,594,867.`;
  }

  get width(): number {
    return this.end - this.start;
  }

  get center(): number {
    return Math.round((this.start + this.end) / 2);
  }

  get assemblyName(): string {
    return assemblyNames[this.assembly];
  }

  get chromosomeLength(): number | undefined {
    return GenomeLocation.chromosomes(this.assembly)[this.chrom];
  }

  /** One base, such as a variant; the chromosome may come with or without "chr". */
  static at(chromosome: string, position: number, assembly: Assembly = 'hg19'): GenomeLocation {
    return new GenomeLocation(chromosome.startsWith('chr') ? chromosome : `chr${chromosome}`, position, position, assembly);
  }

  /** The same place on the UCSC Genome Browser, where humanbase.io sends positions. */
  get ucscUrl(): string {
    const place = this.start === this.end ? `${this.chrom}:${this.start}` : `${this.chrom}:${this.start}-${this.end}`;
    return `https://genome.ucsc.edu/cgi-bin/hgTracks?db=${this.assembly}&position=${place}`;
  }

  format(): string {
    return `${this.chrom}:${count.format(this.start)}-${count.format(this.end)}`;
  }

  help(): string {
    return `${this.assemblyName}. ${GenomeLocation.widthInWords(this.width)} shown. A gene name works too.`;
  }

  regionLabel(trackCount: number): string {
    return `Genome browser, ${this.format()}, ${this.assemblyName}, ${trackCount} ${trackCount === 1 ? 'track' : 'tracks'}`;
  }

  fileName(extension = 'svg'): string {
    return `${this.chrom}_${this.start}-${this.end}_${this.assembly}.${extension}`;
  }

  withWidth(width: number): GenomeLocation {
    return this.startingAt(this.center - Math.round(width / 2), width);
  }

  // One zoom step goes to the next stop in that direction; the view can sit between stops.
  zoom(direction: 'in' | 'out'): GenomeLocation {
    const stops = GenomeLocation.zoomStops;
    const next = direction === 'in' ? [...stops].reverse().find((stop) => stop < this.width) : stops.find((stop) => stop > this.width);
    return this.withWidth(next ?? (direction === 'in' ? stops[0] : stops[3]));
  }

  move(fraction: number): GenomeLocation {
    return this.startingAt(this.start + Math.round(this.width * fraction), this.width);
  }

  // Panning and zooming stop at either end of the chromosome.
  private startingAt(start: number, width: number): GenomeLocation {
    const from = Math.max(0, start);
    return new GenomeLocation(this.chrom, from, from + width, this.assembly).clamp(this.chromosomeLength ?? Infinity).location;
  }

  /** The chr_and_variant_range parameter for predictions in this range, such as 1:2230000:2440000. */
  get variantRange(): string {
    return `${this.chrom.replace(/^chr/i, '')}:${this.start}:${this.end}`;
  }

  /** Whether a variant sits in this range; its chromosome may come with or without "chr". */
  includes(chromosome: string, position: number): boolean {
    return GenomeLocation.at(chromosome, position).chrom === this.chrom && position >= this.start && position <= this.end;
  }

  /** The variant in this range nearest its center, as humanbase.io picks the heatmap's center variant. */
  nearest<T extends { chromosome: string; position: number }>(variants: readonly T[]): T | undefined {
    const distance = (variant: T) => Math.abs(variant.position - this.center);
    return variants.filter((variant) => this.includes(variant.chromosome, variant.position)).reduce<T | undefined>((best, variant) => (best && distance(best) <= distance(variant) ? best : variant), undefined);
  }

  /**
   * The range to read predictions for this view, as humanbase.io does: the range already read while it covers the view,
   * that range stretched 50 kb past the view when the view moves over one edge, and otherwise the view itself.
   */
  readRange(read: GenomeLocation | undefined): GenomeLocation {
    if (!read || read.chrom !== this.chrom) return this;
    if (this.start >= read.start && this.end <= read.end) return read;
    const overlaps = (this.start >= read.start && this.start <= read.end) || (this.end >= read.start && this.end <= read.end);
    if (!overlaps) return this;
    return this.end >= read.end
      ? new GenomeLocation(this.chrom, read.start, this.end + GenomeLocation.readAhead, this.assembly)
      : new GenomeLocation(this.chrom, Math.max(0, this.start - GenomeLocation.readAhead), read.end, this.assembly);
  }

  /** A typed view kept on its chromosome, with the reason when it moved; no location when the chromosome isn't on the assembly. */
  fit(): { location?: GenomeLocation; message?: string } {
    const length = this.chromosomeLength;
    if (length === undefined) return { message: `There is no ${this.chrom} on ${this.assemblyName}. Enter chr1 to chr22, chrX, chrY or chrM.` };
    return this.clamp(length);
  }

  clamp(chromosomeLength: number): { location: GenomeLocation; message?: string } {
    if (this.end <= chromosomeLength) return { location: this };
    const location = new GenomeLocation(this.chrom, Math.max(0, chromosomeLength - this.width), chromosomeLength, this.assembly);
    return { location, message: `${this.chrom} ends at ${count.format(chromosomeLength)} on ${this.assemblyName}. Showing up to the end.` };
  }
}
