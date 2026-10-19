import { useGene, useHumanBase } from '@humanbase/data';

const probeEntrez = 3553;

export function ApiStatus() {
  const { showsSamples } = useHumanBase();
  const { data: gene, isPending, isError } = useGene(probeEntrez);

  if (isPending) return <p role="status">{showsSamples ? 'Loading sample data…' : 'Checking the API…'}</p>;
  if (isError) return <p role="alert">The API could not be reached. Check apiBase in config.json and the dev proxy target.</p>;
  const found = `Gene ${gene.entrez} is ${gene.symbol}, ${gene.name}.`;
  return <p role="status">{showsSamples ? `The API is off, so this is sample data. ${found}` : `Connected. ${found}`}</p>;
}
