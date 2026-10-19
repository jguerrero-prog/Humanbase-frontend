import { useQueries, useQuery } from '@tanstack/react-query';
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

/** One request pair per gene, so a tab can show each gene's column as soon as it arrives. */
export function useGenesFunctions(entrez: readonly number[], database: FunctionDatabase) {
  const api = useHumanbase();
  return useQueries({
    queries: entrez.map((id) => ({ queryKey: ['gene-functions', id, database], queryFn: () => api.functions.get(id, database), staleTime: Infinity })),
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
