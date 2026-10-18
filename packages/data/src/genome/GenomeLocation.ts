export type Assembly = 'hg19' | 'hg38';

export const assemblyNames: Record<Assembly, string> = { hg19: 'GRCh37/hg19', hg38: 'GRCh38/hg38' };

const count = new Intl.NumberFormat('en-US');
const range = /^(?:chr)?([0-9]{1,2}|X|Y|M|MT):([\d,]+)(?:-|\.\.)([\d,]+)$/i;
const geneName = /^[A-Za-z][A-Za-z0-9.-]*$/;

export class GenomeLocation {
  static readonly zoomStops = [200, 2_000, 50_000, 500_000] as const;

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
      return new GenomeLocation(`chr${chrom.toUpperCase()}`, Math.min(start, end), Math.max(start, end), assembly);
    }
    return geneName.test(typed) ? { gene: typed } : undefined;
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
    const start = Math.max(0, this.center - Math.round(width / 2));
    return new GenomeLocation(this.chrom, start, start + width, this.assembly);
  }

  // One zoom step goes to the next stop in that direction; the view can sit between stops.
  zoom(direction: 'in' | 'out'): GenomeLocation {
    const stops = GenomeLocation.zoomStops;
    const next = direction === 'in' ? [...stops].reverse().find((stop) => stop < this.width) : stops.find((stop) => stop > this.width);
    return this.withWidth(next ?? (direction === 'in' ? stops[0] : stops[3]));
  }

  move(fraction: number): GenomeLocation {
    const start = Math.max(0, this.start + Math.round(this.width * fraction));
    return new GenomeLocation(this.chrom, start, start + this.width, this.assembly);
  }

  // The chromosome length comes from the engine; the browser never guesses it.
  clamp(chromosomeLength: number): { location: GenomeLocation; message?: string } {
    if (this.end <= chromosomeLength) return { location: this };
    const location = new GenomeLocation(this.chrom, Math.max(0, chromosomeLength - this.width), chromosomeLength, this.assembly);
    return { location, message: `${this.chrom} ends at ${count.format(chromosomeLength)} on ${this.assemblyName}. Showing up to the end.` };
  }
}
