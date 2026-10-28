import { useQuery } from '@tanstack/react-query';
import type { AsdFeatureSet, AsdWhere } from '../asd/AsdService';
import type { GenomeLocation } from '../genome/GenomeLocation';
import { useHumanbase } from './HumanbaseProvider';
import { rangeQuery, useReadRange } from './useReadRange';

const rangeKey = (range: GenomeLocation | undefined) => range && `${range.chrom}:${range.start}-${range.end}`;

/** One page of the ASD variants table, across the whole dataset, one chromosome or one range. */
export function useAsdPage(page: number, size: number, where?: AsdWhere) {
  const api = useHumanbase();
  const key = typeof where === 'string' ? where : rangeKey(where);
  return useQuery({ queryKey: ['asd-page', page, size, key], queryFn: ({ signal }) => api.asd.page(page, size, where, signal), staleTime: Infinity });
}

/** The variants the genome browser shows, in genome order. */
export function useAsdRange(range: GenomeLocation | undefined) {
  const api = useHumanbase();
  return useQuery(rangeQuery(['asd-range', rangeKey(range)], (signal) => api.asd.inRange(range as GenomeLocation, signal), Boolean(range)));
}

export function useAsdColumns() {
  const api = useHumanbase();
  return useQuery({ queryKey: ['asd-columns'], queryFn: () => api.asd.columns(), staleTime: Infinity });
}

/** The DNA or RNA feature names, and each variant's predicted effect on them, read for the browser's range as it moves. */
export function useAsdEffects(range: GenomeLocation | undefined, set: AsdFeatureSet) {
  const api = useHumanbase();
  const features = useQuery({ queryKey: ['asd-features', set], queryFn: () => api.asd.features(set), staleTime: Infinity });
  const read = useReadRange(range, set);
  const predictions = useQuery(rangeQuery(['asd-predictions', set, read?.variantRange], (signal) => api.asd.predictions(read as GenomeLocation, set, signal), Boolean(read)));
  return { features, predictions };
}
