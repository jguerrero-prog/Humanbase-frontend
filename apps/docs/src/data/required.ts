// Docs examples read fixed data, so a missing item stops the build and names what is missing.
export function required<T>(value: T | undefined, name: string): T {
  if (value === undefined) throw new Error(`The docs example data has no ${name}.`);
  return value;
}
