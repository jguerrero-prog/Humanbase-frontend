import { useQueries, useQuery } from '@tanstack/react-query';
import { ApiError } from '../ApiError';
import type { Gene } from '../genes/Gene';
import { useHumanbase } from './HumanbaseProvider';

const geneQuery = (entrez: number) => ['gene', entrez];

export function useGene(entrez: number) {
  const api = useHumanbase();
  return useQuery({ queryKey: geneQuery(entrez), queryFn: () => api.genes.get(entrez) });
}

/** The gene a genes track names by symbol, read as its full record; null when gene search has no exact match. */
export function useGeneBySymbol(symbol: string | undefined) {
  const api = useHumanbase();
  return useQuery({
    queryKey: ['gene-symbol', symbol],
    enabled: Boolean(symbol),
    queryFn: async () => {
      const hits = await api.search.exact(symbol ?? '').catch((error: unknown) => {
        // Not found means no gene matched, as when the API is off and nothing was recorded for this symbol.
        if (error instanceof ApiError && error.isNotFound) return [];
        throw error;
      });
      const hit = hits.find((each) => each.symbol.toUpperCase() === symbol?.toUpperCase()) ?? hits[0];
      return hit ? api.genes.get(hit.entrez) : null;
    },
  });
}

/** Several genes at once, keyed by Entrez ID; genes still loading or not found are left out. */
export function useGenes(entrez: readonly number[]): Map<number, Gene> {
  const api = useHumanbase();
  const results = useQueries({ queries: entrez.map((id) => ({ queryKey: geneQuery(id), queryFn: () => api.genes.get(id), staleTime: Infinity })) });
  return new Map(results.flatMap((result) => (result.data ? [[result.data.entrez, result.data] as const] : [])));
}
