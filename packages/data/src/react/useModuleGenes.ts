import { useQuery } from '@tanstack/react-query';
import { GeneHit } from '../genes/GeneHit';
import type { ModuleResult } from '../modules/ModuleResult';
import { useHumanbase } from './HumanbaseProvider';

/** Symbols and names for every gene in a module result: from the result itself, or looked up by Entrez ID when it doesn't carry them. */
export function useModuleGenes(result: ModuleResult | undefined) {
  const api = useHumanbase();
  const entrez = result?.entrez ?? [];
  return useQuery({
    queryKey: ['module-genes', [...entrez]],
    queryFn: async ({ signal }) => {
      const own = result?.geneRecords();
      if (own) return new Map(own.map((record) => [record.entrez, new GeneHit(record)] as const));
      const matches = await api.search.list(entrez.map(String), signal);
      return new Map<number, GeneHit>(matches.flatMap((term) => term.genes.slice(0, 1).map((gene) => [gene.entrez, gene] as const)));
    },
    enabled: entrez.length > 0,
    staleTime: Infinity,
  });
}
