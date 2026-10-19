import { useQuery } from '@tanstack/react-query';
import { useHumanbase } from './HumanbaseProvider';

export function useGene(entrez: number) {
  const api = useHumanbase();
  return useQuery({ queryKey: ['gene', entrez], queryFn: () => api.genes.get(entrez) });
}
