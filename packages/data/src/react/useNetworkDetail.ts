import { useQueries, useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { GeneFunction } from '../functions/GeneFunction';
import type { FunctionDatabase } from '../functions/GeneFunctionService';
import type { TermDatabase } from '../functions/TermService';
import { useHumanbase } from './HumanbaseProvider';

/** Every term the network's genes are annotated to; the panels rank them against the genes shown. */
export function useAnnotatedTerms(entrez: readonly number[] | undefined, database: TermDatabase) {
  const api = useHumanbase();
  const ids = [...(entrez ?? [])].sort((a, b) => a - b);
  return useQuery({ queryKey: ['terms-annotated', database, ids], queryFn: () => api.terms.annotated(ids, database), enabled: ids.length > 0, staleTime: Infinity });
}

export function useGeneFunctions(entrez: number | undefined, database: FunctionDatabase) {
  const api = useHumanbase();
  return useQuery({ queryKey: ['gene-functions', entrez, database], queryFn: () => api.functions.get(entrez as number, database), enabled: entrez !== undefined, staleTime: Infinity });
}

export interface GenesFunctions {
  /** One list per gene, in the order asked; undefined until every gene has loaded. */
  data: GeneFunction[][] | undefined;
  isError: boolean;
  /** Retries only the genes that failed. */
  retry: () => void;
}

// Module level, so TanStack Query keeps the combined result stable between renders.
function combineGenes(results: UseQueryResult<GeneFunction[]>[]): GenesFunctions {
  return {
    data: results.length > 0 && results.every((result) => result.data) ? results.map((result) => result.data as GeneFunction[]) : undefined,
    isError: results.some((result) => result.isError),
    retry: () => results.filter((result) => result.isError).forEach((result) => void result.refetch()),
  };
}

/** One request pair per gene and database; a tab shows once every gene has answered. */
export function useGenesFunctions(entrez: readonly number[], database: FunctionDatabase): GenesFunctions {
  const api = useHumanbase();
  return useQueries({
    queries: entrez.map((id) => ({ queryKey: ['gene-functions', id, database], queryFn: () => api.functions.get(id, database), staleTime: Infinity })),
    combine: combineGenes,
  });
}

export function useConnectionEvidence(slug: string, a: number, b: number) {
  const api = useHumanbase();
  return useQuery({ queryKey: ['connection-evidence', slug, Math.min(a, b), Math.max(a, b)], queryFn: () => api.connections.evidence(slug, a, b), staleTime: Infinity });
}

export function useConnectionInAllNetworks(a: number, b: number, enabled: boolean) {
  const api = useHumanbase();
  return useQuery({ queryKey: ['connection-networks', Math.min(a, b), Math.max(a, b)], queryFn: () => api.connections.inAllNetworks(a, b), enabled, staleTime: Infinity });
}
