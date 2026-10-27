/** "a", "a and b", "a, b and c": the list wording used across Humanbase, without an Oxford comma. */
export const listJoin = (items: readonly string[]) => (items.length < 2 ? (items[0] ?? '') : `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`);

/** "1 gene", "1,200 genes". */
export const genesWord = (count: number) => (count === 1 ? '1 gene' : `${count.toLocaleString('en-US')} genes`);
