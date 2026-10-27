import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { DataVersion } from '../genes/Gene';
import type { NetworkQuery } from '../networks/NetworkQuery';
import { useHumanbase } from './HumanbaseProvider';

export function useNetwork(query: NetworkQuery) {
  const api = useHumanbase();
  return useQuery({
    queryKey: ['network', query.slug, query.version, [...query.entrez].sort((a, b) => a - b), [...query.dataTypes]],
    queryFn: ({ signal }) => api.networks.get(query, signal),
    enabled: !query.isEmpty,
    retry: false,
    placeholderData: keepPreviousData,
  });
}

export function useDataTypes(version: DataVersion) {
  const api = useHumanbase();
  return useQuery({ queryKey: ['datatypes', version], queryFn: () => api.networks.dataTypes(version), staleTime: Infinity });
}
