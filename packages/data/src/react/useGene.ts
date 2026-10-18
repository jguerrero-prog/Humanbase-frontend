import { useQuery } from '@tanstack/react-query';
import { useHumanBase } from './HumanBaseProvider';

export function useGene(entrez: number) {
  const api = useHumanBase();
  return useQuery({ queryKey: ['gene', entrez], queryFn: () => api.genes.get(entrez) });
}
