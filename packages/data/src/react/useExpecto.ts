import { useQuery } from '@tanstack/react-query';
import type { VariantQuery } from '../expecto/ExpectoService';
import type { TissueDatabase } from '../expecto/TissueVariants';
import { useHumanbase } from './HumanbaseProvider';

/** A gene's predicted effects in every ExPecto tissue or ExPecto SC cell type. */
export function useTissueVariants(entrez: number | undefined, database: TissueDatabase) {
  const api = useHumanbase();
  return useQuery({
    queryKey: ['tissue-variants', database, entrez],
    queryFn: () => api.expecto.tissueVariants(entrez ?? 0, database),
    enabled: entrez !== undefined,
    retry: false,
    staleTime: Infinity,
  });
}

export function useVariantSearch(query: VariantQuery | undefined) {
  const api = useHumanbase();
  return useQuery({ queryKey: ['expecto-variants', query], queryFn: () => api.expecto.searchVariants(query as VariantQuery), enabled: query !== undefined, staleTime: Infinity });
}

export function useVariantTotal() {
  const api = useHumanbase();
  return useQuery({ queryKey: ['expecto-variant-total'], queryFn: () => api.expecto.variantTotal(), staleTime: Infinity });
}
