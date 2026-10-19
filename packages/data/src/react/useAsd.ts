import { useQuery } from '@tanstack/react-query';
import type { AsdFeatureSet, AsdWhere } from '../asd/AsdService';
import type { GenomeLocation } from '../genome/GenomeLocation';
import { useHumanbase } from './HumanbaseProvider';

const rangeKey = (range: GenomeLocation | undefined) => range && `${range.chrom}:${range.start}-${range.end}`;

/** One page of the ASD variants table, across the whole dataset, one chromosome or one range. */
export function useAsdPage(page: number, size: number, where?: AsdWhere) {
  const api = useHumanbase();
  const key = typeof where === 'string' ? where : rangeKey(where);
  return useQuery({ queryKey: ['asd-page', page, size, key], queryFn: () => api.asd.page(page, size, where), staleTime: Infinity });
}

/** The variants the genome browser shows, in genome order. */
export function useAsdRange(range: GenomeLocation | undefined) {
  const api = useHumanbase();
  return useQuery({ queryKey: ['asd-range', rangeKey(range)], queryFn: () => api.asd.inRange(range as GenomeLocation), enabled: Boolean(range), staleTime: Infinity });
}

export function useAsdColumns() {
  const api = useHumanbase();
  return useQuery({ queryKey: ['asd-columns'], queryFn: () => api.asd.columns(), staleTime: Infinity });
}

/** The DNA or RNA feature names, and each variant's predicted effect on them, for the browser's range. */
export function useAsdEffects(range: GenomeLocation | undefined, set: AsdFeatureSet) {
  const api = useHumanbase();
  const features = useQuery({ queryKey: ['asd-features', set], queryFn: () => api.asd.features(set), staleTime: Infinity });
  const predictions = useQuery({ queryKey: ['asd-predictions', set, rangeKey(range)], queryFn: () => api.asd.predictions(range as GenomeLocation, set), enabled: Boolean(range), staleTime: Infinity });
  return { features, predictions };
}
