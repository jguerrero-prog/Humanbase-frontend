import { GenomeLocation, type Assembly } from '../genome/GenomeLocation';

const whole = /^\d+$/;
const count = new Intl.NumberFormat('en-US');

/** One region of a BED file. BED starts count from 0 and ends are left out, so the region covers bases start + 1 to end, as genome browsers number them. */
export class BedRegion {
  constructor(
    readonly chromosome: string,
    readonly start: number,
    readonly end: number,
  ) {}

  /** The file's regions in its own order; header, track and browser lines, and lines the form would refuse, are skipped. */
  static parse(text: string): BedRegion[] {
    return text.split(/\r?\n/).flatMap((line) => {
      if (!line.trim() || line.startsWith('#') || /^(track|browser)\b/.test(line)) return [];
      const [chromosome = '', start = '', end = ''] = line.split('\t');
      if (!chromosome || !whole.test(start) || !whole.test(end) || Number(end) <= Number(start)) return [];
      return [new BedRegion(chromosome.startsWith('chr') ? chromosome : `chr${chromosome}`, Number(start), Number(end))];
    });
  }

  get first(): number {
    return this.start + 1;
  }

  get width(): number {
    return this.end - this.start;
  }

  /** The base the browser marks: the region's own base, or its middle one. */
  get position(): number {
    return Math.floor((this.first + this.end) / 2);
  }

  /** Such as chr1:109,817,091, or chr1:1,001-2,000 for a wider region. */
  get label(): string {
    return this.width === 1 ? `${this.chromosome}:${count.format(this.first)}` : `${this.chromosome}:${count.format(this.first)}-${count.format(this.end)}`;
  }

  /** The view around the region: at least the given width, with room on both sides of a wider region. */
  view(assembly: Assembly, width: number): GenomeLocation {
    const around = GenomeLocation.at(this.chromosome, this.position, assembly).withWidth(Math.max(width, this.width * 2));
    return around.fit().location ?? around;
  }
}
