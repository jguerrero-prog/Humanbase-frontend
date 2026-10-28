import { useQuery } from '@tanstack/react-query';
import { useHumanbase } from './HumanbaseProvider';

const minimumLength = 2;

/** Suggestions for text that has already been debounced; nothing is requested under two characters. */
export function useGeneSuggestions(text: string) {
  const api = useHumanbase();
  const term = text.trim();
  return useQuery({ queryKey: ['gene-suggestions', term], queryFn: ({ signal }) => api.search.suggest(term, signal), enabled: term.length >= minimumLength });
}
