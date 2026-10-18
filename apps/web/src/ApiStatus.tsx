import { useGene } from '@humanbase/data';

const probeEntrez = 3553;

export function ApiStatus() {
  const { data: gene, isPending, isError } = useGene(probeEntrez);

  if (isPending) return <p role="status">Checking the API…</p>;
  if (isError) return <p role="alert">The API could not be reached. Check apiBase in config.json and the dev proxy target.</p>;
  return (
    <p role="status">
      Connected. Gene {gene.entrez} is {gene.symbol}, {gene.name}.
    </p>
  );
}
