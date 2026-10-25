import { useQuery } from '@tanstack/react-query';
import { GenomeLocation, type Assembly } from '../genome/GenomeLocation';
import { useHumanbase } from './HumanbaseProvider';

/** Where a gene sits on an assembly, from the genome browser's own gene index; null when the index has no gene by that name. */
export function useGeneLocation(name: string | undefined, assembly: Assembly) {
  const api = useHumanbase();
  return useQuery({
    queryKey: ['gene-location', name?.toLowerCase(), assembly],
    queryFn: async () => {
      const span = await api.geneLocator.locate(name ?? '', assembly);
      return span ? new GenomeLocation(span.chrom, span.start, span.end, assembly) : null;
    },
    enabled: Boolean(name),
    staleTime: Infinity,
  });
}
