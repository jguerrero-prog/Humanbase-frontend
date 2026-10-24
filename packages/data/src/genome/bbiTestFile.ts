// For tests only: writes a small uncompressed bigWig or bigBed file, laid out as UCSC's bbiFile spec describes.
export interface TestItem {
  chrom: string;
  /** 0-based, as in the file. */
  start: number;
  end: number;
  /** A bigWig's score. */
  value?: number;
  /** A bigBed line after chrom, start and end, tab-separated. */
  rest?: string;
}

export interface TestFile {
  kind: 'bigWig' | 'bigBed';
  chromosomes: readonly { name: string; length: number }[];
  items: readonly TestItem[];
}

const magic = { bigWig: 0x888ffc26, bigBed: 0x8789f2eb };
const encoder = new TextEncoder();

class Writer {
  private bytes: number[] = [];

  get length() {
    return this.bytes.length;
  }

  u8(value: number) {
    this.bytes.push(value & 0xff);
  }

  u16(value: number) {
    this.u8(value);
    this.u8(value >> 8);
  }

  u32(value: number) {
    this.u16(value & 0xffff);
    this.u16(value >>> 16);
  }

  u64(value: number) {
    this.u32(value % 2 ** 32);
    this.u32(Math.floor(value / 2 ** 32));
  }

  f32(value: number) {
    this.bytes.push(...new Uint8Array(new Float32Array([value]).buffer));
  }

  f64(value: number) {
    this.bytes.push(...new Uint8Array(new Float64Array([value]).buffer));
  }

  text(value: string, size?: number) {
    const encoded = encoder.encode(value);
    this.bytes.push(...encoded);
    for (let pad = encoded.length; pad < (size ?? encoded.length); pad += 1) this.u8(0);
  }

  set64(at: number, value: number) {
    const patch = new Writer();
    patch.u64(value);
    this.bytes.splice(at, 8, ...patch.bytes);
  }

  done() {
    return new Uint8Array(this.bytes);
  }
}

/** One data block per chromosome, indexed by a single-leaf R-tree. */
export function bbiTestFile({ kind, chromosomes, items }: TestFile): Uint8Array {
  const file = new Writer();
  const values = items.map((item) => item.value ?? 0);
  file.u32(magic[kind]);
  file.u16(4);
  file.u16(0);
  const offsets = file.length;
  for (let field = 0; field < 3; field += 1) file.u64(0);
  file.u16(kind === 'bigBed' ? 3 + (items[0]?.rest?.split('\t').length ?? 0) : 0);
  file.u16(kind === 'bigBed' ? 3 + (items[0]?.rest?.split('\t').length ?? 0) : 0);
  file.u64(0);
  file.u64(64);
  file.u32(0);
  file.u64(0);

  file.u64(items.reduce((sum, item) => sum + item.end - item.start, 0));
  file.f64(Math.min(...values));
  file.f64(Math.max(...values));
  file.f64(values.reduce((sum, value) => sum + value, 0));
  file.f64(values.reduce((sum, value) => sum + value * value, 0));

  const keySize = Math.max(...chromosomes.map((chrom) => encoder.encode(chrom.name).length));
  file.set64(offsets, file.length);
  file.u32(0x78ca8c91);
  file.u32(chromosomes.length);
  file.u32(keySize);
  file.u32(8);
  file.u64(chromosomes.length);
  file.u64(0);
  file.u8(1);
  file.u8(0);
  file.u16(chromosomes.length);
  chromosomes.forEach((chrom, id) => {
    file.text(chrom.name, keySize);
    file.u32(id);
    file.u32(chrom.length);
  });

  file.set64(offsets + 8, file.length);
  file.u64(0);
  const blocks = chromosomes.flatMap((chrom, id) => {
    const own = items.filter((item) => item.chrom === chrom.name);
    const [first, last] = [own[0], own.at(-1)];
    if (!first || !last) return [];
    const offset = file.length;
    if (kind === 'bigWig') {
      file.u32(id);
      file.u32(first.start);
      file.u32(last.end);
      file.u32(0);
      file.u32(0);
      file.u8(1);
      file.u8(0);
      file.u16(own.length);
    }
    for (const item of own) {
      if (kind === 'bigBed') file.u32(id);
      file.u32(item.start);
      file.u32(item.end);
      if (kind === 'bigWig') file.f32(item.value ?? 0);
      else file.text(`${item.rest ?? ''}\0`);
    }
    return [{ id, start: first.start, end: Math.max(...own.map((item) => item.end)), offset, size: file.length - offset }];
  });

  file.set64(offsets + 16, file.length);
  file.u32(0x2468ace0);
  file.u32(Math.max(1, blocks.length));
  file.u64(blocks.length);
  file.u32(blocks[0]?.id ?? 0);
  file.u32(blocks[0]?.start ?? 0);
  file.u32(blocks.at(-1)?.id ?? 0);
  file.u32(blocks.at(-1)?.end ?? 0);
  file.u64(file.length);
  file.u32(items.length);
  file.u32(0);
  file.u8(1);
  file.u8(0);
  file.u16(blocks.length);
  for (const block of blocks) {
    file.u32(block.id);
    file.u32(block.start);
    file.u32(block.id);
    file.u32(block.end);
    file.u64(block.offset);
    file.u64(block.size);
  }
  return file.done();
}
