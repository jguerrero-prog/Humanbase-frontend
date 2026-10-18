import { ValueFormat } from '../Table/ValueFormat';

export type PageSlot = number | 'gap';

const format = new ValueFormat();
const maxSlots = 7;

export class PageWindow {
  readonly page: number;
  readonly pageCount: number;

  constructor(
    readonly total: number,
    readonly pageSize: number,
    page: number,
  ) {
    this.pageCount = Math.max(1, Math.ceil(total / pageSize));
    this.page = Math.min(Math.max(1, page), this.pageCount);
  }

  get first(): number {
    return this.total === 0 ? 0 : (this.page - 1) * this.pageSize + 1;
  }

  get last(): number {
    return Math.min(this.page * this.pageSize, this.total);
  }

  get hasPrevious(): boolean {
    return this.page > 1;
  }

  get hasNext(): boolean {
    return this.page < this.pageCount;
  }

  slots(): PageSlot[] {
    const { page, pageCount } = this;
    const run = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, index) => from + index);
    if (pageCount <= maxSlots) return run(1, pageCount);
    if (page <= 4) return [...run(1, 5), 'gap', pageCount];
    if (page >= pageCount - 3) return [1, 'gap', ...run(pageCount - 4, pageCount)];
    return [1, 'gap', page - 1, page, page + 1, 'gap', pageCount];
  }

  range(noun: string): string {
    return `${format.count(this.first)} to ${format.count(this.last)} of ${format.count(this.total)} ${noun}`;
  }

  position(): string {
    return `Page ${format.count(this.page)} of ${format.count(this.pageCount)}`;
  }

  announcement(noun: string): string {
    return `${this.position()}, ${noun} ${format.count(this.first)} to ${format.count(this.last)}`;
  }
}
