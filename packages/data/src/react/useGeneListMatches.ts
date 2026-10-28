import { useQuery } from '@tanstack/react-query';
import { useHumanbase } from './HumanbaseProvider';

/** Matches a typed or pasted list in one request; pass terms that have already been debounced. */
export function useGeneListMatches(terms: readonly string[]) {
  const api = useHumanbase();
  return useQuery({ queryKey: ['gene-list', terms.join(' ')], queryFn: ({ signal }) => api.search.list(terms, signal), enabled: terms.length > 0 });
}
