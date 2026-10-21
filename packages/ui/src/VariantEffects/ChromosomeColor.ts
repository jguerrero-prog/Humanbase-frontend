/** A chromosome's color in the variant score plot, such as --viz-chromosome-3 for chr3; humanbase.io gives each of the 24 its own. */
export function chromosomeColor(chromosome: string) {
  const id = chromosome.replace(/^chr/i, '').toLowerCase();
  return /^([1-9]|1\d|2[0-2]|x|y)$/.test(id) ? `--viz-chromosome-${id}` : undefined;
}
